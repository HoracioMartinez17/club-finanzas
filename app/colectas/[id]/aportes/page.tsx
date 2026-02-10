"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Aporte {
  id: string;
  cantidad: number;
  estado: string;
  metodoPago: string;
  notas: string;
  createdAt: string;
  miembroNombre?: string;
  miembro?: {
    id: string;
    nombre: string;
  } | null;
}

interface Colecta {
  nombre: string;
}

export default function AportesPage() {
  const params = useParams();
  const id = params.id as string;
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [colecta, setColecta] = useState<Colecta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Intentar API real primero
        try {
          const resColecta = await fetch(`/api/colectas/${id}`);
          if (resColecta.ok) {
            const data = await resColecta.json();
            setColecta(data);
            setAportes(data.aportes || []);
            return;
          }
        } catch (error) {
          console.log("API real no disponible, usando mock...");
        }

        // Fallback a mock
        const resMock = await fetch(`/api/colectas/mock/${id}`);
        if (resMock.ok) {
          const data = await resMock.json();
          setColecta(data);
          setAportes(data.aportes || []);
        } else {
          setError("No se pudo cargar la información");
        }
      } catch (err) {
        setError("Error cargando datos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarDatos();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href={`/colectas/${id}`}
          className="text-gray-900 hover:text-gray-600 mb-3 inline-block text-sm"
        >
          ← Volver al detalle
        </Link>

        <div className="border-b border-gray-200 pb-4 md:pb-5 mb-4">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Aportes</h1>
          {colecta && (
            <p className="text-sm text-gray-600">
              Colecta: <span className="font-semibold">{colecta.nombre}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="border border-gray-200 bg-white p-3 mb-4 text-gray-900 text-sm">
            {error}
          </div>
        )}

        {aportes.length > 0 ? (
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Miembro
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Monto
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Estado
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Método de Pago
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {aportes.map((aporte) => (
                  <tr key={aporte.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-900 font-medium">
                      {aporte.miembroNombre || aporte.miembro?.nombre || "N/A"}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs font-bold text-gray-900">
                      ₲
                      {aporte.cantidad
                        .toLocaleString("es-PY", {
                          minimumFractionDigits: 0,
                        })
                        .replace("$", "")}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold border rounded ${
                          aporte.estado === "aportado"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : "border-yellow-200 text-yellow-700 bg-yellow-50"
                        }`}
                      >
                        {aporte.estado === "aportado" ? "Aportado" : "Comprometido"}
                      </span>
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-600">
                      {aporte.metodoPago || "—"}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-600">
                      {new Date(aporte.createdAt).toLocaleDateString("es-PY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-gray-200 p-4 md:p-5 text-center">
            <p className="text-sm text-gray-600">No hay aportes registrados aún</p>
          </div>
        )}
      </div>
    </div>
  );
}
