import Link from "next/link";
import UploadForm from "@/components/UploadForm";
import { ArrowRightIcon, BookIcon } from "@/components/icons";
import { statusBadge, subjectInitial, subjectTone } from "@/lib/subject";

export type MateriItem = {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  sourceType: string;
  questions: number;
  flashcards: number;
  dateLabel: string;
};

export default function MateriListView({ materials }: { materials: MateriItem[] }) {
  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow text-brand">Perpustakaan kamu</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Materi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Satu materi masuk → ringkasan, flashcard, quiz, dan tutor siap belajar.
        </p>
      </div>

      <UploadForm />

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold tracking-tight text-navy">
          Semua materi
          <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-extrabold text-brand tabular-nums">
            {materials.length}
          </span>
        </h2>

        {materials.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-brand/15 to-brand-light/20 text-brand">
              <BookIcon className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-extrabold text-navy">Belum ada materi</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-600">
              Mulai dari form di atas. PDF, DOCX, gambar, atau teks — semuanya bisa.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {materials.map((m) => {
              const badge = statusBadge(m.status);
              const href = `/materi/${m.id}${m.status === "READY" ? "" : "/proses"}`;
              const seed = m.subject || m.title;
              return (
                <li key={m.id}>
                  <Link href={href} className="card card-hover group flex h-full flex-col gap-4 p-4">
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-base font-extrabold ${subjectTone(seed)}`}
                      >
                        {subjectInitial(seed)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-bold leading-snug text-navy">{m.title}</p>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                          {m.subject || "Tanpa pelajaran"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef3fc] pt-3 text-xs font-semibold text-slate-600">
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold uppercase tracking-wide text-slate-600">
                          {m.sourceType}
                        </span>
                        {m.status === "READY" && (
                          <span className="tabular-nums">
                            {m.questions} soal · {m.flashcards} kartu
                          </span>
                        )}
                        <span>{m.dateLabel}</span>
                      </span>
                      <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand" />
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
