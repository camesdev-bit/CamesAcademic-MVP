// Konstanta & helper XP murni (aman dipakai di client component — tanpa Prisma).
export const XP_PER_LEVEL = 500;

export function xpProgress(xp: number) {
  const into = xp % XP_PER_LEVEL;
  return {
    into,
    need: XP_PER_LEVEL,
    pct: Math.round((into / XP_PER_LEVEL) * 100),
    remaining: XP_PER_LEVEL - into,
  };
}
