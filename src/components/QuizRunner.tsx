"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProgressRing from "./ProgressRing";
import { ArrowRightIcon, CheckIcon, RefreshIcon, TrophyIcon, XIcon, ZapIcon } from "./icons";
import { apiFetch } from "@/lib/api";

type Question = {
  id: string;
  question: string;
  options: string[];
  difficulty: number;
  concept: string | null;
};

type Feedback = {
  correct: boolean;
  answerIndex: number;
  explanation: string;
  xpGain: number;
  concept: string | null;
};

const DIFF: Record<number, { label: string; cls: string; bars: number }> = {
  1: { label: "Mudah", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", bars: 1 },
  2: { label: "Sedang", cls: "bg-blue-50 text-blue-700 ring-blue-600/20", bars: 2 },
  3: { label: "Sulit", cls: "bg-violet-50 text-violet-700 ring-violet-600/20", bars: 3 },
};

function DiffBars({ level }: { level: number }) {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          className={`w-1 rounded-full bg-current ${b <= level ? "opacity-100" : "opacity-25"}`}
          style={{ height: 4 + b * 3 }}
        />
      ))}
    </span>
  );
}

function resultTone(pct: number) {
  if (pct >= 80) return { title: "Luar biasa!", note: "Pemahamanmu sudah kuat. Lanjut ke materi berikutnya.", tone: "success" as const };
  if (pct >= 50) return { title: "Bagus, tinggal sedikit lagi", note: "Ulangi bagian yang masih salah supaya makin nempel.", tone: "brand" as const };
  return { title: "Tidak apa-apa, coba lagi", note: "Baca ringkasan sekali lagi, lalu ulangi quiz ini.", tone: "brand" as const };
}

export default function QuizRunner({
  materialId,
  onFinished,
}: {
  materialId: string;
  onFinished: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sending, setSending] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const runId = useRef(0);

  const load = useCallback(async () => {
    const run = ++runId.current;
    await Promise.resolve();
    setLoading(true);
    setError("");
    setI(0);
    setSelected(null);
    setFeedback(null);
    setCorrectCount(0);
    setXpTotal(0);
    setResults([]);
    setFinished(false);
    try {
      const res = await apiFetch(`/api/materials/${materialId}/quiz?count=10`);
      const data = await res.json().catch(() => ({}));
      if (run !== runId.current) return;
      if (!res.ok) {
        setError(data.error || "Gagal memuat soal");
        return;
      }
      const qs: Question[] = Array.isArray(data) ? data : (data.questions || []);
      setQuestions(qs);
      setResults(qs.map(() => null));
    } catch {
      if (run === runId.current) setError("Koneksi gagal");
    } finally {
      if (run === runId.current) setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function choose(optIdx: number) {
    if (feedback || sending) return;
    const q = questions[i];
    setSelected(optIdx);
    setSending(true);
    try {
      const res = await apiFetch(`/api/materials/${materialId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, selected: optIdx }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan jawaban");
        setSelected(null);
        return;
      }
      setFeedback({
        correct: data.correct,
        answerIndex: data.answerIndex,
        explanation: data.explanation,
        xpGain: data.xpGain,
        concept: data.concept,
      });
      setResults((r) => r.map((v, idx) => (idx === i ? !!data.correct : v)));
      if (data.correct) setCorrectCount((c) => c + 1);
      setXpTotal((x) => x + (data.xpGain || 0));
    } catch {
      setError("Koneksi gagal. Coba lagi.");
      setSelected(null);
    } finally {
      setSending(false);
    }
  }

  function next() {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      setFinished(true);
    }
  }

  if (loading) {
    return (
      <div className="card space-y-4 p-6" aria-busy="true">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <span className="spinner text-brand" />
          Menyiapkan soal untukmu...
        </div>
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
        <button className="btn btn-primary mt-4" onClick={load}>
          <RefreshIcon className="h-4 w-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card p-8 text-center text-sm font-semibold text-slate-600">
        Belum ada soal untuk materi ini.
      </div>
    );
  }

  if (finished) {
    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);
    const r = resultTone(pct);
    return (
      <div className="card pop relative overflow-hidden p-6 text-center sm:p-9">
        <div className="deco-grid-light pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative">
          <p className="eyebrow inline-flex items-center gap-1.5 text-brand">
            <TrophyIcon className="h-4 w-4" /> Quiz selesai
          </p>
          <div className="mt-5 flex justify-center">
            <ProgressRing pct={pct} size={152} stroke={12} tone={r.tone} label={`Pemahaman ${pct}%`}>
              <div className="text-center">
                <p className="text-4xl font-extrabold tracking-tight text-navy tabular-nums">{pct}%</p>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Pemahaman
                </p>
              </div>
            </ProgressRing>
          </div>
          <h3 className="mt-5 text-xl font-extrabold tracking-tight text-navy">{r.title}</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-600">{r.note}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckIcon className="h-4 w-4" /> {correctCount} benar
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-red-700 ring-1 ring-inset ring-red-600/20">
              <XIcon className="h-4 w-4" /> {total - correctCount} salah
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-gold-soft px-3 py-1.5 text-amber-800 ring-1 ring-inset ring-amber-500/30">
              <ZapIcon className="h-4 w-4" /> +{xpTotal} XP
            </span>
          </div>

          <div className="mx-auto mt-7 flex max-w-xs flex-col gap-2">
            <button className="btn btn-primary" onClick={onFinished}>
              Lihat Laporan &amp; Rekomendasi
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button className="btn btn-ghost" onClick={load}>
              <RefreshIcon className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[i];
  const answered = feedback !== null;
  const diff = DIFF[q.difficulty] ?? DIFF[2];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-extrabold text-navy tabular-nums">
          Soal {i + 1}
          <span className="font-semibold text-slate-500"> / {questions.length}</span>
        </span>
        <span className="flex items-center gap-2">
          {q.concept && (
            <span className="hidden max-w-[14rem] truncate rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 sm:inline">
              {q.concept}
            </span>
          )}
          <span
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${diff.cls}`}
          >
            <DiffBars level={diff.bars} />
            {diff.label}
          </span>
        </span>
      </div>

      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={i + (answered ? 1 : 0)}
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-label="Kemajuan quiz"
      >
        {questions.map((_, idx) => {
          const res = results[idx];
          const cls =
            res === true
              ? "bg-emerald-500"
              : res === false
                ? "bg-amber-400"
                : idx === i
                  ? "bg-brand"
                  : "bg-slate-200";
          return <span key={idx} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${cls}`} />;
        })}
      </div>

      <div className="card p-5 sm:p-7">
        <p className="text-balance text-lg font-extrabold leading-relaxed tracking-tight text-navy sm:text-xl">
          {q.question}
        </p>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, oi) => {
            const isAnswer = answered && oi === feedback!.answerIndex;
            const isWrongPick = answered && oi === selected && oi !== feedback!.answerIndex;
            let cls =
              "border-[#dbe5f7] bg-white hover:border-brand/60 hover:bg-brand/5 hover:shadow-card";
            if (answered) {
              if (isAnswer) cls = "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200";
              else if (isWrongPick) cls = "border-red-400 bg-red-50 ring-2 ring-red-200 shake";
              else cls = "border-slate-100 bg-slate-50 opacity-60";
            } else if (selected === oi) cls = "border-brand bg-brand/5 ring-2 ring-brand/25";
            return (
              <button
                key={oi}
                onClick={() => choose(oi)}
                disabled={answered || sending}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${cls}`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${
                    isAnswer
                      ? "bg-emerald-500 text-white"
                      : isWrongPick
                        ? "bg-red-500 text-white"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isAnswer ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : isWrongPick ? (
                    <XIcon className="h-4 w-4" />
                  ) : (
                    String.fromCharCode(65 + oi)
                  )}
                </span>
                <span className="flex-1 pt-1 text-[15px] leading-relaxed text-slate-800">{opt}</span>
                {isAnswer && (
                  <span className="mt-1 shrink-0 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                    Benar
                  </span>
                )}
                {isWrongPick && (
                  <span className="mt-1 shrink-0 rounded-lg bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-800">
                    Jawabanmu
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`rise mt-5 rounded-2xl border p-4 sm:p-5 ${
              feedback!.correct ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={`flex items-center gap-2 text-sm font-extrabold ${
                  feedback!.correct ? "text-emerald-800" : "text-amber-900"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-white ${
                    feedback!.correct ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                >
                  {feedback!.correct ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
                </span>
                {feedback!.correct ? "Benar!" : "Belum tepat"}
              </p>
              {feedback!.xpGain > 0 && (
                <span className="pop flex items-center gap-1 rounded-lg bg-gold-soft px-2.5 py-1 text-xs font-extrabold text-amber-800 ring-1 ring-inset ring-amber-500/30">
                  <ZapIcon className="h-3.5 w-3.5" />+{feedback!.xpGain} XP
                  {!feedback!.correct && <span className="font-semibold"> untuk usaha</span>}
                </span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {feedback!.explanation}
            </p>
            <button className="btn btn-primary mt-4 w-full py-3" onClick={next}>
              {i + 1 < questions.length ? "Lanjut" : "Selesai"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {sending && (
          <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <span className="spinner text-brand" /> Memeriksa jawaban...
          </p>
        )}
        {error && !answered && (
          <p role="alert" className="mt-3 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-navy px-5 py-3 text-xs font-bold text-sky-200 shadow-card">
        <span className="flex items-center gap-1.5">
          <CheckIcon className="h-4 w-4 text-emerald-400" />
          Benar: <span className="tabular-nums text-white">{correctCount}</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-300">
          <ZapIcon className="h-4 w-4" />
          XP: <span className="tabular-nums">+{xpTotal}</span>
        </span>
      </div>
    </div>
  );
}
