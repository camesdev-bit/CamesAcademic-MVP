"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileIcon, SparkIcon, TextIcon, UploadIcon, XIcon } from "./icons";

import { apiFetch } from "@/lib/api";

type Mode = "file" | "text";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: Mode = searchParams.get("mode") === "text" ? "text" : "file";
  const formatHint = searchParams.get("format");
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const qMode = searchParams.get("mode");
    if (qMode === "text" || qMode === "file") {
      setMode(qMode);
    }
  }, [searchParams]);

  function pickFile(f: File | undefined) {
    setFileName(f?.name ?? "");
    setFileSize(f?.size ?? 0);
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    pickFile(undefined);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f || !fileRef.current) return;
    fileRef.current.files = e.dataTransfer.files;
    pickFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      if (title.trim()) fd.set("title", title.trim());
      if (subject.trim()) fd.set("subject", subject.trim());
      if (mode === "file") {
        const f = fileRef.current?.files?.[0];
        if (!f) {
          setError("Pilih file terlebih dahulu");
          setBusy(false);
          return;
        }
        fd.set("file", f);
      } else {
        if (text.trim().length < 30) {
          setError("Tempel materi minimal 30 karakter");
          setBusy(false);
          return;
        }
        fd.set("text", text);
      }

      const res = await apiFetch("/api/materials", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal mengupload materi");
        return;
      }
      if (data.seed) {
        try {
          window.sessionStorage.setItem(`cames_mat_seed_${data.id}`, JSON.stringify(data.seed));
        } catch {
          // Ignore storage quota errors
        }
      }
      router.push(`/materi/${data.id}/proses`);
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card relative overflow-hidden p-5 sm:p-6">
      <div className="deco-grid-light pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-70 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
      <div className="relative space-y-5">
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-700 text-white shadow-[0_10px_20px_-10px_rgba(37,99,235,0.9)]">
            <SparkIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow text-brand">Materi baru</p>
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-navy">
              Masukkan materi, AI menyusunnya
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-inset ring-slate-200/60">
          {(
            [
              { key: "file", label: "Upload File", icon: FileIcon },
              { key: "text", label: "Paste Teks", icon: TextIcon },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={mode === m.key}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                  mode === m.key
                    ? "bg-white text-brand shadow-[0_1px_2px_rgba(15,23,42,0.08),0_4px_10px_-6px_rgba(15,23,42,0.2)]"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="up-title" className="mb-1.5 block text-sm font-bold text-slate-700">
              Judul <span className="font-medium text-slate-500">(opsional)</span>
            </label>
            <input
              id="up-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth. Hukum Newton"
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="up-subject" className="mb-1.5 block text-sm font-bold text-slate-700">
              Pelajaran <span className="font-medium text-slate-500">(opsional)</span>
            </label>
            <input
              id="up-subject"
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="cth. IPA, Matematika"
              maxLength={60}
            />
          </div>
        </div>

        {mode === "file" ? (
          <div>
            <span className="mb-1.5 block text-sm font-bold text-slate-700">File materi</span>
            <label
              htmlFor="up-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
                dragging
                  ? "scale-[1.01] border-brand bg-brand/10"
                  : fileName
                    ? "border-brand/60 bg-brand/5"
                    : "border-slate-300 bg-slate-50/70 hover:border-brand/60 hover:bg-brand/5"
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand shadow-card ring-1 ring-inset ring-[#e4ecfc]">
                {fileName ? <FileIcon className="h-6 w-6" /> : <UploadIcon className="h-6 w-6" />}
              </span>
              <span className="max-w-full truncate text-sm font-extrabold text-navy">
                {fileName || (dragging ? "Lepaskan file di sini" : "Klik atau seret file ke sini")}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {fileName
                  ? `${formatSize(fileSize)} · klik untuk ganti file`
                  : formatHint === "foto"
                    ? "Foto materi (PNG, JPG, WEBP) · maks 4MB"
                    : formatHint === "pdf"
                      ? "Dokumen PDF materi · maks 4MB"
                      : formatHint === "docx"
                        ? "Dokumen Word (.docx) · maks 4MB"
                        : "PDF, DOCX, TXT, MD, atau gambar materi · maks 4MB"}
              </span>
            </label>
            <input
              id="up-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp"
              onChange={(e) => pickFile(e.target.files?.[0])}
              className="sr-only"
            />
            {fileName && (
              <button
                type="button"
                onClick={clearFile}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-slate-600 hover:text-red-600"
              >
                <XIcon className="h-3.5 w-3.5" /> Hapus file
              </button>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="up-text" className="mb-1.5 block text-sm font-bold text-slate-700">
              Teks materi
            </label>
            <textarea
              id="up-text"
              className="input min-h-44 resize-y font-mono text-sm leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tempel materi belajarmu di sini..."
            />
            <p
              className={`mt-1.5 text-xs font-semibold tabular-nums ${
                text.trim().length >= 30 ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {text.trim().length} karakter (min 30)
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> Mengupload...
            </>
          ) : (
            <>
              <SparkIcon className="h-4 w-4" /> Proses dengan AI
            </>
          )}
        </button>
      </div>
    </form>
  );
}
