"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MD from "./MD";
import Flashcards, { type Card } from "./Flashcards";
import QuizRunner from "./QuizRunner";
import TutorChat from "./TutorChat";
import ReportView, { type ReportStats } from "./ReportView";
import { ChatIcon, ClipboardIcon, LayersIcon, ReportIcon, SparkIcon } from "./icons";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type MasteryChip = { name: string; score: number };

const TABS = [
  { key: "Ringkasan", icon: SparkIcon },
  { key: "Flashcard", icon: LayersIcon },
  { key: "Quiz", icon: ClipboardIcon },
  { key: "Tanya AI", icon: ChatIcon },
  { key: "Laporan", icon: ReportIcon },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function LearningSpace({
  materialId,
  summary,
  cards,
  history,
  stats,
  mastery,
}: {
  materialId: string;
  summary: string;
  cards: Card[];
  history: Msg[];
  stats: ReportStats;
  mastery: MasteryChip[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Ringkasan");

  function onQuizFinished() {
    router.refresh();
    setTab("Laporan");
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-30 -mx-4 bg-gradient-to-b from-surface via-surface/95 to-surface/0 px-4 pb-3 pt-2 md:mx-0 md:px-0">
        <div
          role="tablist"
          aria-label="Mode belajar"
          className="hide-scrollbar glass flex gap-1 overflow-x-auto rounded-2xl border border-white/70 p-1 shadow-card ring-1 ring-inset ring-slate-900/5"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold transition sm:flex-1 sm:justify-center sm:px-4 ${
                  isActive
                    ? "bg-gradient-to-b from-brand to-brand-700 text-white shadow-[0_8px_16px_-8px_rgba(37,99,235,0.8)]"
                    : "text-slate-600 hover:bg-white hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.key}
              </button>
            );
          })}
        </div>
      </div>

      <div key={tab} className="rise">
        {tab === "Ringkasan" && (
          <div className="space-y-4">
            {mastery.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mastery.map((m) => (
                  <span
                    key={m.name}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                      m.score >= 70
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : m.score >= 40
                          ? "bg-amber-50 text-amber-800 ring-amber-600/20"
                          : "bg-red-50 text-red-700 ring-red-600/20"
                    }`}
                  >
                    {m.name} · {m.score}%
                  </span>
                ))}
              </div>
            )}
            <article className="card p-5 sm:p-8">
              <MD content={summary} />
            </article>
            <div className="card flex items-center gap-3.5 bg-gradient-to-r from-brand/5 to-transparent p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <ChatIcon className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-slate-700">
                Masih bingung? Buka tab{" "}
                <button
                  onClick={() => setTab("Tanya AI")}
                  className="font-extrabold text-brand underline-offset-2 hover:underline"
                >
                  Tanya AI
                </button>{" "}
                — jelaskan, bimbing, lalu dicek pemahamannya.
              </p>
            </div>
          </div>
        )}

        {tab === "Flashcard" && (
          <div className="card p-4 sm:p-6">
            <Flashcards cards={cards} />
          </div>
        )}

        {tab === "Quiz" && <QuizRunner materialId={materialId} onFinished={onQuizFinished} />}

        {tab === "Tanya AI" && (
          <div className="card p-4 sm:p-5">
            <TutorChat materialId={materialId} history={history} />
          </div>
        )}

        {tab === "Laporan" && <ReportView stats={stats} />}
      </div>
    </div>
  );
}
