import { Type } from "@google/genai";
import { geminiGenerate, parseJSON } from "./gemini";

export type SerapConcept = {
  name: string;
  definition?: string;
  formulas?: string;
  examples?: string;
  keyTerms?: string;
};

export type SerapTopic = {
  title: string;
  description?: string;
  concepts: SerapConcept[];
};

export type SerapResult = {
  title: string;
  topics: SerapTopic[];
};

const SERAP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Judul materi singkat dan jelas" },
    topics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                definition: { type: Type.STRING },
                formulas: { type: Type.STRING },
                examples: { type: Type.STRING },
                keyTerms: { type: Type.STRING },
              },
              required: ["name", "definition", "formulas", "examples", "keyTerms"],
            },
          },
        },
        required: ["title", "description", "concepts"],
      },
    },
  },
  required: ["title", "topics"],
};

const FLASHCARD_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: { type: Type.STRING },
      back: { type: Type.STRING },
      concept: { type: Type.STRING },
    },
    required: ["front", "back", "concept"],
  },
};

const QUESTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      answerIndex: { type: Type.INTEGER },
      explanation: { type: Type.STRING },
      difficulty: { type: Type.INTEGER },
      concept: { type: Type.STRING },
    },
    required: ["question", "options", "answerIndex", "explanation", "difficulty", "concept"],
  },
};

const MATERIAL_SYS = `Anda adalah "AI SERAP MATERI", bagian dari CamesAcademic.
Tugas Anda: membaca materi mentah lalu menyusunnya menjadi struktur belajar yang sangat akurat dan konsisten.
Aturan wajib:
- Hanya gunakan fakta dari materi yang diberikan. Jangan mengarang.
- Gunakan bahasa yang sama persis dengan bahasa materi.
- title: judul materi singkat, padat, dan spesifik (3-8 kata).
- Maksimal 5 topik, tiap topik maksimal 4 konsep.
- Setiap objek konsep WAJIB memiliki 5 field string: name, definition (1-2 kalimat padat), formulas (pisahkan dengan "; ", isi "" jika tidak ada), examples (contoh konkret dari materi, isi "" jika tidak ada), keyTerms (pisahkan dengan "; ", isi "" jika tidak ada).`;

function cleanText(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val.trim() : fallback;
}

function extractConceptNames(structure: string): string[] {
  const names: string[] = [];
  for (const line of structure.split("\n")) {
    const m = line.match(/^-\s+([^:]+):/);
    if (m && m[1]?.trim()) names.push(m[1].trim());
  }
  return names;
}

function matchConceptName(rawConcept: unknown, validNames: string[]): string {
  const candidate = cleanText(rawConcept, validNames[0] || "Konsep Inti");
  if (validNames.length === 0) return candidate;
  const exact = validNames.find((n) => n.toLowerCase() === candidate.toLowerCase());
  if (exact) return exact;
  const partial = validNames.find(
    (n) =>
      n.toLowerCase().includes(candidate.toLowerCase()) ||
      candidate.toLowerCase().includes(n.toLowerCase())
  );
  return partial || validNames[0];
}

export async function serapMateri(rawText: string): Promise<SerapResult> {
  const prompt = `Susun materi berikut menjadi JSON object persis mengikuti skema ini:
{"title": string, "topics": [{"title": string, "description": string, "concepts": [{"name": string, "definition": string, "formulas": string, "examples": string, "keyTerms": string}]}]}

=== MATERI ===
${rawText.slice(0, 24000)}`;

  try {
    const raw = await geminiGenerate({
      system: MATERIAL_SYS,
      prompt,
      json: true,
      responseSchema: SERAP_SCHEMA,
      smart: true,
      maxOutputTokens: 4096,
    });

    const parsed = parseJSON<SerapResult>(raw);
    if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
      throw new Error("AI tidak menemukan struktur materi.");
    }

    const normalizedTopics: SerapTopic[] = parsed.topics.slice(0, 5).map((t, idx) => ({
      title: cleanText(t.title, `Topik ${idx + 1}`),
      description: cleanText(t.description),
      concepts: (Array.isArray(t.concepts) ? t.concepts : []).slice(0, 4).map((c, cIdx) => ({
        name: cleanText(c.name, `Konsep ${cIdx + 1}`),
        definition: cleanText(c.definition),
        formulas: cleanText(c.formulas),
        examples: cleanText(c.examples),
        keyTerms: cleanText(c.keyTerms),
      })),
    }));

    return {
      title: cleanText(parsed.title, "Materi Pembelajaran"),
      topics: normalizedTopics,
    };
  } catch {
    const cleanRaw = rawText.replace(/[\x00-\x1F\x7F\uFFFD]/g, " ").replace(/\s+/g, " ").trim();
    const firstLine = rawText
      .trim()
      .split("\n")[0]
      ?.replace(/[\x00-\x1F\x7F\uFFFD]/g, "")
      .replace(/^#+\s*/, "")
      .trim() || "";
    const derivedTitle =
      firstLine.length > 3 && firstLine.length < 80 && !/^jfif$/i.test(firstLine)
        ? firstLine
        : "Materi Pembelajaran";

    return {
      title: derivedTitle,
      topics: [
        {
          title: "Konsep Pokok",
          description: "Struktur inti dan pemahaman materi",
          concepts: [
            {
              name: "Konsep Inti",
              definition: cleanRaw.slice(0, 180) || "Materi pembelajaran terstruktur",
              formulas: "",
              examples: "Aplikasi pada contoh nyata",
              keyTerms: "konsep; prinsip dasar",
            },
          ],
        },
      ],
    };
  }
}

export function structureText(topics: SerapTopic[]): string {
  return topics
    .map(
      (t) =>
        `# ${t.title}${t.description ? ` — ${t.description}` : ""}\n` +
        t.concepts
          .map(
            (c) =>
              `- ${c.name}: ${c.definition || ""}` +
              (c.formulas ? ` | Rumus: ${c.formulas}` : "") +
              (c.examples ? ` | Contoh: ${c.examples}` : "")
          )
          .join("\n")
    )
    .join("\n\n");
}

export async function buatRingkasan(rawText: string, structure: string): Promise<string> {
  const system = `Anda adalah "AI INTI" CamesAcademic.
Tugas: menyusun RINGKASAN materi yang sangat akurat, terstruktur, dan SERAGAM menggunakan format Markdown baku berikut (WAJIB ikuti urutan dan judul bagian persis seperti ini):

## Ringkasan Materi

### Gambaran Umum
(1 paragraf padat berisi 2-3 kalimat tentang inti materi.)

### Konsep & Poin Utama
- **[Nama Konsep]**: [Penjelasan inti 1-2 kalimat]

### Rumus & Istilah Kunci
- **[Rumus atau Istilah]**: [Arti atau kegunaan singkat] (tulis "- Tidak ada rumus khusus pada materi ini." jika memang tidak ada)

### Contoh Penerapan
- [1-2 poin contoh nyata berdasarkan materi]

Aturan ketat:
- Maksimal 320 kata, tanpa pembuka/penutup di luar format di atas.
- Hanya gunakan informasi dari materi. Gunakan bahasa yang sama dengan materi.`;

  const prompt = `Struktur materi:
${structure}

=== MATERI MENTAH ===
${rawText.slice(0, 18000)}`;

  try {
    const raw = await geminiGenerate({
      system,
      prompt,
      smart: true,
      maxOutputTokens: 2048,
    });
    return raw.trim();
  } catch {
    return `## Ringkasan Materi\n\n### Gambaran Umum\n${rawText.slice(0, 350).trim()}\n\n### Konsep & Poin Utama\n- Pemahaman konsep dasar merupakan pondasi utama dalam mempelajari materi ini.\n- Setiap definisi, rumus, dan prinsip saling berhubungan secara sistematis.\n\n### Rumus & Istilah Kunci\n- Gunakan flashcard dan latihan kuis untuk menguatkan ingatan konsep inti.\n\n### Contoh Penerapan\n- Terapkan konsep langkah demi langkah sesuai konteks permasalahan pada materi.`;
  }
}

export type FlashcardGen = { front: string; back: string; concept: string };

export async function buatFlashcards(structure: string, count = 12): Promise<FlashcardGen[]> {
  const system = `Anda adalah "AI PENJELAS & PEMBERI SOAL" CamesAcademic.
Buat tepat ${count} flashcard pemahaman berkualitas tinggi dalam JSON array persis dengan skema:
[{"front": string, "back": string, "concept": string}]

Aturan ketat agar konsisten di semua model:
- front: 1 pertanyaan langsung, spesifik, dan jelas (tanpa penomoran di depan).
- back: jawaban akurat 1-2 kalimat padat (boleh memuat rumus jika relevan).
- concept: SALIN PERSIS salah satu nama konsep dari struktur materi yang diberikan.
- Distribusikan merata ke seluruh konsep yang ada.`;

  const prompt = `Struktur materi:
${structure}

Buat tepat ${count} flashcard JSON.`;

  try {
    const raw = await geminiGenerate({
      system,
      prompt,
      json: true,
      responseSchema: FLASHCARD_SCHEMA,
      smart: true,
      maxOutputTokens: 4096,
    });
    const parsed = parseJSON<FlashcardGen[]>(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Gagal membuat flashcard.");

    const validConcepts = extractConceptNames(structure);
    return parsed
      .slice(0, count)
      .map((c) => ({
        front: cleanText(c.front).replace(/^\d+[.)]\s*/, ""),
        back: cleanText(c.back),
        concept: matchConceptName(c.concept, validConcepts),
      }))
      .filter((c) => c.front && c.back);
  } catch {
    return [
      {
        front: "Apa definisi utama dari materi ini?",
        back: "Prinsip dasar yang menjelaskan fenomena dan aturan inti dalam bab ini secara terstruktur.",
        concept: "Konsep Inti",
      },
      {
        front: "Bagaimana penerapan konsep ini dalam pemecahan masalah?",
        back: "Dengan mengidentifikasi variabel yang diketahui, menggunakan relasi rumus yang tepat, dan mengevaluasi hasil.",
        concept: "Konsep Inti",
      },
    ];
  }
}

export type QuestionGen = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: number;
  concept: string;
};

export async function buatSoal(structure: string, count = 10): Promise<QuestionGen[]> {
  const system = `Anda adalah "AI PENJELAS & PEMBERI SOAL" CamesAcademic.
Buat tepat ${count} soal pilihan ganda berkualitas tinggi dalam JSON array persis dengan skema:
[{"question": string, "options": [string, string, string, string], "answerIndex": number, "explanation": string, "difficulty": number, "concept": string}]

Aturan ketat agar seragam di semua model:
- options: WAJIB tepat 4 opsi string TANPA awalan huruf ("A.", "B.", dst).
- answerIndex: angka integer 0, 1, 2, atau 3 menunjuk opsi yang benar secara faktual dan logis.
- difficulty: sebar merata antara 1 (mudah/definisi), 2 (sedang/pemahaman), dan 3 (sulit/analisis atau penerapan).
- explanation: pembahasan 1-2 kalimat yang jelas menyebutkan alasan jawaban benar.
- concept: SALIN PERSIS salah satu nama konsep dari struktur materi yang diberikan.`;

  const prompt = `Struktur materi:
${structure}

Buat tepat ${count} soal JSON.`;

  try {
    const raw = await geminiGenerate({
      system,
      prompt,
      json: true,
      responseSchema: QUESTION_SCHEMA,
      smart: true,
      maxOutputTokens: 6144,
    });
    const parsed = parseJSON<QuestionGen[]>(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Gagal membuat soal.");

    const validConcepts = extractConceptNames(structure);
    return parsed
      .map((q) => {
        const cleanOptions = (Array.isArray(q.options) ? q.options : [])
          .slice(0, 4)
          .map((opt) => cleanText(opt).replace(/^[A-Da-d][.)]\s+/, ""));
        const idx = typeof q.answerIndex === "number" ? Math.trunc(q.answerIndex) : 0;
        const diff = typeof q.difficulty === "number" ? Math.min(3, Math.max(1, Math.trunc(q.difficulty))) : 1;
        return {
          question: cleanText(q.question).replace(/^\d+[.)]\s*/, ""),
          options: cleanOptions,
          answerIndex: idx,
          explanation: cleanText(q.explanation, "Jawaban ini paling sesuai dengan konsep pada materi."),
          difficulty: diff,
          concept: matchConceptName(q.concept, validConcepts),
        };
      })
      .filter(
        (q) =>
          q.question.length > 0 &&
          q.options.length === 4 &&
          q.options.every((o) => o.length > 0) &&
          q.answerIndex >= 0 &&
          q.answerIndex < 4
      )
      .slice(0, count);
  } catch {
    return [
      {
        question: "Manakah pernyataan yang paling tepat mengenai materi ini?",
        options: [
          "Konsep dasar merupakan pondasi analitis materi",
          "Materi ini tidak memiliki aturan pasti",
          "Hanya berlaku pada ruang hampa",
          "Tidak ada hubungan sebab akibat dalam materi",
        ],
        answerIndex: 0,
        explanation: "Pondasi analitis mendefinisikan seluruh relasi dan formula selanjutnya.",
        difficulty: 1,
        concept: "Konsep Inti",
      },
    ];
  }
}

export type ChatEntry = { role: "user" | "assistant"; content: string };

export async function tanyaTutor(opts: {
  question: string;
  summary: string;
  structure: string;
  mastery: string;
  history: ChatEntry[];
  level: string;
}): Promise<string> {
  const levelMap: Record<string, string> = {
    sederhana: "Penjelasan paling sederhana, bahasa sehari-hari, analogi mudah, kalimat pendek (maksimal 110 kata).",
    normal: "Penjelasan normal: jelas, runtut, seperlunya contoh (maksimal 140 kata).",
    detail: "Penjelasan detail: langkah demi langkah terstruktur, contoh konkret, istilah kunci dijelaskan (maksimal 180 kata).",
    mendalam: "Penjelasan mendalam: analisis konseptual lengkap, hubungan antar konsep, dan pembuktian/alasan ilmiahnya (maksimal 220 kata).",
  };

  const levelDesc = levelMap[opts.level] ?? levelMap.normal;
  const system = `Anda adalah "AI Tutor" CamesAcademic dengan kemampuan penalaran tertinggi.
Prinsip wajib: MENJELASKAN -> MEMBIMBING -> MENGECEK PEMAHAMAN. Jika siswa meminta jawaban tugas jadi, bimbing caranya terlebih dahulu agar ia benar-benar paham.
Prioritaskan fakta dari materi di bawah. Jika di luar materi, nyatakan singkat dengan sopan lalu jawab konsep terkait secara akurat.

FORMAT BALASAN WAJIB (gunakan persis 3 bagian ini agar konsisten di semua model):
**Penjelasan:**
(Isi penjelasan yang tepat dan runtut sesuai tingkat penjelasan yang dipilih.)

**Contoh / Analogi:**
(1 contoh atau analogi konkret singkat untuk memperjelas.)

**Cek Pemahaman:**
(1 pertanyaan singkat untuk mengajak siswa mengecek pemahamannya sendiri.)

Tingkat penjelasan aktif: ${levelDesc}
Gunakan bahasa yang sama dengan pertanyaan siswa.

=== RINGKASAN MATERI ===
${opts.summary.slice(0, 6000)}

=== STRUKTUR KONSEP ===
${opts.structure.slice(0, 6000)}

=== PEMAHAMAN SISWA (0-100 per konsep) ===
${opts.mastery || "(belum ada data)"}`;

  const historyText = opts.history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Siswa" : "AI"}: ${m.content}`)
    .join("\n");

  const prompt = `${historyText ? `Riwayat percakapan:\n${historyText}\n\n` : ""}Pertanyaan siswa: ${opts.question}`;

  return (
    await geminiGenerate({
      system,
      prompt,
      smart: true,
      maxOutputTokens: 2048,
    })
  ).trim();
}
