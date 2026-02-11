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

export default function ColectaPublicaPorClub() {
  const params = useParams();
  const slug = params.slug as string;
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
        const res = await fetch(`/api/public/clubes/${slug}/colectas/${id}`);
        if (!res.ok) {
          setError("Colecta no encontrada");
          return;
        }

        const data = await res.json();
        setColecta(data.colecta || null);
        setAportes(data.colecta?.aportes || []);
      } catch (err) {
        setError("Error cargando la colecta");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug && id) {
      cargarColecta();
    }
  }, [slug, id]);

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
            href={`/${slug}`}
            className="text-gray-900 hover:text-gray-600 mb-4 inline-block"
          >
            ← Volver
          </Link>
          <div className="border border-gray-200 p-4">
            <p className="text-gray-600">{error || "Colecta no encontrada"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Link
          href={`/${slug}`}
          className="text-gray-900 hover:text-gray-600 mb-4 inline-block"
        >
          ← Volver a colectas
        </Link>

        <div className="border-b border-gray-200 pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{colecta.nombre}</h1>
          <p className="text-gray-600 text-base">{colecta.descripcion}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Aportado"
            value={`₲ ${formatCompactNumber(stats.totalAportado)}`}
          />
          <StatCard
            title="Gastos"
            value={`₲ ${formatCompactNumber(stats.totalGastos)}`}
          />
          <StatCard title="Faltante" value={`₲ ${formatCompactNumber(stats.faltante)}`} />
        </div>

        <div className="mb-6">
          <ProgressBar total={stats.totalAportado} objetivo={colecta.objetivo || 0} />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("aportes")}
            className={`px-4 py-2 text-sm border rounded-lg ${
              activeTab === "aportes"
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Aportes
          </button>
          <button
            onClick={() => setActiveTab("gastos")}
            className={`px-4 py-2 text-sm border rounded-lg ${
              activeTab === "gastos"
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Gastos
          </button>
        </div>

        {activeTab === "aportes" ? (
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Miembro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {aportes.map((aporte) => (
                  <tr key={aporte.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-900 font-medium">
                      {aporte.miembroNombre || aporte.miembro?.nombre || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">
                      ₲{aporte.cantidad.toLocaleString("es-PY").replace("$", "")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{aporte.estado}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(aporte.createdAt).toLocaleDateString("es-PY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                    Pagado por
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {colecta.gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-900 font-medium">
                      {gasto.concepto}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">
                      ₲{gasto.cantidad.toLocaleString("es-PY").replace("$", "")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{gasto.categoria}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {gasto.quienPagoNombre || gasto.quienPago?.nombre || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
