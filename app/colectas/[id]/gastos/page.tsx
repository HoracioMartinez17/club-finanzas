"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Gasto {
  id: string;
  concepto: string;
  cantidad: number;
  categoria: string;
  notas: string;
  createdAt: string;
  quienPagoNombre?: string;
  quienPago?: {
    id: string;
    nombre: string;
  } | null;
}

interface Colecta {
  nombre: string;
}

export default function GastosPage() {
  const params = useParams();
  const id = params.id as string;
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [colecta, setColecta] = useState<Colecta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const activeClubId = sessionStorage.getItem("active_admin_clubId");
        const token =
          (activeClubId
            ? localStorage.getItem(`token_admin_${activeClubId}`)
            : localStorage.getItem("token_admin")) ||
          localStorage.getItem("token_superadmin");
        const resColecta = await fetch(`/api/colectas/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (resColecta.ok) {
          const data = await resColecta.json();
          setColecta(data);
          setGastos(data.gastos || []);
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Gastos</h1>
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

        {gastos.length > 0 ? (
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Concepto
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Monto
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Categoría
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Pagado por
                  </th>
                  <th className="px-4 md:px-5 py-3 md:py-2 text-left text-xs font-semibold text-gray-900">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-900 font-medium">
                      {gasto.concepto}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs font-bold text-gray-900">
                      -₲
                      {gasto.cantidad
                        .toLocaleString("es-PY", {
                          minimumFractionDigits: 0,
                        })
                        .replace("$", "")}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-600">
                      <span className="inline-block px-2 py-0.5 border border-gray-200 text-xs rounded">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-600">
                      {gasto.quienPagoNombre || gasto.quienPago?.nombre || "N/A"}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-2 text-xs text-gray-600">
                      {new Date(gasto.createdAt).toLocaleDateString("es-PY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-gray-200 p-4 md:p-5 text-center">
            <p className="text-sm text-gray-600">No hay gastos registrados aún</p>
          </div>
        )}
      </div>
    </div>
  );
}
