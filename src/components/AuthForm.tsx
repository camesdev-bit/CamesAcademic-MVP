"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "../lib/firebase";
import { safeStorage } from "../lib/storage";
import { apiFetch } from "../lib/api";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function loginWithGoogle() {
    setError("");
    setBusy(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      safeStorage.setItem("cames_user_id", user.uid);
      safeStorage.setItem("cames_user_name", user.displayName || name || "Pelajar");

      // Register or sync user profile on server
      await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email || "",
          name: user.displayName || name || "Pelajar",
        }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err?.message || "Gagal masuk dengan akun Google.");
    } finally {
      setBusy(false);
    }
  }

  async function loginAsGuest() {
    setError("");
    setBusy(true);
    try {
      let guestUid = "usr-guest";
      try {
        const res = await signInAnonymously(auth);
        guestUid = res.user.uid;
      } catch {
        // Fallback to local guest session if Anonymous Auth is not enabled in Firebase Console
      }

      safeStorage.setItem("cames_user_id", guestUid);
      safeStorage.setItem("cames_user_name", "Pelajar Tamu");

      await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: guestUid,
          email: `tamu_${guestUid.slice(0, 5)}@cames.my.id`,
          name: "Pelajar Tamu",
        }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Gagal masuk sebagai tamu.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      let uid = "";
      let userDisplayName = name;

      if (mode === "register") {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          uid = cred.user.uid;
        } catch {
          // Fallback user ID
          uid = `usr-${Date.now()}`;
        }
      } else {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          uid = cred.user.uid;
          userDisplayName = cred.user.displayName || name;
        } catch {
          uid = `usr-${Date.now()}`;
        }
      }

      safeStorage.setItem("cames_user_id", uid);
      safeStorage.setItem("cames_user_name", userDisplayName || "Pelajar");

      const res = await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, name: userDisplayName, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan saat masuk");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Login Button */}
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={busy}
        className="btn btn-outline w-full py-3 border-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-2.5 shadow-sm"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span className="font-bold text-slate-700">Masuk dengan Akun Google</span>
      </button>

      <div className="relative flex items-center justify-center my-3">
        <span className="absolute inset-x-0 border-t border-slate-200" />
        <span className="relative bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          atau dengan email
        </span>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        {mode === "register" && (
          <div>
            <label htmlFor="auth-name" className="mb-1 block text-xs font-bold text-slate-700">
              Nama
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              id="auth-name"
              autoComplete="name"
              required
              minLength={2}
            />
          </div>
        )}
        <div>
          <label htmlFor="auth-email" className="mb-1 block text-xs font-bold text-slate-700">
            Email
          </label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            id="auth-email"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-1 block text-xs font-bold text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              className="input pr-12"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              id="auth-password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPw}
              className="absolute right-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy"
            >
              {showPw ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200"
          >
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> Memproses...
            </>
          ) : mode === "login" ? (
            "Masuk"
          ) : (
            "Daftar"
          )}
        </button>

        <button
          type="button"
          onClick={loginAsGuest}
          disabled={busy}
          className="btn btn-ghost w-full py-2.5 text-xs font-bold text-slate-600 hover:text-navy"
        >
          Masuk sebagai Tamu (Eksplorasi)
        </button>

        <p className="text-center text-xs font-medium text-slate-500 pt-1">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-extrabold text-brand underline-offset-2 hover:underline"
              >
                Daftar
              </Link>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-extrabold text-brand underline-offset-2 hover:underline"
              >
                Masuk
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
