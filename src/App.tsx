import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { RouterProvider, usePathname, useRouter } from "./lib/router";
import Nav, { NavUser } from "./components/Nav";
import Landing from "./components/landing/Landing";
import DashboardView, { DashboardData } from "./components/views/DashboardView";
import MateriListView, { MateriItem } from "./components/views/MateriListView";
import ProgressView, { ProgressData } from "./components/views/ProgressView";
import LearningSpace from "./components/LearningSpace";
import MaterialHeader from "./components/views/MaterialHeader";
import ProcessingClient from "./components/ProcessingClient";
import AuthShell from "./components/AuthShell";
import AuthForm from "./components/AuthForm";
import { auth, onAuthStateChanged } from "./lib/firebase";
import { safeStorage } from "./lib/storage";
import { apiFetch } from "./lib/api";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="card max-w-md w-full p-6 text-center space-y-4 shadow-float">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 grid place-items-center font-black text-xl">
              !
            </div>
            <h2 className="text-xl font-extrabold text-navy">Memuat Ulang Tampilan</h2>
            <p className="text-sm text-slate-600">
              Terjadi penyesuaian pada tampilan preview. Klik tombol di bawah untuk memuat ulang.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-primary w-full py-2.5"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<NavUser>(() => ({
    name: safeStorage.getItem("cames_user_name") || "Pelajar",
    xp: 0,
    level: 1,
    streak: 1,
  }));

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [materialsList, setMaterialsList] = useState<MateriItem[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync user state and current route data
  const loadUserData = async () => {
    try {
      const res = await apiFetch("/api/dashboard");
      if (res.ok) {
        const d = await res.json();
        setUser(d.user);
        setDashboardData(d);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        safeStorage.setItem("cames_user_id", fbUser.uid);
        if (fbUser.displayName) {
          safeStorage.setItem("cames_user_name", fbUser.displayName);
        }
        loadUserData();
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    loadUserData();
    const handleRefresh = () => {
      loadUserData();
    };
    window.addEventListener("app:refresh", handleRefresh);
    return () => window.removeEventListener("app:refresh", handleRefresh);
  }, []);

  // Keep page title, canonical URL, and og:url synced per route for SEO
  useEffect(() => {
    const routeTitles: Record<string, string> = {
      "/": "CamesAcademic (Cames Academic) — AI Learning Platform",
      "/dashboard": "Dashboard Belajar — CamesAcademic (Cames Academic)",
      "/materi": "Perpustakaan Materi — CamesAcademic (Cames Academic)",
      "/progress": "Progress & Penguasaan — CamesAcademic (Cames Academic)",
      "/login": "Masuk — CamesAcademic (Cames Academic)",
      "/register": "Daftar Gratis — CamesAcademic (Cames Academic)",
    };

    const nextTitle =
      routeTitles[pathname] ||
      (pathname.startsWith("/materi/")
        ? "Ruang Belajar Materi — CamesAcademic (Cames Academic)"
        : "CamesAcademic (Cames Academic) — AI Learning Platform");
    document.title = nextTitle;

    const currentUrl = `${window.location.origin}${pathname === "/" ? "/" : pathname}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", currentUrl);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", currentUrl);
  }, [pathname]);

  // Route-specific data loaders
  useEffect(() => {
    let active = true;
    setError("");

    if (pathname === "/dashboard") {
      setLoading(true);
      apiFetch("/api/dashboard")
        .then(async (res) => {
          const text = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(text);
          } catch {}
          if (!res.ok || !data || data.error) {
            throw new Error(data?.error || `Server error (${res.status})`);
          }
          return data;
        })
        .then((data) => {
          if (active) {
            setDashboardData(data);
            if (data.user) setUser(data.user);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : "Gagal memuat dashboard");
            setLoading(false);
          }
        });
    } else if (pathname === "/materi") {
      setLoading(true);
      apiFetch("/api/materials")
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok || !Array.isArray(data)) {
            throw new Error(data?.error || `Gagal memuat materi (${res.status})`);
          }
          return data;
        })
        .then((data) => {
          if (active) {
            setMaterialsList(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : "Gagal memuat materi");
            setLoading(false);
          }
        });
    } else if (pathname === "/progress") {
      setLoading(true);
      apiFetch("/api/progress")
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok || !data || data.error) {
            throw new Error(data?.error || `Gagal memuat progres (${res.status})`);
          }
          return data;
        })
        .then((data) => {
          if (active) {
            setProgressData(data);
            if (data.user) {
              setUser((prev) => ({
                name: prev.name,
                xp: data.user.xp,
                level: data.user.level,
                streak: data.user.streak,
              }));
            }
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : "Gagal memuat progres");
            setLoading(false);
          }
        });
    } else if (pathname.startsWith("/materi/") && !pathname.endsWith("/proses")) {
      const id = pathname.replace("/materi/", "");
      setLoading(true);
      (async () => {
        let res = await apiFetch(`/api/materials/${id}`);
        if (res.status === 404) {
          try {
            const rawSnap = window.sessionStorage.getItem(`cames_mat_snapshot_${id}`);
            if (rawSnap) {
              const r = await apiFetch(`/api/materials/${id}/restore`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snapshot: JSON.parse(rawSnap) }),
              });
              if (r.ok) {
                res = await apiFetch(`/api/materials/${id}`);
              }
            }
          } catch {}
        }
        if (!res.ok) throw new Error("Materi tidak ditemukan");
        return res.json();
      })()
        .then((data) => {
          if (active) {
            setActiveMaterial(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.message);
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [pathname]);

  // Auth pages
  if (pathname === "/login") {
    return (
      <AuthShell
        eyebrow="Selamat datang kembali"
        title="Masuk ke Akun Kamu"
        tagline="Satu platform untuk memahami semua materi belajar."
      >
        <AuthForm mode="login" />
      </AuthShell>
    );
  }

  if (pathname === "/register") {
    return (
      <AuthShell
        eyebrow="Mulai sekarang"
        title="Daftar Akun Baru"
        tagline="Ubah materi apapun jadi ringkasan, flashcard, dan kuis adaptif."
      >
        <AuthForm mode="register" />
      </AuthShell>
    );
  }

  // Landing page
  if (pathname === "/" || pathname === "") {
    const isAuth = Boolean(auth.currentUser || safeStorage.getItem("cames_user_id"));
    return <Landing signedIn={isAuth} hubUrl="/dashboard" />;
  }

  // In-app pages (with Top Nav and Safe Area Bottom Nav)
  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-surface">
      <Nav user={user} />

      <main className="mx-auto max-w-5xl px-4 pt-6">
        {pathname === "/dashboard" && dashboardData && (
          <DashboardView data={dashboardData} />
        )}

        {pathname === "/dashboard" && !dashboardData && loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <span className="spinner text-brand h-8 w-8" />
            <p className="text-sm font-bold text-slate-500">Menyiapkan dashboard...</p>
          </div>
        )}

        {pathname === "/materi" && (
          <MateriListView materials={materialsList} />
        )}

        {pathname === "/progress" && progressData && (
          <ProgressView data={progressData} />
        )}

        {pathname.startsWith("/materi/") && pathname.endsWith("/proses") && (
          <ProcessingClient
            id={pathname.split("/")[2]}
            title="Mempersiapkan Materi Belajar"
            initialStatus="EXTRACTING"
          />
        )}

        {pathname.startsWith("/materi/") &&
          !pathname.endsWith("/proses") &&
          activeMaterial && (
            <div className="space-y-6">
              <MaterialHeader
                title={activeMaterial.material.title}
                subject={activeMaterial.material.subject}
                sourceType={activeMaterial.material.sourceType}
                flashcards={activeMaterial.material.flashcards}
                questions={activeMaterial.material.questions}
              />
              <LearningSpace
                materialId={activeMaterial.material.id}
                summary={activeMaterial.summary}
                cards={activeMaterial.cards}
                history={activeMaterial.history}
                stats={activeMaterial.stats}
                mastery={activeMaterial.mastery}
              />
            </div>
          )}

        {loading && pathname !== "/dashboard" && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <span className="spinner text-brand h-8 w-8" />
            <p className="text-sm font-bold text-slate-500">Memuat materi...</p>
          </div>
        )}

        {error && !loading && (
          <div className="card mx-auto max-w-md border-red-200 p-6 text-center space-y-3">
            <p className="font-extrabold text-red-600">Gagal memuat data</p>
            <p className="text-sm text-slate-600">{error}</p>
            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Coba Lagi
              </button>
              {pathname !== "/materi" && (
                <button
                  onClick={() => router.push("/materi")}
                  className="btn btn-ghost"
                >
                  Buka Materi
                </button>
              )}
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          pathname !== "/dashboard" &&
          pathname !== "/materi" &&
          pathname !== "/progress" &&
          !pathname.startsWith("/materi/") && (
            <div className="card p-8 text-center space-y-4">
              <p className="text-lg font-extrabold text-navy">Halaman tidak ditemukan</p>
              <p className="text-sm text-slate-600">Mari kembali ke Beranda atau Materi.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn btn-primary"
              >
                Buka Dashboard
              </button>
            </div>
          )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </ErrorBoundary>
  );
}
