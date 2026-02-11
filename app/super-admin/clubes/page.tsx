"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiUsers,
  FiActivity,
  FiPackage,
  FiKey,
} from "react-icons/fi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast, { Toaster } from "react-hot-toast";

type Club = {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  planId: string;
  logoUrl: string | null;
  createdAt: string;
  _count: {
    usuarios: number;
    miembros: number;
  };
};

export default function ClubesPage() {
  const router = useRouter();
  const [clubes, setClubes] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchClubes();
  }, []);

  const fetchClubes = async () => {
    try {
      const token = localStorage.getItem("token_superadmin");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/super-admin/clubes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Error al cargar clubes");
      }

      const data = await response.json();
      setClubes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast.error("Error al cargar clubes");
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string, activo: boolean, nombre: string) => {
    setConfirmDialog({
      show: true,
      title: activo ? "Desactivar club" : "Activar club",
      message: `¿Estás seguro de ${activo ? "desactivar" : "activar"} el club "${nombre}"?`,
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, loading: true }));
          const token = localStorage.getItem("token_superadmin");
          const response = await fetch(`/api/super-admin/clubes/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ activo: !activo }),
          });

          if (!response.ok) {
            throw new Error("Error al actualizar club");
          }

          await fetchClubes();
          toast.success(`Club ${activo ? "desactivado" : "activado"} correctamente`);
          setConfirmDialog({ ...confirmDialog, show: false });
        } catch (err) {
          toast.error("Error al actualizar estado del club");
          setConfirmDialog((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const eliminarClub = async (id: string, nombre: string) => {
    setConfirmDialog({
      show: true,
      title: "Eliminar club",
      message: `¿Estás seguro de eliminar el club "${nombre}"? Esta acción eliminará TODOS los datos asociados y no se puede deshacer.`,
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, loading: true }));
          const token = localStorage.getItem("token_superadmin");
          const response = await fetch(`/api/super-admin/clubes/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Error al eliminar club");
          }

          await fetchClubes();
          toast.success("Club eliminado correctamente");
          setConfirmDialog({ ...confirmDialog, show: false });
        } catch (err) {
          toast.error("Error al eliminar club");
          setConfirmDialog((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const getPlanBadge = (planId: string) => {
    const plans: Record<string, { name: string; color: string; gradient: string }> = {
      free: {
        name: "Gratis",
        color: "text-slate-300",
        gradient: "bg-gradient-to-r from-gray-500/20 to-gray-600/20",
      },
      pro: {
        name: "Pro",
        color: "text-blue-300",
        gradient: "bg-gradient-to-r from-blue-500/20 to-blue-600/20",
      },
      enterprise: {
        name: "Enterprise",
        color: "text-purple-300",
        gradient: "bg-gradient-to-r from-purple-500/20 to-purple-600/20",
      },
    };

    const plan = plans[planId] || plans.free;
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-lg ${plan.gradient} ${plan.color} border border-white/10`}
      >
        {plan.name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Cargando clubes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="Confirmar"
          cancelText="Cancelar"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() =>
            setConfirmDialog({ ...confirmDialog, show: false, loading: false })
          }
          isLoading={confirmDialog.loading}
          isDangerous={confirmDialog.title.includes("Eliminar")}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-1 sm:mb-2">
              Clubes
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Administración de clubes del sistema
            </p>
          </div>
          <Link
            href="/super-admin/clubes/nuevo"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all font-medium shadow-lg shadow-cyan-500/20 text-sm sm:text-base"
          >
            <FiPlus className="text-base sm:text-lg" />
            <span>Nuevo Club</span>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Clubes Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Clubes */}
          <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Total Clubes
                </div>
                <div className="text-3xl font-bold text-slate-100">{clubes.length}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                <FiPackage className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
          </div>

          {/* Clubes Activos */}
          <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Clubes Activos
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  {clubes.filter((c) => c.activo).length}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg">
                <FiActivity className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" />
          </div>

          {/* Clubes Inactivos */}
          <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Clubes Inactivos
                </div>
                <div className="text-3xl font-bold text-slate-500">
                  {clubes.filter((c) => !c.activo).length}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-slate-600/20 to-slate-500/20 rounded-lg">
                <FiUsers className="w-6 h-6 text-slate-500" />
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full" />
          </div>
        </div>

        {/* Tabla de Clubes */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Usuarios
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Miembros
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {clubes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <FiPackage className="w-12 h-12 text-slate-600" />
                        <p>No hay clubes registrados. Crea el primero.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clubes.map((club) => (
                    <tr key={club.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {club.logoUrl ? (
                            <img
                              src={club.logoUrl}
                              alt={club.nombre}
                              className="h-10 w-10 rounded-full object-cover border-2 border-slate-700"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border-2 border-slate-700">
                              <span className="text-white font-bold text-lg">
                                {club.nombre.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-slate-200">
                              {club.nombre}
                            </div>
                            <div className="text-xs text-slate-500">
                              Creado{" "}
                              {new Date(club.createdAt).toLocaleDateString("es-PY")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-cyan-400 bg-slate-900/50 px-3 py-1 rounded-md font-mono">
                          /{club.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4  whitespace-nowrap text-center">
                        {getPlanBadge(club.planId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-300 font-medium">
                        {club._count.usuarios}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-300 font-medium">
                        {club._count.miembros}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleActivo(club.id, club.activo, club.nombre)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            club.activo
                              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/30"
                          }`}
                        >
                          {club.activo ? (
                            <FiToggleRight className="text-base" />
                          ) : (
                            <FiToggleLeft className="text-base" />
                          )}
                          <span>{club.activo ? "Activo" : "Inactivo"}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/super-admin/clubes/${club.id}`}
                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
                            title="Gestionar usuarios"
                          >
                            <FiKey className="text-base" />
                          </Link>
                          <button
                            onClick={() => eliminarClub(club.id, club.nombre)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Eliminar club"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
