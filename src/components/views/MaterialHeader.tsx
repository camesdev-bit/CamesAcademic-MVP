import { LayersIcon } from "@/components/icons";

export default function MaterialHeader({
  title,
  subject,
  sourceType,
  flashcards,
  questions,
}: {
  title: string;
  subject: string | null;
  sourceType: string;
  flashcards: number;
  questions: number;
}) {
  return (
    <header className="hero-gradient relative overflow-hidden rounded-[1.5rem] px-5 py-5 text-white shadow-float sm:px-7 sm:py-6">
      <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-brand-light/25 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
          <LayersIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-sky-200">
            {subject || "Learning Space"} · {sourceType}
          </p>
          <h1 className="mt-2.5 text-balance text-xl font-extrabold tracking-tight sm:text-2xl">
            {title}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-sky-100">
            <li className="rounded-lg bg-white/10 px-2.5 py-1 tabular-nums">{flashcards} flashcard</li>
            <li className="rounded-lg bg-white/10 px-2.5 py-1 tabular-nums">{questions} soal quiz</li>
            <li className="rounded-lg bg-white/10 px-2.5 py-1">Tanya AI kapan saja</li>
          </ul>
        </div>
      </div>
    </header>
  );
}
