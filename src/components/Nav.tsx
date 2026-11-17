"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { xpProgress } from "@/lib/xp";
import { LogoMark } from "./Logo";
import ProgressRing from "./ProgressRing";
import { BookIcon, ChartIcon, FlameIcon, HomeIcon, HubIcon, LogoutIcon } from "./icons";
import { auth, signOut } from "@/lib/firebase";

import { safeStorage } from "@/lib/storage";
import { apiFetch } from "@/lib/api";

export type NavUser = {
  name: string;
  xp: number;
  level: number;
  streak: number;
};

const ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: HomeIcon },
  { href: "/materi", label: "Materi", icon: BookIcon },
  { href: "/progress", label: "Progress", icon: ChartIcon },
];

function hubUrl() {
  return "https://cames.my.id";
}

export default function Nav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await signOut(auth);
    } catch {}
    safeStorage.removeItem("cames_user_id");
    safeStorage.removeItem("cames_user_name");
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const xp = xpProgress(user.xp);

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-[#e4ecfc] shadow-[0_6px_24px_-16px_rgba(15,23,42,0.18)]">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2"
            aria-label="CamesAcademic — beranda"
          >
            <LogoMark size={32} className="sm:!h-9 sm:!w-9" />
            <span className="whitespace-nowrap text-[14.5px] font-extrabold tracking-tight text-navy sm:text-[17px]">
              Cames<span className="text-brand">Academic</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 rounded-2xl bg-slate-100/80 p-1 ring-1 ring-inset ring-slate-200/60 md:flex"
            aria-label="Navigasi utama"
          >
            {ITEMS.map((it) => {
              const Icon = it.icon;
              const isActive = active(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-white text-brand shadow-[0_1px_2px_rgba(15,23,42,0.08),0_4px_10px_-6px_rgba(15,23,42,0.2)]"
                      : "text-slate-600 hover:text-navy"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span
              className="flex h-8 items-center gap-1 rounded-xl bg-orange-50 px-2 text-xs font-extrabold text-orange-700 ring-1 ring-inset ring-orange-200/80 sm:h-9 sm:px-2.5"
              title="Streak belajar"
            >
              <FlameIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {user.streak}
              <span className="sr-only"> hari beruntun</span>
            </span>

            <Link
              href="/progress"
              className="flex h-8 items-center gap-1.5 rounded-xl bg-white px-1.5 text-xs ring-1 ring-inset ring-[#e4ecfc] transition hover:border-brand/30 hover:bg-ice/60 sm:h-9 sm:gap-2 sm:px-2.5"
              title={`Level ${user.level} · ${user.xp} XP`}
            >
              <ProgressRing
                pct={xp.pct}
                size={24}
                stroke={3.5}
                label={`Level ${user.level}, ${xp.pct}% menuju level berikutnya`}
              >
                <span className="text-[10px] font-extrabold text-navy">{user.level}</span>
              </ProgressRing>
              <div className="hidden leading-tight min-[440px]:block">
                <div className="hidden max-w-[7rem] truncate font-extrabold text-navy sm:block">
                  {user.name}
                </div>
                <div className="font-bold text-slate-600 sm:font-semibold">
                  <span className="sm:hidden">{user.xp} XP</span>
                  <span className="hidden sm:inline">
                    Lv {user.level} · {user.xp} XP
                  </span>
                </div>
              </div>
            </Link>

            <a
              href={hubUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Kunjungi CamesHub"
              title="Kunjungi CamesHub"
              className="grid h-8 w-8 place-items-center rounded-xl border border-[#e4ecfc] bg-white text-slate-600 transition hover:border-brand/30 hover:bg-ice hover:text-brand sm:h-9 sm:w-9"
            >
              <HubIcon className="h-4 w-4" />
            </a>

            <button
              onClick={logout}
              disabled={busy}
              aria-label="Keluar dari akun"
              title="Keluar dari akun"
              className="grid h-8 w-8 place-items-center rounded-xl border border-transparent text-slate-600 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 sm:h-9 sm:w-9"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigasi utama"
      >
        <div className="glass mx-auto grid max-w-sm grid-cols-3 gap-1.5 rounded-2xl border border-[#dbe6fb] p-1.5 shadow-dock">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const isActive = active(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition ${
                  isActive
                    ? "bg-gradient-to-b from-brand to-brand-700 text-white shadow-[0_8px_16px_-8px_rgba(37,99,235,0.8)]"
                    : "text-slate-600 hover:text-navy active:bg-slate-100"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
