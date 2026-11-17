"use client";

import { useEffect, useRef, useState } from "react";
import MD from "./MD";
import { SendIcon } from "./icons";
import { apiFetch } from "@/lib/api";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const LEVELS = [
  { key: "sederhana", label: "Sederhana" },
  { key: "normal", label: "Normal" },
  { key: "detail", label: "Detail" },
  { key: "mendalam", label: "Mendalam" },
];

const SUGGESTIONS = [
  "Jelaskan dengan bahasa sederhana",
  "Kasih contoh dalam kehidupan sehari-hari",
  "Buatkan soal latihan",
  "Apa konsep terpenting di materi ini?",
];

function AiAvatar() {
  return (
    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-0.5 shadow-card ring-1 ring-[#dbe6fb]">
      <img
        src="/assets/aistudio/Tak_berjudul20_20261116212647_17f901f4.png"
        alt="AI Tutor"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export default function TutorChat({
  materialId,
  history,
}: {
  materialId: string;
  history: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(history);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError("");
    setInput("");
    const tempId = `t-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await apiFetch(`/api/materials/${materialId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, level }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "AI sedang bermasalah");
        setMessages((m) => [
          ...m,
          { id: `${tempId}-e`, role: "assistant", content: "(Gagal membalas — coba lagi)" },
        ]);
        return;
      }
      setMessages((m) => [...m, { id: `${tempId}-a`, role: "assistant", content: data.reply }]);
    } catch {
      setError("Koneksi gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[66vh] flex-col md:h-[70vh]">
      <div className="flex items-center justify-between border-b border-[#eef3fc] pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-card ring-1 ring-[#dbe6fb]">
            <img
              src="/assets/aistudio/Tak_berjudul20_20261116212647_17f901f4.png"
              alt="AI Tutor"
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <p className="text-sm font-extrabold text-navy">AI Tutor</p>
            <p className="text-xs font-medium text-slate-600">Jelaskan → bimbing → cek pemahaman</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-xs font-bold text-emerald-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Siap membantu
        </span>
      </div>

      <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto py-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="rise flex flex-col items-center px-2 py-6 text-center">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-3xl bg-white p-1.5 shadow-card ring-1 ring-[#dbe6fb]">
              <img
                src="/assets/aistudio/Tak_berjudul20_20261116212647_17f901f4.png"
                alt="AI Tutor"
                className="h-full w-full object-contain"
              />
            </span>
            <p className="mt-3 text-base font-extrabold text-navy">Tanya apa saja tentang materi ini</p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-600">
              Pilih contoh di bawah atau ketik pertanyaanmu sendiri.
            </p>
            <div className="mt-4 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="min-h-11 rounded-xl border border-brand/25 bg-brand/5 px-3.5 text-xs font-bold text-brand transition hover:bg-brand/10 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="rise flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-br from-brand to-brand-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.9)]">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="rise flex justify-start gap-2.5">
              <AiAvatar />
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#e4ecfc] bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-card">
                <MD content={m.content} />
              </div>
            </div>
          )
        )}
        {busy && (
          <div className="flex justify-start gap-2.5">
            <AiAvatar />
            <div
              className="rounded-2xl rounded-bl-md border border-[#e4ecfc] bg-white px-4 py-3.5 shadow-card"
              role="status"
              aria-label="AI sedang mengetik"
            >
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2.5 border-t border-[#eef3fc] pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Level</span>
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto" role="group" aria-label="Tingkat penjelasan">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLevel(l.key)}
                aria-pressed={level === l.key}
                className={`flex min-h-11 shrink-0 items-center rounded-xl px-3.5 text-xs font-bold transition ${
                  level === l.key
                    ? "bg-navy text-white shadow-card"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={send} className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="input flex-1 rounded-2xl"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya AI tentang materi ini..."
            aria-label="Pertanyaan untuk AI Tutor"
            maxLength={1200}
            disabled={busy}
          />
          <button
            type="submit"
            className="btn btn-primary h-[46px] w-[46px] rounded-2xl p-0"
            disabled={busy || !input.trim()}
            aria-label="Kirim pertanyaan"
          >
            <SendIcon className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
