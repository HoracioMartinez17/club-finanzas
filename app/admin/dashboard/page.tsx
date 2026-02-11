"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiTrendingDown,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface DashboardStats {
  totalColectas: number;
  colectasActivas: number;
  totalMiembros: number;
  totalAportado: number;
  totalIngresos: number;
  totalGastado: number;
  balance: number;
  aportesComprometidos: number;
  faltanteTotalColectas: number;
  totalDeudas: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalColectas: 0,
    colectasActivas: 0,
    totalMiembros: 0,
    totalAportado: 0,
    totalIngresos: 0,
    totalGastado: 0,
    balance: 0,
    aportesComprometidos: 0,
    faltanteTotalColectas: 0,
    totalDeudas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "año" | "todo">("todo");
  const [periodoGrafico, setPeriodoGrafico] = useState<"6meses" | "año" | "todo">(
    "6meses",
  );

  // Función para formatear números abreviados
  const formatCurrency = (value: number | undefined) => {
    if (!value) return "0";
    if (value >= 1000000) {
      const mill = value / 1000000;
      return `${mill % 1 === 0 ? mill : mill.toFixed(1)} mill`;
    }
    if (value >= 1000) {
      const mil = value / 1000;
      return `${mil % 1 === 0 ? mil : mil.toFixed(1)} mil`;
    }
    return value.toString();
  };

  // Función para formatear con símbolo de guaraníes (para PDF)
  const formatCurrencyFull = (value: number) => {
    // Formatear manualmente sin toLocaleString para evitar problemas en PDF
    const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Gs. ${formatted}`;
  };

  // Función para exportar a PDF
  const exportarPDF = async () => {
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString("es-PY");

    const obtenerDatos = async <T,>(url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [] as T[];
        return (await res.json()) as T[];
      } catch (error) {
        return [] as T[];
      }
    };

    const agruparPor = <T extends Record<string, any>>(
      items: T[],
      key: keyof T,
      fallback: string,
    ) => {
      const map = new Map<string, number>();
      items.forEach((item) => {
        const nombre = item[key] ? String(item[key]) : fallback;
        const cantidad = Number(item.cantidad ?? 0);
        map.set(nombre, (map.get(nombre) ?? 0) + cantidad);
      });
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };

    type Ingreso = {
      concepto?: string;
      cantidad?: number;
      fuente?: string;
      fecha?: string;
    };

    type Gasto = {
      concepto?: string;
      cantidad?: number;
      categoria?: string;
      createdAt?: string;
      colectaId?: string;
    };

    type Colecta = {
      id: string;
      nombre: string;
      estado: string;
      objetivo: number;
      totalAportado?: number;
      totalGastos?: number;
    };

    type Aporte = {
      id: string;
      cantidad: number;
      estado: string;
      colectaId?: string;
    };

    type Deuda = {
      id: string;
      montoOriginal: number;
      montoPagado: number;
      montoRestante: number;
      estado: string;
      miembroNombre?: string;
      concepto?: string;
      miembro?: {
        nombre: string;
      };
    };

    const normalizarFuente = (fuente?: string) => {
      if (!fuente) return "Sin fuente";
      return fuente === "Merchandising" ? "Productos del club" : fuente;
    };

    const ingresos = await obtenerDatos<Ingreso>("/api/ingresos");
    const gastos = await obtenerDatos<Gasto>("/api/gastos");
    const colectas = await obtenerDatos<Colecta>("/api/colectas");
    const aportes = await obtenerDatos<Aporte>("/api/colectas/aportes");
    const deudas = await obtenerDatos<Deuda>("/api/deudas");

    // Filtrar solo colectas cerradas/completadas
    const colectasCerradas = colectas.filter(
      (c) => c.estado === "cerrada" || c.estado === "completada",
    );

    // Calcular aportes aportados por colecta cerrada
    const aportesColectasCerradas = colectasCerradas.map((colecta) => {
      const aportesDeColecta = aportes.filter(
        (a) => a.colectaId === colecta.id && a.estado === "aportado",
      );
      const totalAportado = aportesDeColecta.reduce((sum, a) => sum + a.cantidad, 0);
      return {
        nombre: colecta.nombre,
        totalAportado,
      };
    });

    const ingresosNormalizados = ingresos.map((ingreso) => ({
      ...ingreso,
      fuente: normalizarFuente(ingreso.fuente),
    }));

    // Portada
    doc.setFillColor(15, 23, 42); // slate-950
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(226, 232, 240); // slate-200
    doc.setFontSize(28);
    doc.text("CLUB FINANZAS", 105, 100, { align: "center" });

    doc.setFontSize(16);
    doc.text("Reporte Financiero", 105, 120, { align: "center" });

    doc.setFontSize(12);
    doc.text(fechaActual, 105, 140, { align: "center" });

    // Página 2 - Resumen Ejecutivo
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(15, 23, 42);

    doc.setFontSize(18);
    doc.text("RESUMEN EJECUTIVO", 20, 20);

    doc.setFontSize(11);
    let y = 35;

    // Estadísticas principales
    const estadoBalance =
      stats.balance >= 1000
        ? "Excelente"
        : stats.balance >= 500
          ? "Bien"
          : stats.balance >= 0
            ? "Justo"
            : "Negativo";

    doc.setFont("helvetica", "bold");
    doc.text("Saldo actual:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrencyFull(stats.balance) + ` (${estadoBalance})`, 80, y);
    y += 10;

    const diferencia = stats.totalAportado + stats.totalIngresos - stats.totalGastado;
    doc.setFont("helvetica", "bold");
    doc.text("Balance del periodo:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text((diferencia >= 0 ? "+" : "") + formatCurrencyFull(diferencia), 80, y);
    y += 10;

    // Calcular total de deudas
    const totalDeudado = deudas.reduce((sum, d) => sum + d.montoRestante, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Deudas del Club:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrencyFull(totalDeudado), 80, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Socios activos:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(stats.totalMiembros.toString(), 80, y);
    y += 20;

    // Finanzas
    doc.setFontSize(18);
    doc.text("FINANZAS", 20, y);
    y += 15;

    autoTable(doc, {
      startY: y,
      head: [["Concepto", "Monto"]],
      body: [
        ["Aportes de socios", formatCurrencyFull(stats.totalAportado)],
        ["Otros ingresos", formatCurrencyFull(stats.totalIngresos)],
        ["Total Entradas", formatCurrencyFull(stats.totalAportado + stats.totalIngresos)],
        ["", ""],
        ["Total Gastos", formatCurrencyFull(stats.totalGastado)],
        ["", ""],
        ["Resultado", (diferencia >= 0 ? "+" : "") + formatCurrencyFull(diferencia)],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
      styles: { fontSize: 11 },
    });

    // Sección de Deudas del Club (Desglose)
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : y + 20;

    // Solo mostrar sección de deudas si hay deudas
    if (deudas.length > 0) {
      doc.setFontSize(18);
      doc.text("DEUDAS DEL CLUB - DESGLOSE", 20, y);
      y += 15;

      autoTable(doc, {
        startY: y,
        head: [["Acreedor", "Concepto", "Original", "Pagado", "Pendiente", "Estado"]],
        body: deudas.map((deuda) => [
          deuda.miembro?.nombre || deuda.miembroNombre || "N/A",
          deuda.concepto || "N/A",
          formatCurrencyFull(deuda.montoOriginal),
          formatCurrencyFull(deuda.montoPagado),
          formatCurrencyFull(deuda.montoRestante),
          deuda.estado,
        ]),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 9 },
        styles: { fontSize: 9 },
      });

      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : y + 15;
    }

    // Avisos Importantes - SIEMPRE en nueva página si hay deudas o si está muy bajo
    if (deudas.length > 0 || y > 220) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");
      doc.setTextColor(15, 23, 42);
      y = 20;
    } else {
      y += 15;
    }

    doc.setFontSize(18);
    doc.text("AVISOS IMPORTANTES", 20, y);
    y += 15;

    doc.setFontSize(10);
    if (diferencia < 0) {
      doc.text("! Hay que apretar gastos para el siguiente ciclo.", 20, y);
      y += 8;
    }
    if (stats.balance < 500) {
      doc.text("! El saldo esta bajo, considerar revisar gastos.", 20, y);
      y += 8;
    }
    if (stats.aportesComprometidos > 0) {
      doc.text(
        `Hay ${formatCurrencyFull(stats.aportesComprometidos)} en aportes pendientes de cobro.`,
        20,
        y,
      );
      y += 8;
    }
    if (colectasCerradas.length === 0) {
      doc.text("No hay colaboraciones cerradas en este periodo.", 20, y);
      y += 8;
    } else {
      doc.text(
        `${colectasCerradas.length} colaboración(es) cerrada(s) completada(s).`,
        20,
        y,
      );
      y += 8;
    }

    // Página 3 - Colaboraciones Cerradas
    doc.addPage();
    y = 20;

    doc.setFontSize(18);
    doc.text("COLABORACIONES CERRADAS", 20, y);
    y += 15;

    if (colectasCerradas.length === 0) {
      doc.setFontSize(10);
      doc.text("No hay colaboraciones cerradas en este periodo.", 20, y);
      y += 10;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Colaboración", "Objetivo", "Aportado"]],
        body: colectasCerradas.map((colecta) => {
          const totalAportado = aportes
            .filter((a) => a.colectaId === colecta.id && a.estado === "aportado")
            .reduce((sum, a) => sum + a.cantidad, 0);
          return [
            colecta.nombre,
            formatCurrencyFull(colecta.objetivo),
            formatCurrencyFull(totalAportado),
          ];
        }),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
        styles: { fontSize: 11 },
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : y + 15;

      // Detalles de Colaboraciones (en la misma página si hay espacio)
      if (y > 200) {
        // Si no hay espacio suficiente, crear nueva página
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text("Detalles", 20, y);
      y += 10;

      colectasCerradas.forEach((colecta, index) => {
        const aportesDeColecta = aportes.filter(
          (a) => a.colectaId === colecta.id && a.estado === "aportado",
        );
        const totalAportado = aportesDeColecta.reduce((sum, a) => sum + a.cantidad, 0);
        const gastoDeColecta = gastos
          .filter((g) => g.colectaId === colecta.id)
          .reduce((sum, g) => sum + (g.cantidad || 0), 0);
        const diferenciaColecta = totalAportado - gastoDeColecta;

        // Verificar si necesitamos nueva página antes de cada colaboración
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${colecta.nombre}`, 20, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Objetivo: ${formatCurrencyFull(colecta.objetivo)}`, 25, y);
        y += 5;
        doc.text(`Aportado: ${formatCurrencyFull(totalAportado)}`, 25, y);
        y += 5;
        doc.text(`Gastos: ${formatCurrencyFull(gastoDeColecta)}`, 25, y);
        y += 5;
        doc.setFont("helvetica", "bold");
        const colorEstado: [number, number, number] =
          diferenciaColecta >= 0 ? [15, 23, 42] : [220, 38, 38];
        doc.setTextColor(...colorEstado);
        doc.text(`Diferencia: ${formatCurrencyFull(diferenciaColecta)}`, 25, y);
        doc.setTextColor(15, 23, 42);
        y += 8;

        if (index < colectasCerradas.length - 1) {
          doc.setDrawColor(200);
          doc.line(20, y, 190, y);
          y += 5;
        }
      });
    }

    // Página 4 - Ingresos (Desglose + Detallados)
    doc.addPage();
    y = 20;

    doc.setFontSize(18);
    doc.text("INGRESOS", 20, y);
    y += 10;

    // Agrupar ingresos por fuente
    const ingresosPorFuente = agruparPor(ingresosNormalizados, "fuente", "Sin fuente");

    // Crear array combinado de ingresos y colaboraciones cerradas
    const ingresosConColectas = [
      ...ingresosPorFuente,
      ...aportesColectasCerradas.map((col) => [
        `Colaboración: ${col.nombre}` as any,
        col.totalAportado as any,
      ]),
    ] as [string, number][];

    // Desglose por fuente
    doc.setFontSize(14);
    doc.text("Desglose por fuente", 20, y);
    y += 8;

    if (ingresosConColectas.length === 0) {
      doc.setFontSize(10);
      doc.text("Sin datos disponibles.", 20, y);
      y += 10;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Fuente de Ingreso", "Monto"]],
        body: ingresosConColectas.map(([fuente, total]) => [
          fuente,
          formatCurrencyFull(total),
        ]),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
        styles: { fontSize: 11 },
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : y + 15;
    }

    // Verificar si hay espacio para detallados
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    // Listado detallado
    doc.setFontSize(14);
    doc.text("Listado detallado", 20, y);
    y += 8;

    // Combinar ingresos normales con colaboraciones cerradas
    const ingresosDetallados = [
      ...ingresosNormalizados,
      ...colectasCerradas.map((colecta) => {
        const totalAportado = aportes
          .filter((a) => a.colectaId === colecta.id && a.estado === "aportado")
          .reduce((sum, a) => sum + a.cantidad, 0);
        return {
          concepto: colecta.nombre,
          fuente: "Colaboración Cerrada",
          cantidad: totalAportado,
          fecha: null,
        };
      }),
    ];

    if (ingresosDetallados.length === 0) {
      doc.setFontSize(10);
      doc.text("Sin datos disponibles.", 20, y);
      y += 10;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Concepto", "Fuente", "Monto", "Fecha"]],
        body: ingresosDetallados.map((ingreso) => {
          const fecha = ingreso.fecha
            ? new Date(ingreso.fecha).toLocaleDateString("es-PY")
            : "-";
          return [
            ingreso.concepto || "Sin concepto",
            ingreso.fuente || "Sin fuente",
            formatCurrencyFull(Number(ingreso.cantidad ?? 0)),
            fecha,
          ];
        }),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
        styles: { fontSize: 11 },
      });
    }

    // Página 5 - Gastos (Desglose + Detallados)
    doc.addPage();
    y = 20;

    doc.setFontSize(18);
    doc.text("GASTOS", 20, y);
    y += 10;

    // Desglose por categoría
    doc.setFontSize(14);
    doc.text("Desglose por categoria", 20, y);
    y += 8;

    const gastosPorCategoria = agruparPor(gastos, "categoria", "Sin categoria");
    if (gastosPorCategoria.length === 0) {
      doc.setFontSize(10);
      doc.text("Sin datos disponibles.", 20, y);
      y += 10;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Categoria", "Monto"]],
        body: gastosPorCategoria.map(([categoria, total]) => [
          categoria,
          formatCurrencyFull(total),
        ]),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
        styles: { fontSize: 11 },
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : y + 15;
    }

    // Verificar si hay espacio para detallados
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    // Listado detallado
    doc.setFontSize(14);
    doc.text("Listado detallado", 20, y);
    y += 8;

    if (gastos.length === 0) {
      doc.setFontSize(10);
      doc.text("Sin datos disponibles.", 20, y);
      y += 10;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Concepto", "Categoria", "Monto", "Fecha"]],
        body: gastos.map((gasto) => {
          const fecha = gasto.createdAt
            ? new Date(gasto.createdAt).toLocaleDateString("es-PY")
            : "-";
          return [
            gasto.concepto || "Sin concepto",
            gasto.categoria || "Sin categoria",
            formatCurrencyFull(Number(gasto.cantidad ?? 0)),
            fecha,
          ];
        }),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
        styles: { fontSize: 11 },
      });
    }

    // Pie de pagina en todas las paginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Pagina ${i} de ${pageCount} - Generado el ${fechaActual}`, 105, 287, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text("Para ver mejor en moviles, gira la pantalla", 105, 292, {
        align: "center",
      });
    }

    // Descargar
    doc.save(`Reporte-Club-${fechaActual.replace(/\//g, "-")}.pdf`);
  };

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        // Intentar cargar datos reales
        try {
          const [
            colectasRes,
            miembrosRes,
            aportesRes,
            gastosRes,
            ingresosRes,
            deudasRes,
          ] = await Promise.all([
            fetch("/api/colectas"),
            fetch("/api/miembros"),
            fetch("/api/colectas/aportes"),
            fetch("/api/gastos"),
            fetch("/api/ingresos"),
            fetch("/api/deudas"),
          ]);

          if (
            colectasRes.ok &&
            miembrosRes.ok &&
            aportesRes.ok &&
            gastosRes.ok &&
            ingresosRes.ok &&
            deudasRes.ok
          ) {
            const colectas = await colectasRes.json();
            const miembros = await miembrosRes.json();
            const aportes = await aportesRes.json();
            const gastos = await gastosRes.json();
            const ingresos = await ingresosRes.json();
            const deudas = await deudasRes.json();

            const totalAportado = aportes
              .filter((a: any) => a.estado === "aportado")
              .reduce((sum: number, a: any) => sum + a.cantidad, 0);

            const aportesComprometidos = aportes
              .filter((a: any) => a.estado === "comprometido")
              .reduce((sum: number, a: any) => sum + a.cantidad, 0);

            const totalGastado = gastos.reduce(
              (sum: number, g: any) => sum + (g.cantidad || 0),
              0,
            );
            const totalIngresos = ingresos.reduce(
              (sum: number, i: any) => sum + i.cantidad,
              0,
            );

            const colectasActivas = colectas.filter((c: any) => c.estado === "activa");
            const faltanteTotalColectas = colectasActivas.reduce(
              (sum: number, c: any) => {
                const aportado = c.totalAportado || 0;
                const faltante = Math.max(0, c.objetivo - aportado);
                return sum + faltante;
              },
              0,
            );

            const totalDeudas = deudas.reduce(
              (sum: number, d: any) => sum + (d.montoRestante || 0),
              0,
            );

            setStats({
              totalColectas: colectas.length,
              colectasActivas: colectasActivas.length,
              totalMiembros: miembros.length,
              totalAportado,
              totalIngresos,
              totalGastado,
              balance: totalAportado + totalIngresos - totalGastado,
              aportesComprometidos,
              faltanteTotalColectas,
              totalDeudas,
            });
            return;
          }
        } catch (error) {
          console.log("API real no disponible, usando mock...");
        }

        // Fallback a estadísticas simuladas
        setStats({
          totalColectas: 8,
          colectasActivas: 3,
          totalMiembros: 45,
          totalAportado: 2500,
          totalIngresos: 800,
          totalGastado: 1200,
          balance: 2100,
          aportesComprometidos: 500,
          faltanteTotalColectas: 1200,
          totalDeudas: 0,
        });
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  const totalEntradas = stats.totalAportado + stats.totalIngresos;
  const diferencia = totalEntradas - stats.totalGastado;
  const estadoBalance =
    stats.balance >= 1000
      ? "excelente"
      : stats.balance >= 500
        ? "bien"
        : stats.balance >= 0
          ? "justo"
          : "negativo";

  const chartData = useMemo(() => {
    let months: string[];
    let factors: number[];

    if (periodoGrafico === "6meses") {
      months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
      factors = [0.75, 0.9, 1.05, 0.95, 1.15, 0.85];
    } else if (periodoGrafico === "año") {
      months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      factors = [0.75, 0.9, 1.05, 0.95, 1.15, 0.85, 0.8, 1.1, 0.9, 1.0, 0.95, 1.2];
    } else {
      months = [
        "T1 2024",
        "T2 2024",
        "T3 2024",
        "T4 2024",
        "T1 2025",
        "T2 2025",
        "T3 2025",
        "T4 2025",
      ];
      factors = [0.7, 0.85, 1.0, 1.1, 0.95, 1.15, 1.05, 0.9];
    }

    const baseIn = totalEntradas / months.length || 0;
    const baseOut = stats.totalGastado / months.length || 0;
    let acumulado = 0;

    return months.map((mes, idx) => {
      const ingresos = Math.round(baseIn * factors[idx]);
      const gastos = Math.round(baseOut * factors[(idx + 2) % factors.length]);
      const neto = ingresos - gastos;
      acumulado += neto;
      return { mes, ingresos, gastos, neto, acumulado };
    });
  }, [totalEntradas, stats.totalGastado, periodoGrafico]);

  const pieData = useMemo(() => {
    const data = [
      { name: "Aportes", value: stats.totalAportado },
      { name: "Otros ingresos", value: stats.totalIngresos },
      { name: "Gastos", value: stats.totalGastado },
    ].filter((item) => item.value > 0);

    return data.length > 0 ? data : [{ name: "Sin datos", value: 1 }];
  }, [stats.totalAportado, stats.totalIngresos, stats.totalGastado]);

  const pieColors = ["#22c55e", "#38bdf8", "#f97316", "#64748b"];

  if (loading) {
    return <div className="text-center py-8">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Resumen general
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Panorama del Club</h1>
            <p className="text-sm text-slate-400">
              Un vistazo rapido a la plata que entra, sale y queda.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <div className="flex gap-2">
              <div className="inline-flex flex-1 rounded-full border border-slate-700 bg-slate-900/60 p-1 text-xs font-medium text-slate-300 lg:flex-initial">
                <button
                  onClick={() => setPeriodo("mes")}
                  className={`flex-1 rounded-full px-4 py-2 transition ${
                    periodo === "mes"
                      ? "bg-slate-200 text-slate-900"
                      : "hover:bg-slate-800"
                  }`}
                >
                  Este Mes
                </button>
                <button
                  onClick={() => setPeriodo("año")}
                  className={`flex-1 rounded-full px-4 py-2 transition ${
                    periodo === "año"
                      ? "bg-slate-200 text-slate-900"
                      : "hover:bg-slate-800"
                  }`}
                >
                  Este Año
                </button>
                <button
                  onClick={() => setPeriodo("todo")}
                  className={`flex-1 rounded-full px-4 py-2 transition ${
                    periodo === "todo"
                      ? "bg-slate-200 text-slate-900"
                      : "hover:bg-slate-800"
                  }`}
                >
                  Total
                </button>
              </div>
              <button
                onClick={exportarPDF}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
              >
                <FiDownload className="h-4 w-4" />
                PDF
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Actualizado al toque
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Saldo</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                {formatCurrency(stats.balance)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {estadoBalance === "excelente" && "Estamos sobrados, todo bien"}
                {estadoBalance === "bien" && "Bien encaminado, vamos tranqui"}
                {estadoBalance === "justo" && "Estamos justos, cuidar gastos"}
                {estadoBalance === "negativo" && "Estamos en rojo, hay que ajustar"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Entrada</p>
              <p className="mt-3 text-3xl font-semibold text-sky-300">
                {formatCurrency(totalEntradas)}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Aporte de socios</span>
                <span className="text-slate-200">
                  {formatCurrency(stats.totalAportado)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Otros ingresos</span>
                <span className="text-slate-200">
                  {formatCurrency(stats.totalIngresos)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Salida</p>
              <p className="mt-3 text-3xl font-semibold text-orange-300">
                {formatCurrency(stats.totalGastado)}
              </p>
              <p className="mt-2 text-xs text-slate-400">Total de gastos del periodo</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Por cobrar
              </p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">
                {formatCurrency(stats.aportesComprometidos)}
              </p>
              <p className="mt-2 text-xs text-slate-400">Falta que entren esos pagos</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Pendientes y avisos
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Dinero que debemos</span>
                  <span
                    className={`text-slate-100 font-semibold ${stats.totalDeudas > 0 ? "text-red-300" : "text-emerald-300"}`}
                  >
                    {formatCurrency(stats.totalDeudas)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {stats.totalDeudas > 0
                    ? "El club debe este monto en deudas pendientes."
                    : "No hay deudas pendientes de pago."}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Resultado del periodo</span>
                  <span className="text-emerald-300 font-semibold">
                    {diferencia >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(diferencia))}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {diferencia >= 0
                    ? "Estamos arriba, buen margen."
                    : "Hay que apretar gastos para el siguiente ciclo."}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Socios activos</span>
                  <span className="text-slate-100 font-semibold">
                    {stats.totalMiembros}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  La base de socios esta lista para nuevas movidas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Entradas vs Gastos
            </h2>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/60 p-0.5 text-xs font-medium text-slate-300">
              <button
                onClick={() => setPeriodoGrafico("6meses")}
                className={`rounded-md px-3 py-1.5 transition ${
                  periodoGrafico === "6meses"
                    ? "bg-slate-700 text-slate-100"
                    : "hover:bg-slate-800"
                }`}
              >
                6 meses
              </button>
              <button
                onClick={() => setPeriodoGrafico("año")}
                className={`rounded-md px-3 py-1.5 transition ${
                  periodoGrafico === "año"
                    ? "bg-slate-700 text-slate-100"
                    : "hover:bg-slate-800"
                }`}
              >
                1 año
              </button>
              <button
                onClick={() => setPeriodoGrafico("todo")}
                className={`rounded-md px-3 py-1.5 transition ${
                  periodoGrafico === "todo"
                    ? "bg-slate-700 text-slate-100"
                    : "hover:bg-slate-800"
                }`}
              >
                Todo
              </button>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 8, right: 8, top: 5 }}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="mes" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value)}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                />
                <Legend
                  wrapperStyle={{ color: "#e2e8f0", fontSize: "12px" }}
                  iconType="rect"
                />
                <Bar
                  dataKey="ingresos"
                  fill="#22c55e"
                  name="Entradas"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="gastos"
                  fill="#f97316"
                  name="Gastos"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Mezcla de plata
            </h2>
            <span className="text-xs text-slate-500">Distribucion</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value)}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-400">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: pieColors[index % pieColors.length] }}
                  />
                  {item.name}
                </div>
                <span className="text-slate-200">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Movimiento mensual
            </h2>
            <span className="text-xs text-slate-500">Acumulado</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 5 }}>
                <defs>
                  <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="mes" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value)}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke="#38bdf8"
                  fill="url(#cashflowGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Indicadores del club
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-sm">
                <FiUsers className="text-sky-300" />
                Socios activos
              </div>
              <span className="text-slate-100 font-semibold">{stats.totalMiembros}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-sm">
                <FiAlertCircle
                  className={stats.totalDeudas > 0 ? "text-red-300" : "text-emerald-300"}
                />
                Dinero que debemos
              </div>
              <span
                className={`text-slate-100 font-semibold ${stats.totalDeudas > 0 ? "text-red-300" : "text-emerald-300"}`}
              >
                {formatCurrency(stats.totalDeudas)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-sm">
                <FiDollarSign className="text-amber-300" />
                Falta juntar
              </div>
              <span className="text-slate-100 font-semibold">
                {formatCurrency(stats.faltanteTotalColectas)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-sm">
                <FiAlertCircle className="text-orange-300" />
                Por cobrar
              </div>
              <span className="text-slate-100 font-semibold">
                {formatCurrency(stats.aportesComprometidos)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Acciones rapidas
          </h2>
          <span className="text-xs text-slate-500">Atajos de gestion</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <a
            href="/admin/colectas"
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FiTrendingUp className="text-sky-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Colectas</p>
                <p className="text-xs text-slate-400">Crear campaña</p>
              </div>
            </div>
            <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-1 rounded whitespace-nowrap ml-2">
              Crear
            </span>
          </a>
          <a
            href="/admin/miembros"
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FiUsers className="text-emerald-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Socios</p>
                <p className="text-xs text-slate-400">Agregar nuevo</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded whitespace-nowrap ml-2">
              Agregar
            </span>
          </a>
          <a
            href="/admin/ingresos"
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FiDollarSign className="text-amber-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Ingresos</p>
                <p className="text-xs text-slate-400">Registrar entrada</p>
              </div>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded whitespace-nowrap ml-2">
              Registrar
            </span>
          </a>
          <a
            href="/admin/gastos"
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FiTrendingDown className="text-orange-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Gastos</p>
                <p className="text-xs text-slate-400">Registrar egreso</p>
              </div>
            </div>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded whitespace-nowrap ml-2">
              Registrar
            </span>
          </a>
          <a
            href="/admin/aportes"
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-purple-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Aportes</p>
                <p className="text-xs text-slate-400">Registrar aporte</p>
              </div>
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded whitespace-nowrap ml-2">
              Registrar
            </span>
          </a>
          <a
            href="/admin/usuarios"
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FiUsers className="text-slate-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Administradores</p>
                <p className="text-xs text-slate-400">Crear usuario</p>
              </div>
            </div>
            <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded whitespace-nowrap ml-2">
              Crear
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}
