"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import {
  FiDownload,
  FiFilter,
  FiDollarSign,
  FiTrendingUp,
  FiPieChart,
  FiX,
  FiPlus,
} from "react-icons/fi";
import { SearchBar } from "@/components/SearchBar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Deuda {
  id: string;
  miembroNombre: string;
  concepto: string;
  montoOriginal: number;
  montoPagado: number;
  montoRestante: number;
  estado: string;
  fecha: string;
  notas?: string;
  pagos?: PagoDeuda[];
}

interface PagoDeuda {
  id: string;
  cantidad: number;
  fecha: string;
  notas?: string;
}

interface Miembro {
  id: string;
  nombre: string;
}

const ESTADOS_DEUDA = ["Todos", "pendiente", "parcial_pagada", "pagada"];
const CONCEPTOS = [
  "Todos",
  "comidas",
  "transporte",
  "préstamo",
  "jugadores",
  "compra de equipos",
  "otro",
];

export default function AdminDeudas() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [conceptoFiltro, setConceptoFiltro] = useState("Todos");
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [deudaEliminar, setDeudaEliminar] = useState<Deuda | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [deudaEditando, setDeudaEditando] = useState<Deuda | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Estados para nueva deuda
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [nuevaDeuda, setNuevaDeuda] = useState({
    miembroId: "",
    miembroNombre: "",
    tipoDeuda: "miembro", // "miembro" o "general"
    concepto: "préstamo",
    conceptoPersonalizado: "",
    montoOriginal: 0,
    notas: "",
  });

  // Estados para registrar pago
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [deudaPago, setDeudaPago] = useState<Deuda | null>(null);
  const [montoPago, setMontoPago] = useState(0);
  const [notasPago, setNotasPago] = useState("");

  useEffect(() => {
    cargarDeudas();
    cargarMiembros();
  }, []);

  const formatCurrencyShort = (value: number) => {
    if (!value && value !== 0) return "0";
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

  const cargarMiembros = async () => {
    try {
      const res = await fetch("/api/miembros");
      if (res.ok) {
        const data = await res.json();
        setMiembros(data);
      }
    } catch (error) {
      console.error("Error cargando miembros:", error);
    }
  };

  const cargarDeudas = async () => {
    try {
      const res = await fetch("/api/deudas");
      if (res.ok) {
        const data = await res.json();
        const deudasTransformadas = data.map((d: any) => ({
          id: d.id,
          miembroNombre: d.miembro?.nombre || d.miembroNombre || "N/A",
          concepto: d.concepto || "N/A",
          montoOriginal: d.montoOriginal,
          montoPagado: d.montoPagado,
          montoRestante: d.montoRestante,
          estado: d.estado || "pendiente",
          fecha: d.fecha
            ? new Date(d.fecha).toLocaleDateString()
            : new Date(d.createdAt).toLocaleDateString(),
          notas: d.notas,
        }));
        setDeudas(deudasTransformadas);
        return;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (deuda: Deuda) => {
    try {
      // Obtener detalles completos de la deuda incluyendo pagos
      const res = await fetch(`/api/deudas/${deuda.id}`);
      if (res.ok) {
        const deudaCompleta = await res.json();
        // Transformar a formato compatible
        const deudaTransformada = {
          ...deuda,
          pagos: deudaCompleta.pagos || [],
        };
        setDeudaEditando(deudaTransformada);
        setModalEditarAbierto(true);
      }
    } catch (error) {
      console.error("Error cargando deuda:", error);
      // Fallback: abrir con datos disponibles
      setDeudaEditando(deuda);
      setModalEditarAbierto(true);
    }
  };

  const handleDelete = async (deuda: Deuda) => {
    setDeudaEliminar(deuda);
    setMostrarConfirm(true);
  };

  const handleRegistrarPago = (deuda: Deuda) => {
    setDeudaPago(deuda);
    setMontoPago(0);
    setNotasPago("");
    setModalPagoAbierto(true);
  };

  const confirmarEliminacion = async () => {
    if (!deudaEliminar) return;

    const idEliminar = deudaEliminar.id;

    // Eliminar de UI inmediatamente
    setDeudas(deudas.filter((d) => d.id !== idEliminar));
    toast.success("Deuda eliminada correctamente");
    setMostrarConfirm(false);
    setDeudaEliminar(null);

    try {
      const res = await fetch(`/api/deudas/${idEliminar}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Si falla, revertir
        toast.error("Error al eliminar la deuda");
        cargarDeudas();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar la deuda");
    }
  };

  const actualizarDeuda = async () => {
    if (!deudaEditando) return;

    if (!deudaEditando.montoOriginal || deudaEditando.montoOriginal <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    const deudasAnteriores = [...deudas];
    const deudaOriginal = deudas.find((d) => d.id === deudaEditando.id);

    // CAMBIO OPTIMISTA: Actualizar la UI inmediatamente
    setDeudas(
      deudas.map((d) =>
        d.id === deudaEditando.id
          ? {
              ...d,
              montoOriginal: deudaEditando.montoOriginal,
              concepto: deudaEditando.concepto,
              notas: deudaEditando.notas,
              montoPagado: deudaEditando.montoPagado,
              montoRestante: deudaEditando.montoRestante,
              estado: deudaEditando.estado,
            }
          : d,
      ),
    );

    toast.success("Deuda actualizada correctamente");
    cerrarModalEditar();

    setGuardando(true);

    try {
      // Determinar si es un pago completo
      const montoRestante = deudaEditando.montoOriginal - deudaEditando.montoPagado;
      const montoRestanteOriginal = deudaOriginal
        ? deudaOriginal.montoOriginal - deudaOriginal.montoPagado
        : deudaEditando.montoRestante;
      const esDeudaCompletada =
        deudaEditando.montoPagado > 0 &&
        montoRestante === 0 &&
        deudaEditando.montoPagado !== deudaOriginal?.montoPagado;

      // Si es un pago completo (mediante el checkbox), registrar el pago
      if (esDeudaCompletada) {
        const montoARegistrar = montoRestanteOriginal;

        if (montoARegistrar > 0) {
          const resPago = await fetch(`/api/deudas/${deudaEditando.id}/pago`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cantidad: montoARegistrar,
              notas: "Pago completo",
            }),
          });

          if (!resPago.ok) {
            const error = await resPago.json();
            toast.error(error.error || "Error al registrar el pago");
            // REVERTIR: Restaurar valores anteriores
            setDeudas(deudasAnteriores);
            setGuardando(false);
            return;
          }
        }
      } else {
        // Solo actualizar datos básicos de la deuda
        const res = await fetch(`/api/deudas/${deudaEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concepto: deudaEditando.concepto,
            montoOriginal: deudaEditando.montoOriginal,
            notas: deudaEditando.notas,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(
            error.error || "Error al actualizar la deuda. Se revirtieron los cambios.",
          );
          // REVERTIR: Restaurar valores anteriores
          setDeudas(deudasAnteriores);
          setGuardando(false);
          return;
        }
      }

      // Recargar deudas del servidor para sincronizar
      cargarDeudas();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión. Se revirtieron los cambios.");
      // REVERTIR: Restaurar valores anteriores
      setDeudas(deudasAnteriores);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setDeudaEditando(null);
  };

  const abrirModalNuevo = () => {
    setNuevaDeuda({
      miembroId: "",
      miembroNombre: "",
      tipoDeuda: "miembro",
      concepto: "préstamo",
      conceptoPersonalizado: "",
      montoOriginal: 0,
      notas: "",
    });
    setModalNuevoAbierto(true);
  };

  const cerrarModalNuevo = () => {
    setModalNuevoAbierto(false);
    setNuevaDeuda({
      miembroId: "",
      miembroNombre: "",
      tipoDeuda: "miembro",
      concepto: "préstamo",
      conceptoPersonalizado: "",
      montoOriginal: 0,
      notas: "",
    });
  };

  const crearDeuda = async () => {
    if (!nuevaDeuda.concepto) {
      toast.error("Debes seleccionar un concepto");
      return;
    }

    // Si es "otro", validar que haya un concepto personalizado
    if (nuevaDeuda.concepto === "otro" && !nuevaDeuda.conceptoPersonalizado.trim()) {
      toast.error("Por favor, especifica el concepto");
      return;
    }

    if (!nuevaDeuda.montoOriginal || nuevaDeuda.montoOriginal <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    // Validar según el tipo de deuda
    if (nuevaDeuda.tipoDeuda === "miembro" && !nuevaDeuda.miembroId) {
      toast.error("Debes seleccionar un miembro");
      return;
    }

    if (nuevaDeuda.tipoDeuda === "general" && !nuevaDeuda.miembroNombre.trim()) {
      toast.error("Especifica a quién se le debe dinero (ej: Cuerpo técnico, Jugadores)");
      return;
    }

    // Agregar con ID temporal
    const tempId = `temp-${Date.now()}`;
    const conceptoFinal =
      nuevaDeuda.concepto === "otro"
        ? nuevaDeuda.conceptoPersonalizado
        : nuevaDeuda.concepto;

    const nuevaDeudaObj = {
      id: tempId,
      miembroNombre:
        nuevaDeuda.tipoDeuda === "miembro"
          ? miembros.find((m) => m.id === nuevaDeuda.miembroId)?.nombre || "N/A"
          : nuevaDeuda.miembroNombre,
      concepto: conceptoFinal,
      montoOriginal: nuevaDeuda.montoOriginal,
      montoRestante: nuevaDeuda.montoOriginal,
      montoPagado: 0,
      estado: "pendiente",
      notas: nuevaDeuda.notas,
      fecha: new Date().toISOString(),
      fechaCreacion: new Date().toLocaleDateString(),
    };

    setDeudas([...deudas, nuevaDeudaObj]);
    toast.success("Deuda registrada correctamente");
    cerrarModalNuevo();

    setGuardando(true);
    try {
      const res = await fetch("/api/deudas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miembroId: nuevaDeuda.tipoDeuda === "miembro" ? nuevaDeuda.miembroId : null,
          miembroNombre:
            nuevaDeuda.tipoDeuda === "general" ? nuevaDeuda.miembroNombre : null,
          concepto: conceptoFinal,
          montoOriginal: nuevaDeuda.montoOriginal,
          montoRestante: nuevaDeuda.montoOriginal,
          notas: nuevaDeuda.notas,
        }),
      });

      if (res.ok) {
        // Recargar para obtener ID real
        cargarDeudas();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al crear la deuda");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const registrarPago = async () => {
    if (!deudaPago) return;

    if (!montoPago || montoPago <= 0) {
      toast.error("El monto del pago debe ser mayor a 0");
      return;
    }

    if (montoPago > deudaPago.montoRestante) {
      toast.error(
        `El pago no puede exceder el monto restante (₲${deudaPago.montoRestante.toLocaleString()})`,
      );
      return;
    }

    const deudasAnteriores = [...deudas];

    // Actualizar UI inmediatamente
    const nuevoMontoRestante = deudaPago.montoRestante - montoPago;
    const nuevoMontoPagado = deudaPago.montoPagado + montoPago;
    const nuevoEstado = nuevoMontoRestante === 0 ? "pagada" : "pendiente";

    setDeudas(
      deudas.map((d) =>
        d.id === deudaPago.id
          ? {
              ...d,
              montoRestante: nuevoMontoRestante,
              montoPagado: nuevoMontoPagado,
              estado: nuevoEstado,
            }
          : d,
      ),
    );
    toast.success("Pago registrado correctamente");
    cerrarModalPago();

    setGuardando(true);
    try {
      const res = await fetch(`/api/deudas/${deudaPago.id}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad: montoPago,
          notas: notasPago,
        }),
      });

      if (res.ok) {
        // Recargar para sincronizar con el servidor
        cargarDeudas();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al registrar el pago");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModalPago = () => {
    setModalPagoAbierto(false);
    setDeudaPago(null);
    setMontoPago(0);
    setNotasPago("");
  };

  // Filtrado y búsqueda
  const deudasFiltradas = useMemo(() => {
    return deudas.filter((deuda) => {
      const matchQuery =
        searchQuery === "" ||
        deuda.miembroNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deuda.concepto.toLowerCase().includes(searchQuery.toLowerCase());

      const matchEstado = estadoFiltro === "Todos" || deuda.estado === estadoFiltro;
      const matchConcepto =
        conceptoFiltro === "Todos" || deuda.concepto === conceptoFiltro;

      return matchQuery && matchEstado && matchConcepto;
    });
  }, [deudas, searchQuery, estadoFiltro, conceptoFiltro]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const totalAdeudado = deudasFiltradas.reduce((sum, d) => sum + d.montoRestante, 0);
    const totalTransferencias = deudasFiltradas.reduce(
      (sum, d) => sum + d.montoPagado,
      0,
    );
    const promedio =
      deudasFiltradas.length > 0 ? totalAdeudado / deudasFiltradas.length : 0;

    const deudaPorMiembro = deudasFiltradas.reduce(
      (acc, d) => {
        acc[d.miembroNombre] = (acc[d.miembroNombre] || 0) + d.montoRestante;
        return acc;
      },
      {} as Record<string, number>,
    );

    const miembroMayorDeuda = Object.entries(deudaPorMiembro).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      totalAdeudado,
      totalTransferencias,
      cantidad: deudasFiltradas.length,
      promedio,
      miembroMayorDeuda: miembroMayorDeuda ? miembroMayorDeuda[0] : "N/A",
    };
  }, [deudasFiltradas]);

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246); // Púrpura para deudas
    doc.text("Reporte de Deudas", 15, 18);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 28);
    doc.text(`Total de deudas: ${deudasFiltradas.length}`, 95, 28);

    doc.text(
      `Monto total adeudado: Gs. ${estadisticas.totalAdeudado.toLocaleString()}`,
      15,
      35,
    );
    doc.text(
      `Monto total pagado: Gs. ${estadisticas.totalTransferencias.toLocaleString()}`,
      95,
      35,
    );

    autoTable(doc, {
      startY: 45,
      head: [["Miembro", "Concepto", "Monto Original", "Pagado", "Restante", "Fecha"]],
      body: deudasFiltradas.map((d) => [
        d.miembroNombre,
        d.concepto,
        `Gs. ${d.montoOriginal.toLocaleString()}`,
        `Gs. ${d.montoPagado.toLocaleString()}`,
        `Gs. ${d.montoRestante.toLocaleString()}`,
        d.fecha,
      ]),
      styles: {
        fontSize: 11,
        cellPadding: 7,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: 255,
        fontStyle: "bold",
        lineWidth: 0.5,
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: [245, 242, 255],
      },
      margin: { left: 15, right: 15, top: 45 },
      didDrawPage: function (data: any) {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${data.pageNumber} de ${(doc as any).internal.pages.length - 1} - Club Finanzas`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 14,
          { align: "center" },
        );
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(
          "Para ver mejor en moviles, gira la pantalla",
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" },
        );
      },
    });

    doc.save(`deudas_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const columns: TableColumn[] = [
    { key: "miembroNombre", label: "Miembro" },
    { key: "concepto", label: "Concepto" },
    {
      key: "montoOriginal",
      label: "Monto Original",
      render: (value) => (
        <span className="font-semibold text-purple-300">
          ₲{(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: "montoPagado",
      label: "Pagado",
      render: (value) => (
        <span className="text-emerald-300">₲{(value as number).toLocaleString()}</span>
      ),
    },
    {
      key: "montoRestante",
      label: "Restante",
      render: (value) => (
        <span className="font-semibold text-amber-300">
          ₲{(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => {
        const estadoConfig = {
          pendiente: "bg-red-500/20 text-red-200",
          parcial_pagada: "bg-amber-500/20 text-amber-200",
          pagada: "bg-emerald-500/20 text-emerald-200",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              estadoConfig[value as keyof typeof estadoConfig] ||
              "bg-slate-500/20 text-slate-200"
            }`}
          >
            {value === "parcial_pagada" ? "Parcial" : value}
          </span>
        );
      },
    },
    { key: "fecha", label: "Fecha" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gestión</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Historial de Deudas</h1>
            <p className="text-sm text-slate-400">
              Visualiza y gestiona las deudas del club hacia los miembros
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={abrirModalNuevo}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition"
            >
              <FiPlus size={18} /> Nueva Deuda
            </button>

            <button
              onClick={exportarPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-purple-700 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <FiDownload size={18} /> PDF
            </button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Total Adeudado
          </p>
          <p className="mt-2 text-2xl font-semibold text-red-400">
            {formatCurrencyShort(estadisticas.totalAdeudado)}
          </p>
          <p className="text-xs text-slate-500">Monto pendiente</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            N° de Deudas
          </p>
          <p className="mt-2 text-2xl font-semibold text-purple-300">
            {estadisticas.cantidad}
          </p>
          <p className="text-xs text-slate-500">Registradas</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Deuda Promedio
          </p>
          <p className="mt-2 text-2xl font-semibold text-violet-300">
            {formatCurrencyShort(estadisticas.promedio)}
          </p>
          <p className="text-xs text-slate-500">Por deuda</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Mayor Acreedor
          </p>
          <p className="mt-2 text-lg font-semibold text-amber-300">
            {estadisticas.miembroMayorDeuda}
          </p>
          <p className="text-xs text-slate-500">A quien más debemos</p>
        </div>
      </section>

      {/* Filtros y Búsqueda */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-medium mb-3">
          <FiFilter size={18} />
          <span>Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar
            </label>
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Buscar por miembro, concepto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {ESTADOS_DEUDA.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "parcial_pagada" ? "Parcialmente Pagada" : estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Concepto
            </label>
            <select
              value={conceptoFiltro}
              onChange={(e) => setConceptoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {CONCEPTOS.map((concepto) => (
                <option key={concepto} value={concepto}>
                  {concepto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
        <AdminTable
          columns={columns}
          data={deudasFiltradas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay deudas que coincidan con los filtros"
          itemsPerPage={10}
        />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {mostrarConfirm && deudaEliminar && (
        <ConfirmDialog
          title="Eliminar Deuda"
          message="¿Estás seguro de que deseas eliminar esta deuda?"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminacion}
          onCancel={() => {
            setMostrarConfirm(false);
            setDeudaEliminar(null);
          }}
          isDangerous={true}
        />
      )}

      {/* Modal Editar Deuda */}
      {modalEditarAbierto && deudaEditando && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalEditar}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Editar Deuda</h2>
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Miembro (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Miembro
                  </label>
                  <input
                    type="text"
                    value={deudaEditando.miembroNombre}
                    disabled
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed"
                  />
                </div>

                {/* Concepto */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    value={deudaEditando.concepto}
                    onChange={(e) =>
                      setDeudaEditando({
                        ...deudaEditando,
                        concepto: e.target.value,
                      })
                    }
                    placeholder="Ej: comidas, transporte, préstamo, etc."
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Monto Original */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Monto Original (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      deudaEditando.montoOriginal
                        ? deudaEditando.montoOriginal.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setDeudaEditando({
                        ...deudaEditando,
                        montoOriginal: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Información de pagos (solo lectura) */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Total Pagado
                    </label>
                    <input
                      type="text"
                      value={`₲${deudaEditando.montoPagado.toLocaleString()}`}
                      disabled
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-emerald-400 rounded-lg cursor-not-allowed font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Total Restante
                    </label>
                    <input
                      type="text"
                      value={`₲${deudaEditando.montoRestante.toLocaleString()}`}
                      disabled
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-amber-400 rounded-lg cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={deudaEditando.notas || ""}
                    onChange={(e) =>
                      setDeudaEditando({
                        ...deudaEditando,
                        notas: e.target.value,
                      })
                    }
                    placeholder="Notas adicionales sobre la deuda..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Historial de Pagos */}
                {deudaEditando.pagos && deudaEditando.pagos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Historial de Pagos
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {deudaEditando.pagos.map((pago) => (
                        <div
                          key={pago.id}
                          className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-emerald-400">
                              ₲{pago.cantidad.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(pago.fecha).toLocaleDateString("es-PY")}
                            </span>
                          </div>
                          {pago.notas && (
                            <p className="text-slate-300 text-xs italic">
                              "{pago.notas}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkbox - Marcar como pagada */}
                <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="marcarPagada"
                    checked={
                      deudaEditando.montoPagado === deudaEditando.montoOriginal &&
                      deudaEditando.montoOriginal > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDeudaEditando({
                          ...deudaEditando,
                          montoPagado: deudaEditando.montoOriginal,
                          montoRestante: 0,
                          estado: "pagada",
                        });
                      } else {
                        setDeudaEditando({
                          ...deudaEditando,
                          montoPagado:
                            deudas.find((d) => d.id === deudaEditando.id)?.montoPagado ||
                            0,
                          montoRestante:
                            deudas.find((d) => d.id === deudaEditando.id)
                              ?.montoRestante || 0,
                          estado:
                            deudas.find((d) => d.id === deudaEditando.id)?.estado ||
                            "pendiente",
                        });
                      }
                    }}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                  <label
                    htmlFor="marcarPagada"
                    className="text-sm text-slate-300 cursor-pointer select-none"
                  >
                    Marcar como pagada completamente
                  </label>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={actualizarDeuda}
                    disabled={guardando}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {guardando ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  {deudaEditando.estado !== "pagada" && (
                    <button
                      onClick={() => {
                        handleRegistrarPago(deudaEditando);
                        cerrarModalEditar();
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                    >
                      Registrar Pago
                    </button>
                  )}
                  <button
                    onClick={cerrarModalEditar}
                    disabled={guardando}
                    className="flex-1 px-4 py-2 border border-slate-700 text-slate-100 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Deuda */}
      {modalNuevoAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalNuevo}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Nueva Deuda</h2>
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tipo de Deuda */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de deuda *
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setNuevaDeuda({
                          ...nuevaDeuda,
                          tipoDeuda: "miembro",
                          miembroId: "",
                          miembroNombre: "",
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        nuevaDeuda.tipoDeuda === "miembro"
                          ? "bg-purple-500 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      De un miembro
                    </button>
                    <button
                      onClick={() =>
                        setNuevaDeuda({
                          ...nuevaDeuda,
                          tipoDeuda: "general",
                          miembroId: "",
                          miembroNombre: "",
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        nuevaDeuda.tipoDeuda === "general"
                          ? "bg-purple-500 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      General
                    </button>
                  </div>
                </div>

                {/* Miembro (si es tipo miembro) */}
                {nuevaDeuda.tipoDeuda === "miembro" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Seleccionar miembro *
                    </label>
                    <select
                      value={nuevaDeuda.miembroId}
                      onChange={(e) =>
                        setNuevaDeuda({
                          ...nuevaDeuda,
                          miembroId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar miembro...</option>
                      {miembros.map((miembro) => (
                        <option key={miembro.id} value={miembro.id}>
                          {miembro.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nombre de deuda general (si es tipo general) */}
                {nuevaDeuda.tipoDeuda === "general" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      A quién se le debe dinero *
                    </label>
                    <input
                      type="text"
                      value={nuevaDeuda.miembroNombre}
                      onChange={(e) =>
                        setNuevaDeuda({
                          ...nuevaDeuda,
                          miembroNombre: e.target.value,
                        })
                      }
                      placeholder="Ej: Cuerpo técnico, Jugadores, Proveedor X..."
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Concepto */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Concepto *
                  </label>
                  <select
                    value={nuevaDeuda.concepto}
                    onChange={(e) =>
                      setNuevaDeuda({
                        ...nuevaDeuda,
                        concepto: e.target.value,
                        conceptoPersonalizado:
                          e.target.value === "otro"
                            ? nuevaDeuda.conceptoPersonalizado
                            : "",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {CONCEPTOS.slice(1).map((concepto) => (
                      <option key={concepto} value={concepto}>
                        {concepto}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Concepto Personalizado (si selecciona "otro") */}
                {nuevaDeuda.concepto === "otro" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Especificar concepto *
                    </label>
                    <input
                      type="text"
                      value={nuevaDeuda.conceptoPersonalizado}
                      onChange={(e) =>
                        setNuevaDeuda({
                          ...nuevaDeuda,
                          conceptoPersonalizado: e.target.value,
                        })
                      }
                      placeholder="Ej: mantenimiento, servicios, etc."
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Monto (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      nuevaDeuda.montoOriginal
                        ? nuevaDeuda.montoOriginal.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setNuevaDeuda({
                        ...nuevaDeuda,
                        montoOriginal: numero,
                      });
                    }}
                    placeholder="Ingresa el monto"
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={nuevaDeuda.notas}
                    onChange={(e) =>
                      setNuevaDeuda({
                        ...nuevaDeuda,
                        notas: e.target.value,
                      })
                    }
                    placeholder="Notas adicionales sobre la deuda..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={crearDeuda}
                    disabled={guardando}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {guardando ? "Registrando..." : "Registrar Deuda"}
                  </button>
                  <button
                    onClick={cerrarModalNuevo}
                    disabled={guardando}
                    className="flex-1 px-4 py-2 border border-slate-700 text-slate-100 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {modalPagoAbierto && deudaPago && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalPago}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Registrar Pago</h2>
                <button
                  type="button"
                  onClick={cerrarModalPago}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Información de la deuda */}
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 space-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Miembro</p>
                    <p className="text-sm font-semibold text-slate-100">
                      {deudaPago.miembroNombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Concepto</p>
                    <p className="text-sm font-semibold text-slate-100">
                      {deudaPago.concepto}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400">Original</p>
                      <p className="text-sm font-semibold text-purple-300">
                        ₲{deudaPago.montoOriginal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Pagado</p>
                      <p className="text-sm font-semibold text-emerald-300">
                        ₲{deudaPago.montoPagado.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Restante</p>
                      <p className="text-sm font-semibold text-amber-300">
                        ₲{deudaPago.montoRestante.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Monto del pago */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Monto del Pago (₲) *
                  </label>
                  <input
                    type="text"
                    value={montoPago ? montoPago.toLocaleString("es-PY") : ""}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setMontoPago(numero);
                    }}
                    placeholder="Ingresa el monto a pagar"
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Máximo: ₲{deudaPago.montoRestante.toLocaleString()}
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={notasPago}
                    onChange={(e) => setNotasPago(e.target.value)}
                    placeholder="Notas sobre el pago..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={registrarPago}
                    disabled={guardando || !montoPago || montoPago <= 0}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {guardando ? "Registrando..." : "Registrar Pago"}
                  </button>
                  <button
                    onClick={cerrarModalPago}
                    disabled={guardando}
                    className="flex-1 px-4 py-2 border border-slate-700 text-slate-100 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
