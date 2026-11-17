"use client";

import { useState } from "react";
import { ChatIcon, CheckIcon, ClipboardIcon, LayersIcon, RefreshIcon, SparkIcon, ZapIcon } from "./icons";

const TABS = [
  { key: "ringkasan", label: "Ringkasan", icon: SparkIcon },
  { key: "flashcard", label: "Flashcard", icon: LayersIcon },
  { key: "quiz", label: "Quiz", icon: ClipboardIcon },
  { key: "tutor", label: "Tutor AI", icon: ChatIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BULLETS = [
  "Getaran adalah gerak bolak-balik melewati titik setimbang.",
  "Frekuensi = jumlah getaran per sekon, satuan Hertz (Hz).",
  "Amplitudo = simpangan terbesar dari titik setimbang.",
];

const OPTIONS = [
  { text: "Jumlah getaran dalam satu sekon", correct: true },
  { text: "Jarak tempuh sebuah getaran", correct: false },
  { text: "Besarnya simpangan awal", correct: false },
  { text: "Waktu tempuh satu putaran orbit", correct: false },
];

export default function LandingPreview() {
  const [tab, setTab] = useState<TabKey>("ringkasan");
  const [flipped, setFlipped] = useState(true);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#dbe6fb] bg-white shadow-float">
      <div className="flex items-center gap-2 border-b border-[#eef3fc] bg-slate-50/80 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </span>
        <span className="mx-auto rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-inset ring-[#e4ecfc]">
          academic.cames.my.id
        </span>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="flex gap-1 border-b border-[#eef3fc] bg-white p-2" role="tablist" aria-label="Pratinjau fitur">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              onClick={() => setTab(t.key)}
              aria-selected={isActive}
              aria-label={t.label}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition sm:text-sm ${
                isActive
                  ? "bg-gradient-to-b from-brand to-brand-700 text-white shadow-[0_8px_16px_-8px_rgba(37,99,235,0.8)]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div key={tab} className="rise min-h-[350px] p-4 sm:min-h-[370px] sm:p-5">
        {tab === "ringkasan" && (
          <div>
            <p className="eyebrow text-brand">
              IPA · Fisika · Kelas VIII
            </p>
            <p className="mt-3 text-xl font-extrabold tracking-tight text-navy">Getaran &amp; Gelombang</p>
            <ul className="mt-3 space-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckIcon className="h-4 w-4" />
              AI selesai menganalisis · 8 topik ditemukan
            </div>
          </div>
        )}

        {tab === "flashcard" && (
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="tabular-nums">
                Kartu 3<span className="font-semibold text-slate-500"> / 24</span>
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                12 dikuasai
              </span>
            </div>
            <div className="track mt-3">
              <div className="fill" style={{ width: "13%" }} />
            </div>
            <div className="flip-scene mt-4 h-52">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? "Lihat pertanyaan" : "Lihat jawaban"}
                data-flipped={flipped}
                className="flip-card block w-full rounded-2xl"
              >
                <span className="flip-face flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#dbe6fb] bg-white p-5 text-center shadow-card">
                  <span className="eyebrow text-brand">Pertanyaan</span>
                  <span className="text-lg font-extrabold leading-snug text-navy">
                    Apa satuan frekuensi dalam SI?
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <RefreshIcon className="h-3.5 w-3.5" /> Ketuk untuk lihat jawaban
                  </span>
                </span>
                <span className="flip-face flip-back hero-gradient flex flex-col items-center justify-center gap-2 rounded-2xl p-5 text-center">
                  <span className="eyebrow text-brand-light">Jawaban</span>
                  <span className="text-lg font-extrabold leading-snug text-white">
                    Hertz (Hz) — jumlah getaran per sekon
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-sky-200">
                    <RefreshIcon className="h-3.5 w-3.5" /> Ketuk untuk lihat pertanyaan
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}

        {tab === "quiz" && (
          <div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-navy tabular-nums">
                Soal 4<span className="font-semibold text-slate-500"> / 10</span>
              </span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Sedang
              </span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < 3 ? "bg-emerald-500" : i === 3 ? "bg-brand" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3.5 text-[15px] font-extrabold leading-relaxed text-navy">Frekuensi adalah banyaknya...</p>
            <div className="mt-3 space-y-2">
              {OPTIONS.map((o, i) => (
                <div
                  key={o.text}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-sm ${
                    o.correct
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-[#dbe5f7] bg-white text-slate-600"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                      o.correct ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {o.correct ? <CheckIcon className="h-3.5 w-3.5" /> : "ABCD"[i]}
                  </span>
                  {o.text}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-extrabold text-emerald-700">
              <span className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4" /> Benar!
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-gold-soft px-2 py-0.5 text-amber-800">
                <ZapIcon className="h-3.5 w-3.5" />+15 XP
              </span>
            </div>
          </div>
        )}

        {tab === "tutor" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand to-brand-700 px-3.5 py-2 text-sm leading-relaxed text-white">
                Aku belum ngerti bedanya frekuensi dan periode.
              </div>
            </div>
            <div className="flex justify-start gap-2">
              <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-0.5 shadow-card ring-1 ring-[#dbe6fb]">
                <img
                  src="/assets/aistudio/Tak_berjudul20_20261116212647_17f901f4.png"
                  alt="AI Tutor"
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#e4ecfc] bg-white px-3.5 py-2 text-sm leading-relaxed text-slate-700 shadow-card">
                Gampangnya: frekuensi = berapa kali per detik; periode = berapa detik untuk satu getaran.
                Keduanya saling kebalikan, T = 1/f. Kalau 2 Hz, periodenya 0,5 detik.
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Jelaskan lebih mudah", "Kasih contoh", "Buat soal"].map((q) => (
                <span
                  key={q}
                  className="rounded-xl border border-brand/25 bg-brand/5 px-2.5 py-1.5 text-xs font-bold text-brand"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
