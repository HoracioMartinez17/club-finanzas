"use client";

import { useEffect, useState } from "react";
import { FiActivity, FiClock, FiAlertTriangle } from "react-icons/fi";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  club: {
    nombre: string;
    slug: string;
  } | null;
};

type Stats = {
  total: number;
  last24Hours: number;
  byAction: Record<string, number>;
};

const actionTranslations: Record<string, string> = {
  USER_DELETE: "Eliminación de usuario",
  USER_CREATE: "Creación de usuario",
  USER_UPDATE: "Actualización de usuario",
  PASSWORD_CHANGE: "Cambio de contraseña",
  ROLE_CHANGE: "Cambio de rol",
};

const actionColors: Record<string, { bg: string; text: string }> = {
  USER_DELETE: { bg: "from-rose-500/20 to-red-500/20", text: "text-rose-300" },
  USER_CREATE: { bg: "from-emerald-500/20 to-green-500/20", text: "text-emerald-300" },
  USER_UPDATE: { bg: "from-blue-500/20 to-cyan-500/20", text: "text-blue-300" },
  PASSWORD_CHANGE: { bg: "from-amber-500/20 to-yellow-500/20", text: "text-amber-300" },
  ROLE_CHANGE: { bg: "from-purple-500/20 to-violet-500/20", text: "text-purple-300" },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token_superadmin");
      if (!token) {
        console.error("No hay token de autenticación");
        return;
      }

      // Fetch logs
      const url =
        filter === "all"
          ? "/api/super-admin/audit-log"
          : `/api/super-admin/audit-log?action=${filter}`;
      const logsResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch stats
      const statsResponse = await fetch("/api/super-admin/audit-log", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (logsResponse.ok && statsResponse.ok) {
        const logsData = await logsResponse.json();
        const statsData = await statsResponse.json();
        setLogs(logsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error al cargar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getActionBadge = (action: string) => {
    const colors = actionColors[action] || {
      bg: "from-slate-500/20 to-gray-500/20",
      text: "text-slate-300",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${colors.bg} ${colors.text} border border-slate-700/50`}
      >
        {actionTranslations[action] || action}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Registro de Auditoría
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Historial de acciones críticas del sistema
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total de Eventos</p>
                  <p className="text-3xl font-bold text-slate-100 mt-1">
                    {stats.total.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <FiActivity className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Últimas 24h</p>
                  <p className="text-3xl font-bold text-slate-100 mt-1">
                    {stats.last24Hours.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg">
                  <FiClock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:shadow-lg hover:shadow-rose-500/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Acciones Críticas</p>
                  <p className="text-3xl font-bold text-slate-100 mt-1">
                    {(
                      (stats.byAction.USER_DELETE || 0) +
                      (stats.byAction.ROLE_CHANGE || 0)
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-rose-500/20 to-red-500/20 rounded-lg">
                  <FiAlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-6">
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Filtrar por acción:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          >
            <option value="all">Todas las acciones</option>
            <option value="USER_DELETE">Eliminación de usuarios</option>
            <option value="USER_CREATE">Creación de usuarios</option>
            <option value="USER_UPDATE">Actualización de usuarios</option>
            <option value="PASSWORD_CHANGE">Cambios de contraseña</option>
            <option value="ROLE_CHANGE">Cambios de rol</option>
          </select>
        </div>

        {/* Tabla de Logs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Club
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No hay registros de auditoría disponibles
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {log.club ? (
                            <div>
                              <div className="font-medium">{log.club.nombre}</div>
                              <div className="text-xs text-slate-500">
                                /{log.club.slug}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {log.userName || "Sistema"}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-400">
                          {log.details ? (
                            <div className="max-w-md">
                              {log.details.targetUser && (
                                <div>
                                  <span className="font-medium text-slate-300">
                                    Afectado:
                                  </span>{" "}
                                  {log.details.targetUser}
                                </div>
                              )}
                              {log.details.deletedUser && (
                                <div>
                                  <span className="font-medium text-slate-300">
                                    Eliminado:
                                  </span>{" "}
                                  {log.details.deletedUser.nombre} (
                                  {log.details.deletedUser.email})
                                </div>
                              )}
                              {log.details.changes && (
                                <div>
                                  <span className="font-medium text-slate-300">
                                    Cambios:
                                  </span>{" "}
                                  {log.details.changes.join(", ")}
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                          {log.ipAddress || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <FiActivity className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-300">
              <p className="font-semibold mb-1">Sobre el Registro de Auditoría</p>
              <p className="text-slate-400">
                Este registro contiene todas las acciones críticas realizadas en todos los
                clubes de la plataforma. Los eventos incluyen creación, actualización y
                eliminación de usuarios, cambios de contraseña y cambios de rol. Toda la
                información se registra con fecha, hora, IP y detalles completos para
                trazabilidad y seguridad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
