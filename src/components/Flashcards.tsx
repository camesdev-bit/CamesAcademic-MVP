"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, LayersIcon, RefreshIcon, XIcon } from "./icons";
import { apiFetch } from "@/lib/api";

export type Card = {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
};

export default function Flashcards({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [state, setState] = useState<Card[]>(cards);
  const [saving, setSaving] = useState(false);

  const total = state.length;

  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setIndex((i) => (total === 0 ? 0 : (i + delta + total) % total));
    },
    [total]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-3xl bg-brand/10 text-brand">
          <LayersIcon className="h-7 w-7" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada flashcard.</p>
      </div>
    );
  }

  const card = state[Math.min(index, total - 1)];
  const masteredCount = state.filter((c) => c.mastered).length;

  async function mark(mastered: boolean) {
    const current = state[index];
    setState((s) => s.map((c) => (c.id === current.id ? { ...c, mastered } : c)));
    setSaving(true);
    try {
      await apiFetch(`/api/flashcards/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastered }),
      });
    } catch {
      // state lokal tetap menampilkan pilihan user
    } finally {
      setSaving(false);
    }
    if (index < total - 1) go(1);
    else setFlipped(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-extrabold text-navy tabular-nums">
          Kartu {index + 1}
          <span className="font-semibold text-slate-500"> / {total}</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <CheckIcon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{masteredCount}</span> dikuasai
        </span>
      </div>

      <div
        className="track"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Kartu ${index + 1} dari ${total}`}
      >
        <div className="fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="flip-scene h-72 sm:h-80">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Lihat pertanyaan" : "Lihat jawaban"}
          className="flip-card block w-full rounded-[1.5rem] text-left"
          data-flipped={flipped}
        >
          {/* Depan */}
          <span
            className="flip-face flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] border border-[#dbe6fb] bg-white p-6 text-center shadow-float"
            aria-hidden={flipped}
          >
            <span className="deco-grid-light pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
            <span className="eyebrow relative text-brand">
              Pertanyaan
            </span>
            <span className="relative max-h-44 w-full overflow-y-auto whitespace-pre-wrap px-1 text-xl font-extrabold leading-relaxed tracking-tight text-navy sm:text-2xl">
              {card.front}
            </span>
            <span className="relative mt-auto flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <RefreshIcon className="h-3.5 w-3.5" />
              Ketuk untuk lihat jawaban
            </span>
          </span>

          {/* Belakang */}
          <span
            className="flip-face flip-back hero-gradient flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] p-6 text-center text-white shadow-float"
            aria-hidden={!flipped}
          >
            <span className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
            <span className="eyebrow relative text-brand-light">
              Jawaban
            </span>
            <span className="relative max-h-44 w-full overflow-y-auto whitespace-pre-wrap px-1 text-lg font-bold leading-relaxed sm:text-xl">
              {card.back}
            </span>
            <span className="relative mt-auto flex items-center gap-1.5 text-xs font-bold text-sky-200">
              <RefreshIcon className="h-3.5 w-3.5" />
              Ketuk untuk lihat pertanyaan
            </span>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="btn btn-ghost px-3.5"
          onClick={() => go(-1)}
          disabled={saving}
          aria-label="Kartu sebelumnya"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          className="btn flex-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          onClick={() => mark(false)}
          disabled={saving}
        >
          <XIcon className="h-4 w-4" />
          Belum Hafal
        </button>
        <button
          className="btn flex-1 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          onClick={() => mark(true)}
          disabled={saving}
        >
          <CheckIcon className="h-4 w-4" />
          Sudah Dikuasai
        </button>
        <button
          className="btn btn-ghost px-3.5"
          onClick={() => go(1)}
          disabled={saving}
          aria-label="Kartu berikutnya"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <p className="hidden text-center text-xs font-semibold text-slate-500 sm:block">
        Tips: tombol panah ← → untuk pindah kartu
      </p>
    </div>
  );
}
