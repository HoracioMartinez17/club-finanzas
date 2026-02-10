import Link from "next/link";
import { formatCompactNumber } from "@/lib/utils";

interface ColectaCardProps {
  id: string;
  nombre: string;
  descripcion?: string;
  objetivo: number;
  totalAportado: number;
  porcentaje: number;
  estado: string;
}

export function ColectaCard({
  id,
  nombre,
  descripcion,
  objetivo,
  totalAportado,
  porcentaje,
  estado,
}: ColectaCardProps) {
  const esCompleta = estado === "completada";
  const esCerrada = estado === "cerrada";

  return (
    <div className="bg-white border-2 border-gray-200 hover:border-gray-400 transition-all p-3 md:p-4 cursor-pointer h-full flex flex-col rounded-lg shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg md:text-base font-bold text-gray-900 mb-1">{nombre}</h3>
          {descripcion && (
            <p className="text-sm md:text-xs text-gray-600 line-clamp-2">{descripcion}</p>
          )}
        </div>
        <span className="text-sm md:text-xs text-gray-600 ml-2 whitespace-nowrap font-medium bg-gray-100 px-2 py-1 rounded\">
          {estado === "activa"
            ? "Activa"
            : estado === "cerrada"
              ? "Cerrada"
              : "Completada"}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs md:text-xs text-gray-600 uppercase tracking-wide font-semibold">
            Progreso
          </span>
          <span className="text-base md:text-base font-bold text-gray-900">
            {porcentaje}%
          </span>
        </div>
        <div className="w-full bg-gray-100 h-2 md:h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              porcentaje < 30
                ? "bg-red-600"
                : porcentaje < 70
                  ? "bg-yellow-500"
                  : "bg-green-600"
            }`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          />
        </div>
      </div>

      {/* Montos */}
      <div className="space-y-2 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-xs md:text-xs text-gray-600 uppercase tracking-wide font-semibold">
            Aportado
          </span>
          <span className="text-base md:text-sm font-bold text-green-600">
            ₲ {formatCompactNumber(totalAportado)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm md:text-xs text-gray-600 uppercase tracking-wide font-semibold">
            Objetivo
          </span>
          <span className="text-base md:text-sm font-bold text-blue-600">
            ₲ {formatCompactNumber(objetivo)}
          </span>
        </div>
      </div>

      <button className="mt-2 w-full px-3 py-2 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all rounded-lg active:scale-95">
        Ver detalles
      </button>
    </div>
  );
}
