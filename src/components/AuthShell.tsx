import Link from "next/link";
import Logo from "./Logo";
import { ChevronLeftIcon, ClipboardIcon, LayersIcon, SparkIcon } from "./icons";

const POINTS = [
  { icon: SparkIcon, title: "Ringkasan otomatis", desc: "Materi panjang jadi poin penting yang rapi." },
  { icon: LayersIcon, title: "Flashcard & kuis", desc: "Dibuat dari materimu sendiri, lengkap pembahasan." },
  { icon: ClipboardIcon, title: "Progress terukur", desc: "Tahu persis konsep mana yang masih lemah." },
];

export default function AuthShell({
  eyebrow,
  title,
  tagline,
  children,
}: {
  eyebrow: string;
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Panel brand */}
      <aside className="hero-gradient relative flex flex-col overflow-hidden px-6 pb-20 pt-5 text-white lg:justify-between lg:px-12 lg:py-10">
        <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-brand-light/25 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Logo tone="light" />
          <Link
            href="/"
            className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-sky-200 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Beranda
          </Link>
        </div>

        <div className="relative mt-8 lg:mt-0">
          <h2 className="max-w-md text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {tagline}
          </h2>
          <ul className="mt-8 hidden max-w-md space-y-3 lg:block">
            {POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <li
                  key={p.title}
                  className="flex items-center gap-3.5 rounded-2xl bg-white/10 p-3.5 ring-1 ring-inset ring-white/15 backdrop-blur-sm"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{p.title}</p>
                    <p className="text-xs font-medium leading-relaxed text-sky-200">{p.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative hidden text-xs font-medium text-sky-300 lg:block">
          © 2026 Cames · Dibuat untuk pelajar yang ingin benar-benar paham.
        </p>
      </aside>

      {/* Form */}
      <main className="relative flex items-start justify-center px-4 pb-12 lg:items-center lg:py-12">
        <div className="rise card -mt-12 w-full max-w-md p-6 shadow-float sm:p-8 lg:mt-0 lg:border-0 lg:shadow-none">
          <p className="eyebrow text-brand">{eyebrow}</p>
          <h1 className="mb-6 mt-1 text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
