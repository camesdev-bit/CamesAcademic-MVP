import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import { BookIcon, ChartIcon, ClipboardIcon, FlameIcon, GradIcon, TargetIcon } from "@/components/icons";
import { subjectTone } from "@/lib/subject";

export type ProgressData = {
  user: { streak: number; level: number; xp: number };
  materialsCount: number;
  answersCount: number;
  accuracy: number;
  mastered: number;
  days: { label: string; count: number; today: boolean }[];
  materials: { id: string; title: string; subject: string | null; concepts: number; avg: number | null }[];
};

function barFill(avg: number | null) {
  if ((avg ?? 0) >= 70) return "linear-gradient(90deg,#10b981,#2dd4bf)";
  if ((avg ?? 0) >= 40) return "linear-gradient(90deg,#f59e0b,#fb923c)";
  return "linear-gradient(90deg,#2563eb,#60a5fa)";
}

export default function ProgressView({ data }: { data: ProgressData }) {
  const maxDay = Math.max(1, ...data.days.map((d) => d.count));
  const weekTotal = data.days.reduce((a, d) => a + d.count, 0);

  const tiles = [
    { label: "Materi dipelajari", value: String(data.materialsCount), icon: BookIcon },
    { label: "Quiz dijawab", value: String(data.answersCount), icon: ClipboardIcon },
    { label: "Konsep dikuasai", value: String(data.mastered), icon: ChartIcon },
    { label: "Streak", value: `${data.user.streak} hari`, icon: FlameIcon },
    { label: "Level / XP", value: `${data.user.level} · ${data.user.xp}`, icon: GradIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Progress</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Perjalanan belajarmu
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Fokus utama: pemahaman, bukan sekadar waktu belajar.
        </p>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1fr_2.2fr]">
        <div className="hero-gradient relative flex items-center gap-5 overflow-hidden rounded-[1.5rem] p-5 text-white shadow-float">
          <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <ProgressRing pct={data.accuracy} size={104} stroke={10} tone="light" label={`Ketepatan ${data.accuracy}%`}>
              <span className="text-2xl font-extrabold tabular-nums">{data.accuracy}%</span>
            </ProgressRing>
          </div>
          <div className="relative">
            <p className="flex items-center gap-1.5 text-sm font-extrabold">
              <TargetIcon className="h-4 w-4 text-brand-light" /> Ketepatan jawaban
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-sky-200">
              Dari {data.answersCount} soal yang sudah kamu jawab.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card card-hover p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
                <p className="mt-0.5 text-lg font-extrabold text-navy tabular-nums">{s.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-brand">Aktivitas 7 hari terakhir</p>
            <h2 className="mt-1 font-extrabold tracking-tight text-navy">
              Jumlah soal yang dijawab per hari
            </h2>
          </div>
          <span className="shrink-0 rounded-lg bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand tabular-nums">
            {weekTotal} soal
          </span>
        </div>
        <div className="relative mt-6">
          <div className="pointer-events-none absolute inset-x-0 top-5 flex h-[112px] flex-col justify-between">
            {[0, 1, 2].map((l) => (
              <span key={l} className="h-px w-full bg-[#eef3fc]" />
            ))}
          </div>
          <div className="relative flex h-40 items-end gap-2 sm:gap-3">
            {data.days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="h-4 text-xs font-extrabold text-slate-600 tabular-nums">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div
                  className={`w-full max-w-[3rem] rounded-t-xl transition-all duration-500 ${
                    d.count > 0
                      ? d.today
                        ? "bg-gradient-to-t from-brand-700 to-brand"
                        : "bg-gradient-to-t from-brand to-brand-light"
                      : "bg-slate-100"
                  }`}
                  style={{ height: `${Math.max(6, (d.count / maxDay) * 96)}px` }}
                />
                <span className={`text-xs font-bold ${d.today ? "text-brand" : "text-slate-500"}`}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold tracking-tight text-navy">Pemahaman per materi</h2>
        {data.materials.length === 0 ? (
          <div className="card flex flex-col items-center p-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-brand/15 to-brand-light/20 text-brand">
              <BookIcon className="h-7 w-7" />
            </span>
            <p className="mt-3 text-sm text-slate-600">
              Belum ada materi siap.{" "}
              <Link href="/materi" className="font-extrabold text-brand underline-offset-2 hover:underline">
                Upload materi
              </Link>{" "}
              untuk mulai belajar.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.materials.map((m) => {
              const avg = m.avg;
              return (
                <li key={m.id}>
                  <Link href={`/materi/${m.id}`} className="card card-hover block p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xs font-extrabold ${subjectTone(m.subject || m.title)}`}
                      >
                        {(m.subject || m.title).slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-navy">{m.title}</p>
                        <p className="truncate text-xs font-medium text-slate-600">
                          {m.subject || "Tanpa pelajaran"}
                          {m.concepts > 0 ? ` · ${m.concepts} konsep terukur` : " · belum ada quiz"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset tabular-nums ${
                          avg === null
                            ? "bg-slate-50 text-slate-500 ring-slate-200"
                            : avg >= 70
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : avg >= 40
                                ? "bg-amber-50 text-amber-800 ring-amber-600/20"
                                : "bg-red-50 text-red-700 ring-red-600/20"
                        }`}
                      >
                        {avg === null ? "—" : `${avg}%`}
                      </span>
                    </div>
                    <div
                      className="track mt-3.5"
                      role="progressbar"
                      aria-valuenow={avg ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Pemahaman ${m.title}`}
                    >
                      <div className="fill" style={{ width: `${avg ?? 0}%`, backgroundImage: barFill(avg) }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
