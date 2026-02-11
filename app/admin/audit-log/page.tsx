"use client";

import { useEffect, useState } from "react";

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
};

const actionTranslations: Record<string, string> = {
  USER_DELETE: "Eliminación de usuario",
  USER_CREATE: "Creación de usuario",
  USER_UPDATE: "Actualización de usuario",
  PASSWORD_CHANGE: "Cambio de contraseña",
  ROLE_CHANGE: "Cambio de rol",
  USER_LOGIN: "Inicio de sesión",
  USER_LOGOUT: "Cierre de sesión",
};

const actionColors: Record<string, string> = {
  USER_DELETE: "text-red-700 bg-red-50",
  USER_CREATE: "text-green-700 bg-green-50",
  USER_UPDATE: "text-blue-700 bg-blue-50",
  PASSWORD_CHANGE: "text-yellow-700 bg-yellow-50",
  ROLE_CHANGE: "text-purple-700 bg-purple-50",
  USER_LOGIN: "text-gray-700 bg-gray-50",
  USER_LOGOUT: "text-gray-700 bg-gray-50",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/audit-log" : `/api/audit-log?action=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
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
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registro de Auditoría</h1>
          <p className="text-gray-600 mt-1">
            Historial de acciones críticas del sistema para seguridad y trazabilidad
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filtrar por acción:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No hay registros de auditoría disponibles
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              actionColors[log.action] || "text-gray-700 bg-gray-50"
                            }`}
                          >
                            {actionTranslations[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.userName || "Sistema"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.details ? (
                            <div className="max-w-md">
                              {log.details.targetUser && (
                                <div>
                                  <span className="font-medium">Afectado:</span>{" "}
                                  {log.details.targetUser}
                                </div>
                              )}
                              {log.details.deletedUser && (
                                <div>
                                  <span className="font-medium">Eliminado:</span>{" "}
                                  {log.details.deletedUser.nombre} (
                                  {log.details.deletedUser.email})
                                </div>
                              )}
                              {log.details.changes && (
                                <div>
                                  <span className="font-medium">Cambios:</span>{" "}
                                  {log.details.changes.join(", ")}
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-400 mt-0.5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Sobre el registro de auditoría:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>Se registran todas las acciones críticas de seguridad</li>
                <li>Los registros no pueden ser modificados ni eliminados</li>
                <li>Incluye información de IP y dispositivo para trazabilidad</li>
                <li>Ayuda a detectar accesos no autorizados y actividad sospechosa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
