export const XP_PER_LEVEL = 500;
export const XP_CORRECT = 15;
export const XP_WRONG = 3;
export const XP_FLASHCARD = 2;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
}

export function calculateMasteryScore(correct: number, wrong: number): number {
  const total = correct + wrong;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
}

export function touchActivityHelper(
  currentStreak: number,
  lastActiveAtStr: string | null,
  now: Date
): number {
  if (!lastActiveAtStr) return 1;

  const lastDate = new Date(lastActiveAtStr);
  const startOfNow = new Date(now);
  startOfNow.setHours(0, 0, 0, 0);

  const startOfLast = new Date(lastDate);
  startOfLast.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (startOfNow.getTime() - startOfLast.getTime()) / 86_400_000
  );

  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

export function determineStatusBadge(status: string): { label: string; cls: string } {
  if (status === "READY") {
    return { label: "Siap", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
  }
  if (status === "FAILED") {
    return { label: "Gagal", cls: "bg-red-50 text-red-700 ring-red-600/20" };
  }
  return { label: "Diproses", cls: "bg-amber-50 text-amber-800 ring-amber-600/20" };
}
