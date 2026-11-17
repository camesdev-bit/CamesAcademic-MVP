// Warna avatar pelajaran — deterministik dari nama pelajaran/judul.
const SUBJECT_TONES = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-800",
  "bg-indigo-100 text-indigo-700",
];

export function subjectTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SUBJECT_TONES[h % SUBJECT_TONES.length];
}

export function subjectInitial(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "M";
}

export type StatusBadge = { label: string; cls: string };

export function statusBadge(status: string): StatusBadge {
  if (status === "READY")
    return { label: "Siap", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
  if (status === "FAILED")
    return { label: "Gagal", cls: "bg-red-50 text-red-700 ring-red-600/20" };
  return { label: "Diproses", cls: "bg-amber-50 text-amber-800 ring-amber-600/20" };
}
