"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { formatCompactNumber } from "@/lib/utils";

interface Colecta {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  estado: string;
  totalAportado: number;
  totalGastos: number;
  saldo: number;
  porcentaje: number;
  faltante: number;
  aportes: any[];
  gastos: any[];
}

export default function ColectaDetailDemo() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const id = isMounted ? pathname.split("/").pop() : undefined;
  const [colecta, setColecta] = useState<Colecta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"aportes" | "gastos">("aportes");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const cargarColecta = async () => {
      try {
        if (!id) {
          console.log("ID no disponible aún");
          return;
        }

        console.log("Cargando colecta con ID:", id);
        const res = await fetch(`/api/colectas/mock/${id}`);

        if (res.ok) {
          const data = await res.json();
          console.log("Colecta cargada:", data);
          setColecta(data);
        } else {
          console.log("Respuesta no OK:", res.status);
          setError("Colecta no encontrada");
        }
      } catch (err) {
        console.error("Error cargando la colecta:", err);
        setError("Error cargando la colecta");
      } finally {
        setLoading(false);
      }
    };

    cargarColecta();
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
          <Link
            href="/demo-full"
            className="text-gray-900 hover:text-gray-600 mb-4 inline-block"
          >
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
            href="/demo-full"
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
            value={`₲ ${formatCompactNumber(colecta.totalAportado)}`}
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
            label="Falta"
            value={`₲ ${formatCompactNumber(colecta.faltante)}`}
            icon="📉"
            type="faltante"
          />
          <StatCard
            label="Gastos"
            value={`₲ ${formatCompactNumber(colecta.totalGastos)}`}
            icon="🧾"
            type="gasto"
          />
        </div>

        {/* Progress Bar */}
        <div className="border border-gray-200 p-4 md:p-5 mb-6">
          <ProgressBar
            total={colecta.totalAportado}
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
              {tab === "aportes"
                ? `Aportes (${colecta.aportes.length})`
                : `Gastos (${colecta.gastos.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {activeTab === "aportes" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Aportes ({colecta.aportes.length})
              </h3>
              {colecta.aportes.length > 0 ? (
                <div className="space-y-0 border border-gray-200 mb-4 overflow-x-auto">
                  {colecta.aportes.map((aporte) => (
                    <div
                      key={aporte.id}
                      className="flex flex-col md:flex-row md:items-start md:justify-between p-3 md:p-4 border-b border-gray-200 last:border-b-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {aporte.miembroNombre || aporte.miembro?.nombre || "N/A"}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                          {aporte.estado === "aportado" ? "Aportado" : "Comprometido"}
                          {aporte.metodoPago ? ` • ${aporte.metodoPago}` : ""} •{" "}
                          {new Date(aporte.createdAt).toLocaleDateString("es-PY")}
                        </p>
                        {aporte.notas && (
                          <p className="text-xs text-gray-700 italic mt-1">
                            📝 {aporte.notas}
                          </p>
                        )}
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
                      className="flex flex-col md:flex-row md:items-start md:justify-between p-3 md:p-4 border-b border-gray-200 last:border-b-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {gasto.concepto}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold border border-gray-200 text-gray-700 mr-2">
                            {gasto.categoria}
                          </span>
                          {gasto.quienPagoNombre || gasto.quienPago?.nombre || "N/A"}
                        </p>
                        {gasto.notas && (
                          <p className="text-xs text-gray-700 italic mt-1">
                            📝 {gasto.notas}
                          </p>
                        )}
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
                  {(colecta.totalAportado - colecta.totalGastos)
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
