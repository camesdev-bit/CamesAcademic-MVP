"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertIcon, CheckIcon, RefreshIcon } from "./icons";
import { apiFetch } from "@/lib/api";

type StepState = {
  status: string;
  step: string | null;
  label: string;
  error: string | null;
};

const STAGES = [
  { status: "EXTRACTING", label: "Membaca materi", hint: "Ekstraksi teks dari file" },
  { status: "ANALYZING", label: "AI memahami materi", hint: "Struktur topik & konsep (AI SERAP)" },
  { status: "GENERATING", label: "Menyiapkan alat belajar", hint: "Ringkasan, flashcard, quiz" },
  { status: "READY", label: "Siap dipelajari", hint: "Masuk Learning Space" },
];

const PROGRESS: Record<string, number> = {
  EXTRACTING: 10,
  ANALYZING: 35,
  GENERATING: 60,
  READY: 100,
};

const STEP_PROGRESS: Record<string, number> = {
  serap: 40,
  ringkasan: 65,
  flashcard: 80,
  soal: 92,
};

function stageIndex(status: string) {
  const i = STAGES.findIndex((s) => s.status === status);
  return i === -1 ? 0 : i;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ProcessingClient({
  id,
  title,
  initialStatus,
}: {
  id: string;
  title: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const runIdRef = useRef(0);
  const [state, setState] = useState<StepState>({
    status: initialStatus,
    step: null,
    label: "Menyiapkan...",
    error: null,
  });
  const [fatal, setFatal] = useState("");
  const [attempt, setAttempt] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (initialStatus === "READY") {
      routerRef.current.replace(`/materi/${id}`);
      return;
    }
    let cancelled = false;
    const runId = ++runIdRef.current;
    const isStale = () => cancelled || runIdRef.current !== runId;

    let cachedSeed: unknown = null;
    let cachedSnapshot: unknown = null;
    try {
      const rawSeed = window.sessionStorage.getItem(`cames_mat_seed_${id}`);
      if (rawSeed) cachedSeed = JSON.parse(rawSeed);
      const rawSnap = window.sessionStorage.getItem(`cames_mat_snapshot_${id}`);
      if (rawSnap) cachedSnapshot = JSON.parse(rawSnap);
    } catch {
      // Ignore storage access errors
    }

    async function run() {
      let failures = 0;

      while (!isStale() && !doneRef.current) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 55_000);
        try {
          const payload: Record<string, unknown> = {};
          if (cachedSeed) payload.seed = cachedSeed;
          if (cachedSnapshot) payload.snapshot = cachedSnapshot;
          const hasPayload = Object.keys(payload).length > 0;

          const res = await apiFetch(`/api/materials/${id}/step`, {
            method: "POST",
            headers: hasPayload ? { "Content-Type": "application/json" } : undefined,
            body: hasPayload ? JSON.stringify(payload) : undefined,
            signal: controller.signal,
          });
          window.clearTimeout(timer);

          const data = (await res.json().catch(() => ({}))) as StepState & {
            error?: string;
            snapshot?: unknown;
          };
          if (!res.ok) throw new Error(data.error || `Gagal memproses materi (${res.status})`);
          if (isStale()) break;

          if (data.snapshot) {
            cachedSnapshot = data.snapshot;
            try {
              window.sessionStorage.setItem(
                `cames_mat_snapshot_${id}`,
                JSON.stringify(data.snapshot)
              );
            } catch {}
          }

          setState({
            status: data.status,
            step: data.step,
            label: data.label,
            error: data.error ?? null,
          });
          failures = 0;

          if (data.status === "READY") {
            doneRef.current = true;
            try {
              window.sessionStorage.removeItem(`cames_mat_seed_${id}`);
            } catch {}
            await sleep(700);
            if (!isStale()) routerRef.current.replace(`/materi/${id}`);
            break;
          }
          if (data.status === "FAILED") {
            setFatal(data.error || "Proses AI gagal");
            break;
          }
          await sleep(300);
        } catch (e) {
          window.clearTimeout(timer);
          if (isStale()) break;
          failures++;
          const isTimeout = e instanceof DOMException && e.name === "AbortError";
          const msg = isTimeout
            ? "Waktu proses server habis. Tekan Coba Lagi untuk melanjutkan dari langkah terakhir."
            : e instanceof Error
              ? e.message
              : "Koneksi terputus";
          if (failures >= 3) {
            setFatal(msg);
            break;
          }
          await sleep(1500);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, attempt, initialStatus]);

  const idx = stageIndex(state.status);
  const pct =
    state.status === "GENERATING" && state.step
      ? (STEP_PROGRESS[state.step] ?? PROGRESS.GENERATING)
      : (PROGRESS[state.status] ?? 15);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="card overflow-hidden shadow-float">
        <div className="hero-gradient relative px-6 pb-6 pt-6 text-white">
          <div className="pointer-events-none absolute inset-0 deco-grid opacity-50" />
          <p className="eyebrow relative text-brand-light">AI sedang memproses</p>
          <h1 className="relative mt-1.5 text-xl font-extrabold tracking-tight">{title}</h1>

          <div className="relative mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-sky-200">
              <span>{fatal ? "Terhenti" : state.label}</span>
              <span className="text-white">{fatal ? "—" : `${pct}%`}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fatal ? "bg-red-400" : "fill-shine relative bg-gradient-to-r from-brand-light to-white"
                }`}
                style={{ width: `${fatal ? 5 : pct}%` }}
              />
            </div>
          </div>
        </div>

        <ul className="space-y-0 px-6 py-5">
          {STAGES.map((s, i) => {
            const isDone = !fatal && i < idx;
            const isCurrent = !fatal && i === idx;
            const isLast = i === STAGES.length - 1;
            return (
              <li key={s.status} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && (
                  <span
                    className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 ${
                      isDone ? "bg-emerald-300" : "bg-slate-100"
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold transition ${
                    isDone
                      ? "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50"
                      : isCurrent
                        ? "bg-brand text-white ring-4 ring-brand/10"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isDone ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </span>
                <div className="pt-0.5">
                  <p
                    className={`text-sm font-bold ${
                      isDone || isCurrent ? "text-navy" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-500">{s.hint}</p>
                </div>
                {isCurrent && (
                  <span className="spinner absolute right-0 top-1.5 text-brand" />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {fatal && (
        <div className="card border-red-200 p-5" role="alert">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
              <AlertIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-red-700">Proses gagal</p>
              <p className="mt-0.5 break-words text-sm leading-relaxed text-red-600">{fatal}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="btn btn-primary flex-1"
              onClick={() => {
                setFatal("");
                setAttempt((a) => a + 1);
              }}
            >
              <RefreshIcon className="h-4 w-4" />
              Coba Lagi
            </button>
            <button className="btn btn-ghost flex-1" onClick={() => router.push("/materi")}>
              Kembali
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        Proses berjalan di server — kamu boleh buka tab lain, materi tetap diproses.
      </p>
    </div>
  );
}
