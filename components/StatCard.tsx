import React from "react";

interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  total?: number;
  icon?: string | React.ReactNode;
  type?: "aportado" | "objetivo" | "faltante" | "gasto";
  color?: string;
  iconColor?: string;
}

export function StatCard({
  label,
  title,
  value,
  total,
  icon,
  type = "objetivo",
  color = "bg-gray-50",
  iconColor = "text-gray-600",
}: StatCardProps) {
  const getTextColor = () => {
    switch (type) {
      case "aportado":
        return "text-green-600";
      case "faltante":
        return "text-red-600";
      case "gasto":
        return "text-red-600";
      case "objetivo":
        return "text-blue-600";
      default:
        return "text-gray-900";
    }
  };

  const displayLabel = title || label;
  const isNewStyle = title || color !== "bg-gray-50" || iconColor !== "text-gray-600";

  if (isNewStyle) {
    // Nuevo estilo para dashboard
    return (
      <div className={`${color} rounded-lg shadow p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{displayLabel}</p>
            <p className={`text-2xl font-bold ${iconColor}`}>{value}</p>
            {total && <p className="text-xs text-gray-700 mt-1">de {total} total</p>}
          </div>
          {icon && (
            <div className={`text-4xl ${iconColor}`}>
              {typeof icon === "string" ? <span>{icon}</span> : icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Estilo antiguo para compatibilidad
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-3 px-2">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-xl">{typeof icon === "string" ? icon : icon}</span>
        )}
        <p className="text-sm text-gray-600 font-medium">{displayLabel}</p>
      </div>
      <p className={`text-lg font-bold ${getTextColor()}`}>{value}</p>
    </div>
  );
}
