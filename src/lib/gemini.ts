import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export type GeminiOpts = {
  prompt: string;
  system?: string;
  json?: boolean;
  responseSchema?: Record<string, unknown>;
  image?: { mime: string; data: string };
  maxOutputTokens?: number;
  temperature?: number;
  smart?: boolean;
};

interface GeminiKeyEntry {
  apiKey: string;
  label: string;
}

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"] as const;

const COOLDOWN: Record<string, number> = {};
let keyCursor = 0;

const CONSISTENT_OUTPUT_CONTRACT = `ATURAN KONSISTENSI OUTPUT WAJIB:
1. Gunakan bahasa yang sama persis dengan materi/pertanyaan pengguna (default Bahasa Indonesia yang baku dan jelas).
2. Dilarang menulis basa-basi pembuka/penutup ("Tentu", "Berikut adalah", "Semoga membantu") atau komentar meta.
3. Dilarang menampilkan proses berpikir internal atau tag <think>. Langsung berikan hasil akhir sesuai format.
4. Patuhi struktur heading, skema JSON, dan batas panjang yang diminta secara persis agar output selalu konsisten.`;

function buildSystemInstruction(system?: string): string {
  return system ? `${system}\n\n${CONSISTENT_OUTPUT_CONTRACT}` : CONSISTENT_OUTPUT_CONTRACT;
}

function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function collectGeminiKeys(): GeminiKeyEntry[] {
  const seen = new Set<string>();
  const entries: GeminiKeyEntry[] = [];

  const push = (val: string | undefined, label: string) => {
    const trimmed = val?.trim();
    if (trimmed && !trimmed.startsWith("MY_") && !seen.has(trimmed)) {
      seen.add(trimmed);
      entries.push({ apiKey: trimmed, label });
    }
  };

  for (let i = 1; i <= 20; i++) {
    push(process.env[`G_API_${i}`], `G_API_${i}`);
    push(process.env[`G_api_${i}`], `G_api_${i}`);
    push(process.env[`GEMINI_KEY_${i}`], `GEMINI_KEY_${i}`);
    push(process.env[`api_${i}`], `api_${i}`);
  }
  push(process.env.GEMINI_API_KEY, "GEMINI_API_KEY");

  return entries;
}

function buildKeyQueue(): GeminiKeyEntry[] {
  const list = collectGeminiKeys();
  if (list.length === 0) return [];

  const now = Date.now();
  const start = keyCursor % list.length;
  keyCursor = (start + 1) % list.length;

  const active: GeminiKeyEntry[] = [];
  const cooledDown: GeminiKeyEntry[] = [];

  for (let i = 0; i < list.length; i++) {
    const entry = list[(start + i) % list.length];
    if ((COOLDOWN[entry.apiKey] || 0) <= now) {
      active.push(entry);
    } else {
      cooledDown.push(entry);
    }
  }

  return [...active, ...cooledDown];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function invokeGeminiModel(
  apiKey: string,
  model: (typeof GEMINI_MODELS)[number],
  opts: GeminiOpts,
  useThinking: boolean
): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const contents: unknown[] = [];
  if (opts.image) {
    contents.push({
      inlineData: {
        mimeType: opts.image.mime,
        data: opts.image.data,
      },
    });
  }
  contents.push(opts.prompt);

  const config: Record<string, unknown> = {
    systemInstruction: buildSystemInstruction(opts.system),
    temperature: 0,
    seed: 42,
    maxOutputTokens: Math.max(opts.maxOutputTokens ?? 4096, 6144),
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (opts.json) {
    config.responseMimeType = "application/json";
    if (opts.responseSchema) {
      config.responseSchema = opts.responseSchema;
    }
  }

  const response = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: config as any,
  });

  const text = stripThinkingTags(response.text || "");
  if (!text) {
    throw new Error(`Respons kosong dari ${model}`);
  }
  return text;
}

async function callGemini(
  apiKey: string,
  model: (typeof GEMINI_MODELS)[number],
  opts: GeminiOpts
): Promise<string> {
  try {
    return await invokeGeminiModel(apiKey, model, opts, true);
  } catch (e: any) {
    const msg = (e?.message || String(e)).toLowerCase();
    // If a specific Flash Lite model does not accept thinkingConfig, retry deterministically without it
    if (msg.includes("thinking") && (msg.includes("400") || msg.includes("invalid") || msg.includes("unsupported"))) {
      return await invokeGeminiModel(apiKey, model, opts, false);
    }
    throw e;
  }
}

export async function geminiGenerate(opts: GeminiOpts): Promise<string> {
  const queue = buildKeyQueue();
  if (queue.length === 0) {
    throw new Error(
      "Belum ada API key Gemini. Tambahkan G_API_1 sampai G_API_20 (contoh: G_API_1, G_API_2, G_API_3)."
    );
  }

  let lastError = "";

  for (const entry of queue) {
    for (const model of GEMINI_MODELS) {
      try {
        return await callGemini(entry.apiKey, model, opts);
      } catch (e: any) {
        const msg = e?.message || String(e);
        lastError = `[${entry.label} | ${model}] ${msg}`;
        const lower = msg.toLowerCase();

        if (
          lower.includes("401") ||
          lower.includes("403") ||
          lower.includes("api_key_invalid") ||
          lower.includes("invalid api key") ||
          lower.includes("permission_denied")
        ) {
          COOLDOWN[entry.apiKey] = Date.now() + 300_000;
          break;
        }

        if (
          msg.includes("429") ||
          lower.includes("quota") ||
          lower.includes("rate limit") ||
          lower.includes("resource_exhausted")
        ) {
          COOLDOWN[entry.apiKey] = Date.now() + 60_000;
          await sleep(300);
          break;
        }

        if (msg.includes("503") || lower.includes("high demand")) {
          await sleep(400);
        }
      }
    }
  }

  throw new Error(`Gemini AI error: ${lastError}`);
}

export function parseJSON<T>(raw: string): T {
  let s = stripThinkingTags(raw);
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const normalize = (val: unknown): T => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      if (!("topics" in obj)) {
        for (const k of ["flashcards", "cards", "questions", "items", "data"]) {
          if (Array.isArray(obj[k])) {
            return obj[k] as T;
          }
        }
      }
    }
    return val as T;
  };

  try {
    return normalize(JSON.parse(s));
  } catch {
    const startObj = s.indexOf("{");
    const startArr = s.indexOf("[");
    const start =
      startObj === -1
        ? startArr
        : startArr === -1
        ? startObj
        : Math.min(startObj, startArr);
    if (start !== -1) {
      const endObj = s.lastIndexOf("}");
      const endArr = s.lastIndexOf("]");
      const end = Math.max(endObj, endArr);
      if (end > start) return normalize(JSON.parse(s.slice(start, end + 1)));
    }
    throw new Error(`Respons AI bukan JSON valid: ${s.slice(0, 200)}`);
  }
}
