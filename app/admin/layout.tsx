"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiSettings,
  FiTrendingDown,
  FiPackage,
} from "react-icons/fi";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado y es admin
    const verificarAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Aquí podrías verificar si el usuario es admin
        // Por ahora asumimos que si tiene token, es válido
        setUser({ email: "admin@club.com" }); // Deberías decodificar el token
        setLoading(false);
      } catch (error) {
        router.push("/login");
      }
    };

    verificarAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">Cargando...</div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-slate-950 text-slate-100 transition-all duration-300 overflow-hidden flex flex-col md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 md:w-64" : "-translate-x-full md:w-20"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          {sidebarOpen && (
            <h1 className="text-xl font-semibold tracking-wide text-slate-100">
              Club Admin
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded"
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="mt-6 px-2 flex flex-col gap-2 overflow-y-auto flex-1">
          <NavLink
            href="/admin/dashboard"
            icon={<FiHome />}
            label="Dashboard"
            open={sidebarOpen}
          />
          <NavLink
            href="/admin/colectas"
            icon={<FiDollarSign />}
            label="Colectas"
            open={sidebarOpen}
          />
          <NavLink
            href="/admin/aportes"
            icon={<FiTrendingUp />}
            label="Aportes"
            open={sidebarOpen}
          />
          <NavLink
            href="/admin/ingresos"
            icon={<FiPackage />}
            label="Ingresos"
            open={sidebarOpen}
          />
          <NavLink
            href="/admin/gastos"
            icon={<FiTrendingDown />}
            label="Gastos"
            open={sidebarOpen}
          />
          <NavLink
            href="/admin/miembros"
            icon={<FiUsers />}
            label="Miembros"
            open={sidebarOpen}
          />
          <NavLink
            href="/admin/usuarios"
            icon={<FiSettings />}
            label="Usuarios"
            open={sidebarOpen}
            hideOnDesktop={true}
          />
        </nav>

        {/* Logout Button - Always visible at bottom */}
        <div className="p-2 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition text-rose-300 hover:bg-rose-900/30 hover:text-rose-200 cursor-pointer ${sidebarOpen ? "" : "justify-center"}`}
            title={!sidebarOpen ? "Salir" : ""}
          >
            <span className="text-xl">
              <FiLogOut />
            </span>
            {sidebarOpen && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Cerrar menú"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-950/95 border-b border-slate-800 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded bg-slate-900 text-slate-100 hover:bg-slate-800 md:hidden"
              aria-label="Abrir menú"
            >
              <FiMenu />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
              Panel de Administración
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline text-sm text-slate-400">{user?.email}</span>
            <Link
              href="/admin/usuarios"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-100 rounded hover:bg-slate-700 transition cursor-pointer"
            >
              <FiUsers size={18} /> Usuarios
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900/20">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  open,
  hideOnDesktop = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
  hideOnDesktop?: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-4 py-3 rounded transition text-slate-200 hover:bg-slate-800 ${
        isActive ? "bg-slate-800/80 text-slate-100" : ""
      } ${hideOnDesktop ? "md:hidden" : ""}`}
      title={!open ? label : ""}
    >
      {isActive && <span className="absolute left-0 h-6 w-1 rounded-r bg-sky-400" />}
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
