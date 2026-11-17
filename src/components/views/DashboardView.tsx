import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  FlameIcon,
  PlusIcon,
  SparkIcon,
  TargetIcon,
  ZapIcon,
} from "@/components/icons";
import { statusBadge, subjectInitial, subjectTone } from "@/lib/subject";
import { xpProgress } from "@/lib/xp";

export type DashboardMaterial = {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  dateLabel: string;
};

export type DashboardData = {
  user: { name: string; xp: number; level: number; streak: number };
  latest: { id: string; title: string; subject: string | null; status: string } | null;
  continueHref: string;
  weekAnswers: number;
  weeklyTarget: number;
  /** Senin → Minggu; true bila ada jawaban pada hari itu */
  weekActive: boolean[];
  /** 0 = Senin … 6 = Minggu */
  todayIndex: number;
  totalCorrect: number;
  masteredConcepts: number;
  materials: DashboardMaterial[];
};

const DAY_LABELS = ["S", "S", "R", "K", "J", "S", "M"];
const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function DashboardView({ data }: { data: DashboardData }) {
  const { user, latest, weekAnswers, weeklyTarget } = data;
  const weeklyPct = Math.min(100, Math.round((weekAnswers / weeklyTarget) * 100));
  const xp = xpProgress(user.xp);

  const stats = [
    { label: "Streak", value: `${user.streak} hari`, icon: FlameIcon, tint: "bg-orange-100 text-orange-600" },
    { label: "Total XP", value: String(user.xp), icon: ZapIcon, tint: "bg-amber-100 text-amber-600" },
    { label: "Konsep dikuasai", value: String(data.masteredConcepts), icon: CheckCircleIcon, tint: "bg-emerald-100 text-emerald-600" },
    { label: "Jawaban benar", value: String(data.totalCorrect), icon: TargetIcon, tint: "bg-blue-100 text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brand">Ringkas hari ini</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Halo, {user.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pahami materinya, bukan sekadar hafal. Lanjut dari yang terakhir.
          </p>
        </div>
        <Link href="/materi" className="btn btn-primary hidden shrink-0 sm:inline-flex">
          <PlusIcon className="h-4 w-4" />
          Upload Materi
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Hero: lanjutkan belajar */}
        <section className="hero-gradient relative overflow-hidden rounded-[1.5rem] text-white shadow-float">
          <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-brand-light/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="min-w-0">
              <p className="eyebrow text-brand-light">
                {latest ? "Lanjutkan belajar" : "Mulai belajar"}
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                {latest ? latest.title : "Belum ada materi"}
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-sky-200">
                {latest
                  ? (latest.subject || "Materi") +
                    (latest.status === "READY" ? " · Learning Space siap" : " · sedang diproses")
                  : "Upload materi pertama kamu — AI akan menyusunnya jadi alat belajar."}
              </p>
              <Link href={data.continueHref} className="btn btn-white mt-5 px-5">
                {latest ? "Buka Materi" : "Upload Materi"}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15 sm:flex-col sm:gap-2 sm:px-5">
              <ProgressRing
                pct={weeklyPct}
                size={92}
                stroke={9}
                tone="light"
                label={`Target mingguan ${weeklyPct}%`}
              >
                <span className="text-lg font-extrabold tabular-nums">{weeklyPct}%</span>
              </ProgressRing>
              <div className="text-xs font-semibold leading-snug text-sky-200 sm:text-center">
                <p className="text-sm font-extrabold text-white tabular-nums">
                  {weekAnswers} / {weeklyTarget} soal
                </p>
                Target minggu ini
              </div>
            </div>
          </div>
        </section>

        {/* Level + streak mingguan */}
        <section className="card flex flex-col justify-between gap-5 p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold to-orange-500 text-xl font-black text-white shadow-[0_10px_20px_-10px_rgba(245,158,11,0.9)]">
              {user.level}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-navy">Level {user.level}</p>
              <p className="text-xs font-semibold text-slate-600 tabular-nums">
                {xp.into} / {xp.need} XP · {xp.remaining} XP lagi ke Level {user.level + 1}
              </p>
            </div>
          </div>
          <div
            className="track"
            role="progressbar"
            aria-valuenow={xp.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres menuju level berikutnya"
          >
            <div
              className="fill"
              style={{ width: `${xp.pct}%`, backgroundImage: "linear-gradient(90deg,#f59e0b,#fb923c)" }}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Aktivitas minggu ini
            </p>
            <ul className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((d, i) => {
                const done = data.weekActive[i];
                const today = i === data.todayIndex;
                return (
                  <li key={i} className="flex flex-col items-center gap-1.5">
                    <span
                      className={`grid h-8 w-full max-w-[2.25rem] place-items-center rounded-xl text-xs font-extrabold ${
                        done
                          ? "bg-gradient-to-b from-brand to-brand-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      } ${today ? "ring-2 ring-brand/40 ring-offset-2" : ""}`}
                      aria-label={`${DAY_NAMES[i]}: ${done ? "belajar" : "belum belajar"}${today ? " (hari ini)" : ""}`}
                    >
                      {done ? <CheckIcon className="h-4 w-4" /> : null}
                    </span>
                    <span className={`text-[11px] font-bold ${today ? "text-brand" : "text-slate-500"}`}>
                      {d}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card card-hover p-4">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xl font-extrabold tracking-tight text-navy tabular-nums">
                {s.value}
              </p>
              <p className="text-xs font-semibold text-slate-600">{s.label}</p>
            </div>
          );
        })}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-navy">Materi terakhir</h2>
          <Link href="/materi" className="flex min-h-11 items-center gap-1 text-sm font-bold text-brand">
            Lihat semua <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {data.materials.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-brand/15 to-brand-light/20 text-brand">
              <SparkIcon className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-extrabold text-navy">Belum ada materi</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-600">
              Upload PDF, DOCX, gambar, atau tempel teks — AI membuat ringkasan, flashcard, dan quiz
              darinya.
            </p>
            <Link href="/materi" className="btn btn-primary mt-5">
              <PlusIcon className="h-4 w-4" />
              Upload Materi Pertama
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.materials.map((m) => {
              const badge = statusBadge(m.status);
              const href = `/materi/${m.id}${m.status === "READY" ? "" : "/proses"}`;
              const seed = m.subject || m.title;
              return (
                <li key={m.id}>
                  <Link href={href} className="card card-hover group flex items-center gap-4 p-4">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-base font-extrabold ${subjectTone(seed)}`}
                    >
                      {subjectInitial(seed)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-navy">{m.title}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                        {m.subject || "Tanpa pelajaran"} · {m.dateLabel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
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
