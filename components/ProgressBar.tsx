import { formatCompactNumber } from "@/lib/utils";

interface ProgressBarProps {
  total: number;
  objetivo: number;
  label?: string;
}

export function ProgressBar({ total, objetivo, label }: ProgressBarProps) {
  const porcentaje = Math.min((total / objetivo) * 100, 100);

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
      <div className="flex justify-between items-end gap-2 mt-3 text-xs md:text-xs">
        <span className="text-gray-600">₲ {formatCompactNumber(total)}</span>
        <span className="text-gray-600">₲ {formatCompactNumber(objetivo)}</span>
      </div>
    </div>
  );
}
