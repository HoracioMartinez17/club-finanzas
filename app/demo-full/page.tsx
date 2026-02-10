"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ColectaCard } from "@/components/ColectaCard";

interface Colecta {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  estado: string;
  totalAportado: number;
  porcentaje: number;
}

export default function DemoFullPage() {
  const [colectas, setColectas] = useState<Colecta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "activas" | "cerradas" | "completadas">(
    "todas",
  );

  useEffect(() => {
    const cargarColectas = async () => {
      try {
        const params = filtro === "todas" ? "" : `?estado=${filtro}`;
        const res = await fetch(`/api/colectas/mock${params}`);
        if (res.ok) {
          const data = await res.json();
          setColectas(data);
        }
      } catch (error) {
        console.error("Error cargando colectas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarColectas();
  }, [filtro]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Club de Fútbol</h1>
          <p className="text-sm text-gray-600">
            Gestor de Colectas y Finanzas - DEMO COMPLETA
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["todas", "activas", "cerradas", "completadas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 md:px-4 py-1.5 md:py-1 text-xs md:text-xs font-medium transition-colors capitalize ${
                filtro === f
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
            >
              {f === "todas"
                ? "Todas"
                : f === "activas"
                  ? "Activas"
                  : f === "cerradas"
                    ? "Cerradas"
                    : "Completadas"}
            </button>
          ))}
        </div>

        {/* Colectas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando colectas...</p>
          </div>
        ) : colectas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colectas.map((colecta) => (
              <Link key={colecta.id} href={`/detalle-demo/${colecta.id}`}>
                <ColectaCard
                  id={colecta.id}
                  nombre={colecta.nombre}
                  descripcion={colecta.descripcion}
                  objetivo={colecta.objetivo}
                  totalAportado={colecta.totalAportado}
                  porcentaje={colecta.porcentaje}
                  estado={colecta.estado}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-gray-200">
            <p className="text-gray-600">No hay colectas en este momento</p>
          </div>
        )}
      </main>
    </div>
  );
}
