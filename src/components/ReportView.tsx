import ProgressRing from "./ProgressRing";
import { AlertIcon, ArrowRightIcon, BulbIcon, CheckCircleIcon } from "./icons";

export type ReportStats = {
  answered: number;
  correct: number;
  wrong: number;
  percent: number;
  strengths: string[];
  weaknesses: string[];
  flashcards: number;
  flashcardsMastered: number;
};

function Bar({ label, value, fill }: { label: string; value: number; fill: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span className="text-navy tabular-nums">{value}%</span>
      </div>
      <div className="track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="fill" style={{ width: `${value}%`, backgroundImage: fill }} />
      </div>
    </div>
  );
}

export default function ReportView({ stats }: { stats: ReportStats }) {
  const empty = stats.answered === 0;
  const tone = stats.percent >= 70 ? "success" : "brand";
  const fcPct =
    stats.flashcards > 0 ? Math.round((stats.flashcardsMastered / stats.flashcards) * 100) : 0;

  const steps: string[] = [];
  if (stats.weaknesses.length > 0)
    steps.push(`Latih konsep: ${stats.weaknesses.slice(0, 3).join(", ")}.`);
  steps.push('Ulangi flashcard yang berstatus "Belum Hafal".');
  steps.push("Tanya AI bagian yang masih membingungkan.");
  steps.push("Kerja ulang quiz untuk konsep dengan skor rendah.");

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <p className="eyebrow text-brand">Learning Report</p>

        {empty ? (
          <div className="mt-4 flex flex-col items-center py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-brand/15 to-brand-light/20 text-brand">
              <BulbIcon className="h-7 w-7" />
            </span>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Belum ada quiz yang dikerjakan. Kerjakan quiz agar pemahamanmu terukur dan AI bisa
              memberi rekomendasi yang tepat.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center">
              <ProgressRing pct={stats.percent} size={140} stroke={12} tone={tone} label={`Pemahaman ${stats.percent}%`}>
                <div className="text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-navy tabular-nums">
                    {stats.percent}%
                  </p>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Pemahaman
                  </p>
                </div>
              </ProgressRing>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Dijawab", value: String(stats.answered), tint: "text-navy" },
                  { label: "Benar", value: String(stats.correct), tint: "text-emerald-600" },
                  { label: "Salah", value: String(stats.wrong), tint: "text-red-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-inset ring-slate-100">
                    <p className={`text-xl font-extrabold tabular-nums ${s.tint}`}>{s.value}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <Bar
                label="Flashcard dikuasai"
                value={fcPct}
                fill="linear-gradient(90deg,#2563eb,#60a5fa)"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card border-emerald-200/80 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-700">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100">
              <CheckCircleIcon className="h-[18px] w-[18px]" />
            </span>
            Kekuatan
          </p>
          {stats.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {stats.strengths.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              {empty ? "Belum ada data." : "Belum ada konsep di atas 70%."}
            </p>
          )}
        </div>

        <div className="card border-amber-200/80 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-amber-800">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100">
              <AlertIcon className="h-[18px] w-[18px]" />
            </span>
            Perlu dipelajari lagi
          </p>
          {stats.weaknesses.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {stats.weaknesses.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              {empty ? "Belum ada data." : "Semua konsep di atas 70%. Kerja bagus!"}
            </p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <p className="flex items-center gap-2 text-sm font-extrabold text-navy">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-brand">
            <BulbIcon className="h-[18px] w-[18px]" />
          </span>
          Langkah belajar berikutnya
        </p>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-brand to-brand-700 text-xs font-extrabold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand/5 px-4 py-3 text-xs font-bold text-brand">
          <ArrowRightIcon className="h-4 w-4 shrink-0" />
          Laporan ini dipakai AI INTI menentukan latihan berikutnya.
        </div>
      </div>
    </div>
  );
}
