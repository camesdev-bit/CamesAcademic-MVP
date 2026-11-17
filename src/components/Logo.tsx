import Link from "next/link";

export default function Logo({
  href = "/",
  tone = "dark",
  compact = false,
}: {
  href?: string;
  /** dark = teks navy (latar terang), light = teks putih (latar gelap) */
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const light = tone === "light";
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="CamesAcademic — beranda">
      <LogoMark light={light} size={38} />
      {!compact && (
        <span
          className={`text-[17px] font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}
        >
          Cames<span className={light ? "text-brand-light" : "text-brand"}>Academic</span>
        </span>
      )}
    </Link>
  );
}

/** Logo "C" bertopi toga + buku, selalu di atas ubin berlatar agar kontras terjaga. */
export function LogoMark({
  light = false,
  size = 38,
  className = "",
}: {
  light?: boolean;
  size?: number;
  className?: string;
}) {
  const pad = Math.round(size * 0.14);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl ${
        light
          ? "bg-white shadow-sm"
          : "bg-gradient-to-br from-white to-ice shadow-sm ring-1 ring-inset ring-[#cfe0fb]"
      } ${className}`}
      style={{ width: size, height: size, padding: pad }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={size} height={size} className="h-full w-full object-contain" />
    </span>
  );
}
