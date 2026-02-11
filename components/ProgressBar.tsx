import { formatCompactNumber } from "@/lib/utils";

interface ProgressBarProps {
  total: number;
  objetivo: number;
  label?: string;
}

export function ProgressBar({ total, objetivo, label }: ProgressBarProps) {
  const safeObjetivo = objetivo > 0 ? objetivo : 0;
  const porcentaje = safeObjetivo > 0 ? Math.min((total / safeObjetivo) * 100, 100) : 0;

  const getBarColor = () => {
    if (porcentaje < 30) return "bg-red-600";
    if (porcentaje < 70) return "bg-yellow-500";
    return "bg-green-600";
  };

  return (
    <div className="w-full">
      {label && (
        <p className="text-base md:text-sm font-bold text-gray-900 mb-2">{label}</p>
      )}
      <div className="flex gap-3 md:gap-2 items-center">
        <div className="flex-1 bg-gray-200 h-3 md:h-2.5 rounded-full overflow-hidden shadow-sm">
          <div
            className={`h-full ${getBarColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <span className="text-xl md:text-base font-bold text-gray-900 min-w-max">
          {Math.round(porcentaje)}%
        </span>
      </div>
    </div>
  );
}
