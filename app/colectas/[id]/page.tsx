"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { formatCompactNumber } from "@/lib/utils";

interface Aporte {
  id: string;
  estado: string;
  cantidad: number;
  createdAt: string;
  miembroNombre?: string;
  miembro?: {
    nombre: string;
  } | null;
}

interface Gasto {
  id: string;
  concepto: string;
  categoria: string;
  cantidad: number;
  quienPagoNombre?: string;
  quienPago?: {
    nombre: string;
  } | null;
}

interface Colecta {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  estado: string;
  createdAt: string;
  totalAportado: number;
  totalGastos: number;
  faltante: number;
  aportes: Aporte[];
  gastos: Gasto[];
}

export default function ColectaPublica() {
  const params = useParams();
  const id = params.id as string;
  const [colecta, setColecta] = useState<Colecta | null>(null);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"aportes" | "gastos">("aportes");

  const stats = useMemo(() => {
    if (!colecta) {
      return {
        totalAportado: 0,
        totalGastos: 0,
        faltante: 0,
        saldo: 0,
      };
    }

    const totalAportado = aportes.reduce((sum, a) => sum + a.cantidad, 0);
    const totalGastos = colecta.gastos.reduce((sum, g) => sum + g.cantidad, 0);
    const faltante = Math.max(0, colecta.objetivo - totalAportado);
    const saldo = totalAportado - totalGastos;

    return {
      totalAportado,
      totalGastos,
      faltante,
      saldo,
    };
  }, [colecta, aportes]);

  useEffect(() => {
    const cargarColecta = async () => {
      try {
        const activeClubId = sessionStorage.getItem("active_admin_clubId");
        const token =
          (activeClubId
            ? localStorage.getItem(`token_admin_${activeClubId}`)
            : localStorage.getItem("token_admin")) ||
          localStorage.getItem("token_superadmin");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [colectaRes, aportesRes] = await Promise.all([
          fetch(`/api/colectas/${id}`, { headers }),
          fetch(`/api/colectas/${id}/aportes`, { headers }),
        ]);

        if (colectaRes.ok) {
          const data = await colectaRes.json();
          setColecta(data);
        } else {
          setError("Colecta no encontrada");
        }

        if (aportesRes.ok) {
          const data = await aportesRes.json();
          setAportes(data);
        }
      } catch (err) {
        setError("Error cargando la colecta");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarColecta();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error || !colecta) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-900 hover:text-gray-600 mb-4 inline-block">
            ← Volver
          </Link>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 mb-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm"
          >
            ← Volver
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{colecta.nombre}</h1>
              {colecta.descripcion && (
                <p className="text-gray-600 mt-2">{colecta.descripcion}</p>
              )}
            </div>
            <span className="px-3 py-1 border border-gray-200 text-sm font-medium text-gray-900">
              {colecta.estado === "activa"
                ? "Activa"
                : colecta.estado === "cerrada"
                  ? "Cerrada"
                  : "Completada"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Table */}
        <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <StatCard
            label="Total Aportado"
            value={`₲ ${formatCompactNumber(stats.totalAportado)}`}
            icon="💰"
            type="aportado"
          />
          <StatCard
            label="Objetivo"
            value={`₲ ${formatCompactNumber(colecta.objetivo)}`}
            icon="🎯"
            type="objetivo"
          />
          <StatCard
            label="Faltan"
            value={`₲ ${formatCompactNumber(stats.faltante)}`}
            icon="📉"
            type="faltante"
          />
          <StatCard
            label="Gastos"
            value={`₲ ${formatCompactNumber(stats.totalGastos)}`}
            icon="🧾"
            type="gasto"
          />
        </div>

        {/* Progress Bar */}
        <div className="border border-gray-200 p-4 md:p-5 mb-6">
          <ProgressBar
            total={stats.totalAportado}
            objetivo={colecta.objetivo}
            label="Progreso de Colecta"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gray-200">
          {(["aportes", "gastos"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-0 py-2 font-medium text-sm transition-colors capitalize border-b-2 ${
                activeTab === tab
                  ? "text-gray-900 border-gray-900"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              {tab === "aportes" ? "Aportes" : "Gastos"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {activeTab === "aportes" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Aportes ({aportes.length})
              </h3>
              {aportes.length > 0 ? (
                <div className="space-y-0 border border-gray-200 mb-4 overflow-x-auto">
                  {aportes.map((aporte) => (
                    <div
                      key={aporte.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 border-b border-gray-200 last:border-b-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {aporte.miembroNombre || aporte.miembro?.nombre || "N/A"}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {aporte.estado === "aportado" ? "Aportado" : "Comprometido"} •{" "}
                          {new Date(aporte.createdAt).toLocaleDateString("es-PY")}
                        </p>
                      </div>
                      <p className="font-bold text-md md:text-lg text-gray-900 flex-shrink-0">
                        ₲
                        {aporte.cantidad
                          .toLocaleString("es-PY", {
                            minimumFractionDigits: 0,
                          })
                          .replace("$", "")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Aún no hay aportes registrados</p>
              )}
            </div>
          )}

          {activeTab === "gastos" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Gastos ({colecta.gastos.length})
              </h3>
              {colecta.gastos.length > 0 ? (
                <div className="space-y-0 border border-gray-200 mb-4 overflow-x-auto">
                  {colecta.gastos.map((gasto) => (
                    <div
                      key={gasto.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 border-b border-gray-200 last:border-b-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {gasto.concepto}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {gasto.categoria} •{" "}
                          {gasto.quienPagoNombre || gasto.quienPago?.nombre || "N/A"}
                        </p>
                      </div>
                      <p className="font-bold text-md md:text-lg text-gray-900 flex-shrink-0">
                        -₲
                        {gasto.cantidad
                          .toLocaleString("es-PY", {
                            minimumFractionDigits: 0,
                          })
                          .replace("$", "")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-4">Aún no hay gastos registrados</p>
              )}
              <div className="border border-gray-200 p-4 bg-green-50">
                <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                  Disponible
                </p>
                <p className={`text-2xl font-semibold text-green-600`}>
                  ₲
                  {stats.saldo
                    .toLocaleString("es-PY", { minimumFractionDigits: 0 })
                    .replace("$", "")}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
