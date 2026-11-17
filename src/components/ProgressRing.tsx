"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  pct: number;
  size?: number;
  stroke?: number;
  /** "brand" untuk latar terang, "light" untuk latar navy */
  tone?: "brand" | "light" | "success";
  children?: React.ReactNode;
  label?: string;
};

const TONES = {
  brand: { from: "#2563eb", to: "#60a5fa", track: "#e2e8f5" },
  light: { from: "#ffffff", to: "#93c5fd", track: "rgba(255,255,255,0.2)" },
  success: { from: "#10b981", to: "#2dd4bf", track: "#e2e8f5" },
} as const;

export default function ProgressRing({
  pct,
  size = 120,
  stroke = 10,
  tone = "brand",
  children,
  label,
}: Props) {
  const id = useId();
  const clamped = Math.max(0, Math.min(100, pct));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setShown(clamped), 60);
    return () => window.clearTimeout(t);
  }, [clamped]);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const c = TONES[tone];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${clamped}%`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.from} />
            <stop offset="100%" stopColor={c.to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (shown / 100) * circ}
          className="ring-fill"
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}
