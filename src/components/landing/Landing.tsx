import Link from "next/link";
import LandingPreview from "@/components/LandingPreview";
import Logo, { LogoMark } from "@/components/Logo";
import Reveal from "@/components/Reveal";
import {
  ArrowRightIcon,
  CalcIcon,
  ChartIcon,
  ChatIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  FileIcon,
  FileTextIcon,
  FlameIcon,
  FlaskIcon,
  GlobeIcon,
  HubIcon,
  ImageIcon,
  LanguageIcon,
  LayersIcon,
  QuoteIcon,
  ShieldIcon,
  SparkIcon,
  TextIcon,
  UploadIcon,
  XIcon,
  ZapIcon,
} from "@/components/icons";

const NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#alur", label: "Cara Kerja" },
  { href: "#pelajaran", label: "Mata Pelajaran" },
  { href: "#faq", label: "FAQ" },
];

const FACTS = [
  { value: "4", label: "mode belajar", sub: "Ringkasan, flashcard, quiz, tutor" },
  { value: "4", label: "format materi", sub: "PDF, DOCX, foto, teks" },
  { value: "3", label: "tingkat soal", sub: "Mudah, sedang, sulit" },
  { value: "4", label: "gaya penjelasan", sub: "Sederhana sampai mendalam" },
];

const PAINS = [
  { title: "Materi terlalu sulit", quote: "“Penjelasan di kelas kecepatan, buku teksnya bikin ngantuk.”" },
  { title: "Guru tidak selalu ada", quote: "“Mau nanya lagi, tapi jam istirahat sudah habis.”" },
  { title: "Latihan soal terbatas", quote: "“Soalnya cuma itu-itu lagi, nggak tahu soal kayak apa nanti.”" },
  { title: "Nggak tahu seberapa paham", quote: "“Dirasa sudah bisa, eh nilainya tetap segitu-gitu.”" },
];

const STEPS = [
  { title: "Upload", desc: "Masukkan materi: PDF, DOCX, foto, atau teks.", icon: UploadIcon },
  { title: "Belajar", desc: "AI menyusun ringkasan rapi per bab dan topik.", icon: SparkIcon },
  { title: "Pahami", desc: "Tanya tutor AI dan ulasi lewat flashcard.", icon: ChatIcon },
  { title: "Latihan", desc: "Kerjakan kuis adaptif sampai jawaban benar.", icon: ClipboardIcon },
  { title: "Berkembang", desc: "Pantau progress, XP, dan penguasaan tiap topik.", icon: ChartIcon },
];

const COMPARE = [
  "Cari materi di banyak tab, slide, dan video",
  "Belajar tanpa tahu seberapa paham",
  "Stuck sampai besok karena guru tidak ada",
  "Hafalan dadakan tiap mau ujian",
];

const COMPARE_US = [
  "Materi, latihan, dan evaluasi di satu tempat",
  "Progress & penguasaan topik terukur",
  "Tutor AI 24/7 kapan pun kamu stuck",
  "Flashcard + kuis bikin hafalan nempel",
];

const SUBJECTS = [
  { icon: FlaskIcon, name: "IPA", chips: ["Fisika", "Biologi", "Kimia"], tone: "bg-emerald-100 text-emerald-700" },
  { icon: CalcIcon, name: "Matematika", chips: ["Konsep", "Rumus", "Latihan"], tone: "bg-blue-100 text-blue-700" },
  { icon: TextIcon, name: "Bahasa Indonesia", chips: ["Teks", "Kaidah", "Amanat"], tone: "bg-rose-100 text-rose-700" },
  { icon: LanguageIcon, name: "Bahasa Inggris", chips: ["Grammar", "Vocabulary", "Reading"], tone: "bg-violet-100 text-violet-700" },
  { icon: GlobeIcon, name: "IPS", chips: ["Sejarah", "Geografi", "Ekonomi"], tone: "bg-amber-100 text-amber-800" },
];

const FAQS = [
  {
    q: "Apa itu CamesAcademic (Cames Academic)?",
    a: "CamesAcademic — sering juga disebut Cames Academic — adalah platform belajar berbasis AI dari ekosistem Cames. Kamu upload materi, lalu AI menyusunnya menjadi ringkasan, flashcard, kuis, dan tutor yang bisa ditanya kapan saja dalam satu tempat.",
  },
  {
    q: "Format file apa saja yang didukung?",
    a: "PDF, DOCX (Word), gambar/foto materi seperti hasil scan atau foto buku, atau tempel teks langsung ke aplikasi.",
  },
  {
    q: "Apakah gratis?",
    a: "Untuk tahap awal, seluruh fitur CamesAcademic bisa digunakan gratis. Cukup daftar, upload materi pertamamu, dan langsung belajar.",
  },
  {
    q: "Untuk jenjang apa?",
    a: "Dirancang untuk pelajar SMP–SMA (kelas VII–IX dan X–XII), namun siapa pun yang ingin belajar mandiri bebas memakainya.",
  },
  {
    q: "Apakah jawaban AI bisa dipercaya?",
    a: "AI menyusun penjelasan dan soal dari materi yang kamu unggah, dan setiap jawaban selalu disertai pembahasan. Gunakan sebagai pendamping belajar, bukan pengganti membaca materi aslinya.",
  },
  {
    q: "Apakah materi saya aman?",
    a: "Materi tersimpan di akunmu dan hanya bisa diakses olehmu. Kamu juga bisa menghapus materi kapan saja.",
  },
];

function SectionHead({
  eyebrow,
  title,
  sub,
  center = true,
  light = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p
        className={`eyebrow inline-flex items-center gap-2.5 ${
          light ? "text-brand-light" : "text-brand"
        }`}
      >
        <span className={`h-0.5 w-5 ${light ? "bg-brand-light" : "bg-brand"}`} aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-3.5 text-base leading-relaxed ${light ? "text-sky-200" : "text-slate-600"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  tone,
  className = "",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tone: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className={`card card-hover flex h-full flex-col overflow-hidden p-6 ${className}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
      {children && <div className="mt-5 flex-1">{children}</div>}
    </article>
  );
}

export default function Landing({
  signedIn = false,
  hubUrl = "/dashboard",
}: {
  signedIn?: boolean;
  hubUrl?: string;
} = {}) {
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main"
        className="sr-only rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Lewati ke konten utama
      </a>

      <header className="glass sticky top-0 z-50 border-b border-[#e4ecfc]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigasi halaman">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="flex min-h-11 items-center rounded-xl px-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-brand/5 hover:text-brand lg:px-3.5 lg:text-sm"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {signedIn ? (
              <Link href="/dashboard" className="btn btn-primary">
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">Buka Dashboard</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn hidden text-slate-700 hover:bg-slate-100 sm:inline-flex">
                  Masuk
                </Link>
                <Link href="/register" className="btn btn-primary">
                  <span className="sm:hidden">Daftar</span>
                  <span className="hidden sm:inline">Daftar Gratis</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------- HERO ---------- */}
        <section className="aurora relative overflow-hidden">
          <div className="deco-grid-light pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-32 lg:pt-24">
            <div className="rise">
              <p className="eyebrow inline-flex items-center gap-2.5 text-brand">
                <span className="h-0.5 w-6 bg-brand" aria-hidden="true" />
                Belajar Terstruktur &amp; Terarah
              </p>
              <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-[3.6rem]">
                Belajar lebih mudah bersama{" "}
                <span className="squiggle whitespace-nowrap">
                  <span className="text-gradient">CamesAcademic</span>
                </span>
                .
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Pahami materi, latihan soal, dan lihat perkembangan belajarmu dalam satu tempat. Upload
                materi — AI menyusunnya jadi ringkasan, flashcard, kuis, dan tutor siap tanya.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={signedIn ? "/dashboard" : "/register"} className="btn btn-primary px-7 py-3 text-base">
                  Mulai Belajar <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <a href="#fitur" className="btn btn-outline px-6 py-3 text-base">
                  Lihat Fitur
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
                {["PDF, DOCX, foto & teks", "Ringkasan + Flashcard + Quiz", "Tutor AI 24/7"].map((v) => (
                  <li key={v} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rise relative" style={{ animationDelay: "120ms" }}>
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand/25 via-brand-light/20 to-transparent blur-2xl" />
              <LandingPreview />
              <div className="pop absolute -top-5 right-6 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-orange-700 shadow-float ring-1 ring-orange-200/70 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-100">
                  <FlameIcon className="h-4 w-4" />
                </span>
                Streak 7 hari
              </div>
              <div
                className="pop absolute -bottom-5 left-6 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-amber-800 shadow-float ring-1 ring-amber-200/80 sm:flex"
                style={{ animationDelay: "250ms" }}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-soft">
                  <ZapIcon className="h-4 w-4" />
                </span>
                +15 XP
              </div>
            </div>
          </div>
        </section>

        {/* ---------- FAKTA ---------- */}
        <section className="relative z-10 -mt-12 px-4 sm:px-6 lg:-mt-16">
          <div className="card mx-auto grid w-full max-w-6xl grid-cols-2 divide-[#eef3fc] shadow-float lg:grid-cols-4 lg:divide-x">
            {FACTS.map((f, i) => (
              <div
                key={f.label}
                className={`p-5 sm:p-6 ${i < 2 ? "border-b border-[#eef3fc] lg:border-b-0" : ""} ${
                  i % 2 === 0 ? "border-r border-[#eef3fc] lg:border-r-0" : ""
                }`}
              >
                <p className="text-gradient text-4xl font-extrabold tracking-tight">{f.value}</p>
                <p className="mt-1 text-sm font-extrabold text-navy">{f.label}</p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- MASALAH ---------- */}
        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Masalahnya"
              title="Belajar serasa berat? Wajar banget."
              sub="Sering kali bukan kamu yang malas — cara belajarnya yang belum pas. Empat keluhan ini paling sering kami dengar."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PAINS.map((p, i) => (
                <Reveal key={p.title} delay={i * 45}>
                  <div className="card h-full p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/10 text-brand">
                      <QuoteIcon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-extrabold text-navy">{p.title}</h3>
                    <p className="mt-2 text-sm italic leading-relaxed text-slate-600">{p.quote}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-[1.5rem] border border-brand/20 bg-gradient-to-br from-white to-brand/5 p-6 text-center shadow-card sm:p-8">
              <p className="text-balance text-base font-bold leading-relaxed text-navy sm:text-lg">
                CamesAcademic menggabungkan <span className="text-brand">materi</span>,{" "}
                <span className="text-brand">penjelasan</span>, <span className="text-brand">latihan</span>, dan{" "}
                <span className="text-brand">evaluasi</span> dalam satu alur belajar yang utuh.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- FITUR (BENTO) ---------- */}
        <section id="fitur" className="bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Fitur Unggulan"
              title="Semua yang kamu butuhkan untuk belajar"
              sub="Satu platform untuk seluruh kebutuhan belajarmu — hemat waktu, lebih efektif."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <FeatureCard
                  icon={ChatIcon}
                  title="Tutor AI 24/7"
                  desc="Belum paham? Tanya kapan saja. AI menjelaskan pakai bahasa sehari-hari, memberi contoh, bahkan membuatkan soal baru."
                  tone="bg-sky-100 text-sky-700"
                >
                  <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
                    <div className="flex justify-end">
                      <span className="rounded-2xl rounded-br-md bg-gradient-to-br from-brand to-brand-700 px-3.5 py-2 text-xs font-semibold text-white">
                        Bedanya frekuensi dan periode apa?
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-0.5 shadow-card ring-1 ring-[#dbe6fb]">
                        <img
                          src="/assets/aistudio/Tak_berjudul20_20261116212647_17f901f4.png"
                          alt="AI Tutor"
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span className="rounded-2xl rounded-bl-md border border-[#e4ecfc] bg-white px-3.5 py-2 text-xs font-medium leading-relaxed text-slate-700">
                        Frekuensi = berapa kali per detik. Periode = berapa detik untuk satu getaran.
                      </span>
                    </div>
                  </div>
                </FeatureCard>
              </Reveal>

              <Reveal delay={45}>
                <FeatureCard
                  icon={SparkIcon}
                  title="Ringkasan Otomatis"
                  desc="Ratusan halaman materi dirangkum jadi poin-poin penting yang mudah dicerna dalam hitungan detik."
                  tone="bg-blue-100 text-blue-700"
                >
                  <div className="space-y-2" aria-hidden="true">
                    {["w-11/12", "w-9/12", "w-10/12", "w-6/12"].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span className={`h-2 rounded-full bg-slate-200 ${w}`} />
                      </div>
                    ))}
                  </div>
                </FeatureCard>
              </Reveal>

              <Reveal>
                <FeatureCard
                  icon={LayersIcon}
                  title="Flashcard Pintar"
                  desc="Kartu otomatis dari materimu sendiri. Fokus mengulang bagian yang masih sering salah supaya hafalan nempel."
                  tone="bg-indigo-100 text-indigo-700"
                />
              </Reveal>

              <Reveal delay={45}>
                <FeatureCard
                  icon={ClipboardIcon}
                  title="Kuis Interaktif"
                  desc="Soal pilihan ganda dibuat otomatis dari materi, lengkap dengan pembahasan di tiap jawaban."
                  tone="bg-violet-100 text-violet-700"
                />
              </Reveal>

              <Reveal delay={90}>
                <FeatureCard
                  icon={ChartIcon}
                  title="Progress Terukur"
                  desc="Lihat level, XP, streak, dan penguasaan tiap topik. Tahu persis materi mana yang masih lemah."
                  tone="bg-emerald-100 text-emerald-700"
                />
              </Reveal>

              <Reveal className="sm:col-span-2 lg:col-span-3">
                <article className="hero-gradient relative overflow-hidden rounded-[1.25rem] p-6 text-white shadow-float sm:p-8">
                  <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
                  <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-lg">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
                        <UploadIcon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-xl font-extrabold tracking-tight">Upload Materi Apa Saja</h3>
                      <p className="mt-2 text-sm leading-relaxed text-sky-200">
                        PDF, DOCX, foto materi, atau tempel teks langsung. Serahkan sisanya ke AI — kamu
                        tinggal belajar.
                      </p>
                      <Link
                        href={signedIn ? "/materi" : "/login"}
                        className="btn btn-white mt-5 inline-flex px-5 text-sm"
                      >
                        Upload Materi Sekarang <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:w-[26rem]">
                      {[
                        { l: "PDF", i: FileIcon, href: signedIn ? "/materi?mode=file&format=pdf" : "/login" },
                        { l: "DOCX", i: FileTextIcon, href: signedIn ? "/materi?mode=file&format=docx" : "/login" },
                        { l: "Foto", i: ImageIcon, href: signedIn ? "/materi?mode=file&format=foto" : "/login" },
                        { l: "Teks", i: TextIcon, href: signedIn ? "/materi?mode=text" : "/login" },
                      ].map((f) => {
                        const Icon = f.i;
                        return (
                          <li key={f.l}>
                            <Link
                              href={f.href}
                              className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-3 py-4 text-sm font-extrabold text-white ring-1 ring-inset ring-white/20 transition hover:-translate-y-0.5 hover:bg-white/20 hover:ring-white/35 active:scale-95"
                            >
                              <Icon className="h-6 w-6 text-brand-light" />
                              {f.l}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- CARA KERJA ---------- */}
        <section id="alur" className="relative overflow-hidden bg-navy py-16 text-white sm:py-20 lg:py-24">
          <div className="deco-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHead
              light
              eyebrow="Cara Kerja"
              title="Dari materi mentah sampai benar-benar paham"
              sub="Lima langkah sederhana yang bisa kamu ulang untuk materi apa pun."
            />
            <div className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="pointer-events-none absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-transparent via-brand-light/50 to-transparent lg:block" />
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Reveal key={s.title} delay={i * 45} className="sm:last:col-span-2 lg:last:col-span-1">
                    <div className="relative h-full rounded-[1.25rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                      <span className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-700 shadow-[0_10px_24px_-10px_rgba(37,99,235,0.9)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="eyebrow mt-4 block text-brand-light">Langkah 0{i + 1}</span>
                      <h3 className="mt-1.5 text-lg font-extrabold text-white">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-sky-200">{s.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- BANDINGKAN ---------- */}
        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Kenapa CamesAcademic?"
              title="Bandingkan dengan cara belajar biasa"
              sub="Sama-sama belajar, hasilnya beda ketika semua terhubung."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <p className="eyebrow text-slate-600">Cara biasa</p>
                <ul className="mt-5 space-y-4">
                  {COMPARE.map((c) => (
                    <li key={c} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600">
                        <XIcon className="h-3.5 w-3.5" />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hero-gradient relative overflow-hidden rounded-[1.5rem] p-6 text-white shadow-float sm:p-8">
                <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
                <div className="relative">
                  <p className="eyebrow text-brand-light">Bersama CamesAcademic</p>
                  <ul className="mt-5 space-y-4">
                    {COMPARE_US.map((c) => (
                      <li key={c} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-white">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-light text-navy">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- MATA PELAJARAN ---------- */}
        <section id="pelajaran" className="bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Mata Pelajaran"
              title="Materi sekolah, lengkap dalam satu aplikasi"
              sub="Pilih pelajaran, upload materinya, dan biarkan AI menyusun pengalaman belajarmu."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {SUBJECTS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Reveal key={s.name} delay={i * 45} className="sm:last:col-span-2 lg:last:col-span-1">
                    <div className="card card-hover h-full p-6 text-center">
                      <span className={`mx-auto grid h-14 w-14 place-items-center rounded-3xl ${s.tone}`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-4 text-base font-extrabold leading-snug text-navy">{s.name}</h3>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {s.chips.join(" · ")}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Pertanyaan Umum"
              title="Hal-hal yang sering ditanyakan"
              sub="Masih ada yang mau ditanyakan? Hubungi kami lewat CamesHub."
            />
            <div className="mt-10 space-y-3">
              {FAQS.map((f, i) => (
                <Reveal key={f.q} delay={i * 45}>
                  <details className="card group overflow-hidden transition open:border-brand/30 open:shadow-lift">
                    <summary className="flex min-h-14 items-center justify-between gap-4 px-5 py-4 text-sm font-extrabold text-navy sm:text-base">
                      {f.q}
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand transition group-open:bg-brand group-open:text-white">
                        <ChevronRightIcon className="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90" />
                      </span>
                    </summary>
                    <p className="border-t border-[#eef3fc] px-5 py-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="bg-surface py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="hero-gradient relative overflow-hidden rounded-[2rem] px-6 py-14 text-center shadow-float sm:px-10 sm:py-16">
              <div className="deco-grid pointer-events-none absolute inset-0 opacity-40" />
              <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-brand-light/30 blur-3xl" />
              <div className="relative">
                <LogoMark light size={56} className="mx-auto shadow-lg" />
                <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Siap belajar lebih terarah?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-sky-200">
                  Upload materi pertamamu, dan lihat AI menyusunnya jadi ringkasan, flashcard, dan kuis
                  dalam hitungan menit.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href={signedIn ? "/dashboard" : "/register"} className="btn btn-white px-7 py-3 text-base">
                    {signedIn ? "Buka Dashboard" : "Mulai Belajar"} <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <a href={hubUrl} className="btn btn-glass px-6 py-3 text-base">
                    Kunjungi CamesHub <HubIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy-900 text-slate-300">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-3.5 max-w-xs text-sm leading-relaxed text-slate-400">
              CamesAcademic (Cames Academic) — platform belajar AI dari Cames untuk pelajar Indonesia. Pahami
              materi, latihan soal, dan pantau progress belajarmu.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-sky-200 ring-1 ring-inset ring-white/10">
              <ShieldIcon className="h-4 w-4" /> Academic.cames.my.id
            </span>
          </div>
          <div>
            <p className="eyebrow text-sky-300">Jelajahi</p>
            <ul className="mt-4 space-y-1 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="inline-flex min-h-9 items-center font-medium text-slate-300 transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-sky-300">Akun</p>
            <ul className="mt-4 space-y-1 text-sm">
              <li>
                <Link href="/login" className="inline-flex min-h-9 items-center font-medium text-slate-300 transition hover:text-white">
                  Masuk
                </Link>
              </li>
              <li>
                <Link href="/register" className="inline-flex min-h-9 items-center font-medium text-slate-300 transition hover:text-white">
                  Daftar Gratis
                </Link>
              </li>
              <li>
                <a href={hubUrl} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-slate-300 transition hover:text-white">
                  CamesHub <HubIcon className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="inline-flex min-h-9 items-center font-medium text-slate-300 transition hover:text-white">
                  Buka App
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6">
            <p>© 2026 Cames. Seluruh hak cipta dilindungi.</p>
            <p>Dibuat untuk pelajar yang ingin benar-benar paham.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
