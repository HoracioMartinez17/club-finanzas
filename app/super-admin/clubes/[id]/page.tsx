"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUsers,
  FiShield,
  FiAlertCircle,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

type ClubData = {
  club: {
    id: string;
    nombre: string;
  };
  usuarios: Usuario[];
  total: number;
  admins: number;
};

export default function ClubUsuariosPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params?.id as string;

  const [data, setData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState<{
    show: boolean;
    usuario: Usuario | null;
    password: string;
    loading: boolean;
    showPassword: boolean;
  }>({
    show: false,
    usuario: null,
    password: "",
    loading: false,
    showPassword: false,
  });
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (clubId) {
      fetchUsuarios();
    }
  }, [clubId]);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token_superadmin");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/super-admin/clubes/${clubId}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const clubData = await response.json();
      setData(clubData);
    } catch (err) {
      toast.error("Error al cargar usuarios del club");
    } finally {
      setLoading(false);
    }
  };

  const generarPasswordSegura = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const abrirModalReset = (usuario: Usuario) => {
    const newPassword = generarPasswordSegura();
    setResetModal({
      show: true,
      usuario,
      password: newPassword,
      loading: false,
      showPassword: true,
    });
  };

  const resetearPassword = async () => {
    if (!resetModal.usuario) return;

    setResetModal((prev) => ({ ...prev, loading: true }));

    try {
      const token = localStorage.getItem("token_superadmin");
      const response = await fetch(
        `/api/super-admin/usuarios/${resetModal.usuario.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: resetModal.password }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al resetear contraseña");
      }

      toast.success("Contraseña reseteada correctamente");
      // Mantener modal abierto para que copien las credenciales
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al resetear contraseña");
      setResetModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setResetModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const copiarTexto = async (texto: string, tipo: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(texto);
      if (tipo === "email") {
        setCopiedEmail(texto);
        setTimeout(() => setCopiedEmail(null), 2000);
      }
      toast.success(`${tipo === "email" ? "Email" : "Contraseña"} copiado`);
    } catch (err) {
      toast.error("Error al copiar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No se pudieron cargar los usuarios</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/super-admin/clubes"
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium mb-4 inline-flex transition-colors"
          >
            <FiArrowLeft />
            <span>Volver a clubes</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                Usuarios de {data.club.nombre}
              </h1>
              <p className="text-slate-400">
                Gestiona las credenciales de acceso del club
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Total Usuarios
                </div>
                <div className="text-3xl font-bold text-slate-100">{data.total}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                <FiUsers className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Administradores
                </div>
                <div className="text-3xl font-bold text-amber-400">{data.admins}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
                <FiShield className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Recuperación de acceso</p>
              <p className="text-blue-400/80">
                Puedes resetear la contraseña de cualquier usuario del club. La nueva
                contraseña se genera automáticamente de forma segura. Copia las
                credenciales y envíaselas al usuario por un canal seguro.
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No hay usuarios en este club
                    </td>
                  </tr>
                ) : (
                  data.usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {usuario.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-200">
                              {usuario.nombre}
                            </div>
                            <div className="text-xs text-slate-500">
                              Creado{" "}
                              {new Date(usuario.createdAt).toLocaleDateString("es-PY")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-slate-300 font-mono">
                            {usuario.email}
                          </code>
                          <button
                            onClick={() => copiarTexto(usuario.email, "email")}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Copiar email"
                          >
                            {copiedEmail === usuario.email ? (
                              <FiCheck className="w-4 h-4" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                            usuario.rol === "admin"
                              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-gradient-to-r from-slate-600/20 to-slate-500/20 text-slate-300 border border-slate-500/30"
                          }`}
                        >
                          {usuario.rol === "admin" ? "Admin" : "Usuario"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                            usuario.activo
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                          }`}
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => abrirModalReset(usuario)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 rounded-lg transition-all border border-cyan-500/30 hover:border-cyan-500/50"
                        >
                          <FiRefreshCw className="w-4 h-4" />
                          <span>Resetear</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Reset Password */}
      {resetModal.show && resetModal.usuario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FiRefreshCw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Resetear Contraseña</h2>
                <p className="text-sm text-slate-400">{resetModal.usuario.nombre}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm">
                    {resetModal.usuario.email}
                  </code>
                  <button
                    onClick={() => copiarTexto(resetModal.usuario!.email, "email")}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Nueva Contraseña
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={resetModal.showPassword ? "text" : "password"}
                      value={resetModal.password}
                      onChange={(e) =>
                        setResetModal((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 pr-10 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setResetModal((prev) => ({
                          ...prev,
                          showPassword: !prev.showPassword,
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-300"
                    >
                      {resetModal.showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => copiarTexto(resetModal.password, "password")}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Mínimo 6 caracteres. Puedes modificarla si lo deseas.
                </p>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-300">
                  ⚠️ Copia estas credenciales antes de confirmar. El usuario necesitará
                  esta contraseña para acceder.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setResetModal({
                    show: false,
                    usuario: null,
                    password: "",
                    loading: false,
                    showPassword: false,
                  })
                }
                disabled={resetModal.loading}
                className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700/30 transition-all font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={resetearPassword}
                disabled={resetModal.loading || resetModal.password.length < 6}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all font-medium shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetModal.loading ? "Reseteando..." : "Confirmar Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
