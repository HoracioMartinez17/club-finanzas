"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function ClubPublicHome() {
  const params = useParams();
  const slug = params.slug as string;
  const [colectas, setColectas] = useState<Colecta[]>([]);
  const [clubName, setClubName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "activas" | "cerradas" | "completadas">(
    "todas",
  );

  useEffect(() => {
    const cargarColectas = async () => {
      try {
        const paramsStr = filtro === "todas" ? "" : `?estado=${filtro}`;
        setError("");

        const res = await fetch(`/api/public/clubes/${slug}/colectas${paramsStr}`);
        if (!res.ok) {
          throw new Error("No se pudieron cargar las colectas");
        }

        const data = await res.json();
        setClubName(data.club?.nombre || "Club");
        setColectas(data.colectas || []);
      } catch (error) {
        console.error("Error cargando colectas:", error);
        setError("No se pudieron cargar las colectas");
        setColectas([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      cargarColectas();
    }
  }, [slug, filtro]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-3xl font-bold text-gray-900 mb-1">
            {clubName || "Club de Fútbol"}
          </h1>
          <p className="text-lg md:text-base text-gray-700">
            Gestor de Colectas y Finanzas
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["todas", "activas", "cerradas", "completadas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 md:px-4 py-2 md:py-1.5 text-sm md:text-xs font-bold transition-colors capitalize border-2 rounded-lg ${
                filtro === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando colectas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-gray-200">
            <p className="text-gray-600">{error}</p>
          </div>
        ) : colectas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colectas.map((colecta) => (
              <Link key={colecta.id} href={`/${slug}/colectas/${colecta.id}`}>
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
