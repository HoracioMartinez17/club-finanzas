"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FiMenu, FiX, FiLogOut, FiGrid, FiShield, FiActivity } from "react-icons/fi";

const ensureAuthFetch = () => {
  if (typeof window === "undefined") {
    return;
  }

  const guard = window as typeof window & { __authFetchPatched?: boolean };
  if (guard.__authFetchPatched) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const isApiRequest = url.startsWith("/api/");
    const authToken = localStorage.getItem("token_superadmin");

    if (!isApiRequest || !authToken) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    if (input instanceof Request) {
      return originalFetch(new Request(input, { ...init, headers }));
    }

    return originalFetch(input, { ...init, headers });
  };

  guard.__authFetchPatched = true;
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  ensureAuthFetch();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAuth = async () => {
      try {
        const token = localStorage.getItem("token_superadmin");
        if (!token) {
          router.push("/login");
          return;
        }

        setLoading(false);
      } catch (error) {
        router.push("/login");
      }
    };

    verificarAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout?role=superadmin", { method: "POST" });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }

    localStorage.removeItem("token_superadmin");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-slate-950/50 backdrop-blur-xl border-r border-slate-700/50 text-slate-100 transition-all duration-300 overflow-hidden flex flex-col md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 md:w-64" : "-translate-x-full md:w-20"
        }`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Super Admin
              </h1>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-2 flex flex-col gap-2 overflow-y-auto flex-1">
          <NavLink
            href="/super-admin/clubes"
            icon={<FiGrid />}
            label="Clubes"
            open={sidebarOpen}
            active={pathname === "/super-admin/clubes"}
          />
          <NavLink
            href="/super-admin/audit-log"
            icon={<FiActivity />}
            label="Auditoría"
            open={sidebarOpen}
            active={pathname === "/super-admin/audit-log"}
          />
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-slate-700/50 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-rose-300 hover:bg-rose-900/30 hover:text-rose-200 cursor-pointer ${sidebarOpen ? "" : "justify-center"}`}
            title={!sidebarOpen ? "Salir" : ""}
          >
            <span className="text-xl">
              <FiLogOut />
            </span>
            {sidebarOpen && <span className="font-medium">Salir</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          aria-label="Cerrar menú"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  open,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active: boolean;
}) {
  const pathname = usePathname();
  const isActive = active || pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30"
          : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
      } ${open ? "" : "justify-center"}`}
      title={!open ? label : ""}
    >
      <span className="text-xl">{icon}</span>
      {open && <span className="font-medium">{label}</span>}
    </Link>
  );
}
