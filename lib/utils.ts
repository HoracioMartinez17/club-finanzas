// Utilidades generales de la aplicación

export function formatCurrency(value: number, currency: string = "$"): string {
  return `${currency} ${value.toLocaleString("es-PY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-PY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

export function getMonthName(month: number): string {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return months[month - 1] || "Desconocido";
}

export function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    activa: "bg-green-100 text-green-800",
    cerrada: "bg-yellow-100 text-yellow-800",
    completada: "bg-blue-100 text-blue-800",
    activo: "bg-green-100 text-green-800",
    inactivo: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "0";
  }
  if (value >= 1000000) {
    const millions = value / 1000000;
    return (
      millions.toLocaleString("es-PY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }) + "M"
    );
  }
  return value.toLocaleString("es-PY", { minimumFractionDigits: 0 });
}

export function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    activa: "Activa",
    cerrada: "Cerrada",
    completada: "Completada",
    aportado: "Aportado",
    comprometido: "Comprometido",
    activo: "Activo",
    inactivo: "Inactivo",
  };
  return labels[status] || status;
}
