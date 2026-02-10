"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import {
  FiArrowLeft,
  FiDownload,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiFileText,
  FiCopy,
  FiCheck,
  FiEdit,
  FiPlus,
  FiX,
  FiSave,
  FiTrendingDown,
  FiSearch,
  FiTrash,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Colecta {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  estado: string;
  createdAt: string;
  fechaCierre?: string | null;
}

interface Aporte {
  id: string;
  miembroNombre: string;
  cantidad: number;
  estado: string;
  metodoPago: string;
  fecha: string;
}

interface Gasto {
  id: string;
  concepto: string;
  categoria: string;
  cantidad: number;
  quienPago: string;
  fecha: string;
}

interface Miembro {
  id: string;
  nombre: string;
}

export default function DetalleColecta() {
  const params = useParams();
  const router = useRouter();
  const colectaId = params.id as string;

  const [colecta, setColecta] = useState<Colecta | null>(null);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [activeTab, setActiveTab] = useState<"aportes" | "gastos">("aportes");
  const [modalAporteAbierto, setModalAporteAbierto] = useState(false);
  const [guardandoAporte, setGuardandoAporte] = useState(false);
  const [busquedaMiembroAporte, setBusquedaMiembroAporte] = useState("");
  const [modalEditarAporte, setModalEditarAporte] = useState(false);
  const [mostrarConfirmAporte, setMostrarConfirmAporte] = useState(false);
  const [aporteEliminarId, setAporteEliminarId] = useState<string | null>(null);
  const [aporteEditando, setAporteEditando] = useState<any>(null);

  // Datos de edición
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    objetivo: 0,
    estado: "activa",
    fechaCierre: "",
  });

  // Datos del nuevo aporte
  const [nuevoAporte, setNuevoAporte] = useState({
    miembroId: "",
    cantidad: 0,
    estado: "aportado",
    metodoPago: "efectivo",
    notas: "",
  });

  // Modal y datos del nuevo gasto
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [busquedaMiembroGasto, setBusquedaMiembroGasto] = useState("");
  const [nuevoGasto, setNuevoGasto] = useState({
    concepto: "",
    cantidad: 0,
    categoria: "",
    categoriaCustom: "",
    quienPagoId: "",
    notas: "",
  });
  const [modalEditarGasto, setModalEditarGasto] = useState(false);
  const [mostrarConfirmGasto, setMostrarConfirmGasto] = useState(false);
  const [gastoEliminarId, setGastoEliminarId] = useState<string | null>(null);
  const [gastoEditando, setGastoEditando] = useState<any>(null);
  const [categoriaCustomGasto, setCategoriaCustomGasto] = useState("");

  const formatCurrencyShort = (value: number) => {
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

  const formatCurrencyFull = (value: number) => {
    const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Gs. ${formatted}`;
  };

  useEffect(() => {
    cargarDatos();
    cargarMiembros();
  }, [colectaId]);

  const cargarMiembros = async () => {
    try {
      const res = await fetch("/api/miembros");
      if (res.ok) {
        const data = await res.json();
        setMiembros(data.filter((m: any) => m.estado === "activo"));
      }
    } catch (error) {
      console.error("Error cargando miembros:", error);
    }
  };

  const cargarDatos = async () => {
    try {
      const [colectaRes, aportesRes, gastosRes] = await Promise.all([
        fetch(`/api/colectas/${colectaId}`),
        fetch(`/api/colectas/${colectaId}/aportes`),
        fetch(`/api/gastos?colectaId=${colectaId}`),
      ]);

      if (colectaRes.ok) {
        const colectaData = await colectaRes.json();
        setColecta(colectaData);
        setFormData({
          nombre: colectaData.nombre || "",
          descripcion: colectaData.descripcion || "",
          objetivo: colectaData.objetivo || 0,
          estado: colectaData.estado || "activa",
          fechaCierre: colectaData.fechaCierre
            ? new Date(colectaData.fechaCierre).toISOString().split("T")[0]
            : "",
        });
      }

      if (aportesRes.ok) {
        const data = await aportesRes.json();
        const aportesTransformados = data.map((a: any) => ({
          id: a.id,
          miembroId: a.miembroId,
          miembroNombre: a.miembroNombre || a.miembro?.nombre || "N/A",
          cantidad: a.cantidad,
          estado: a.estado || "aportado",
          metodoPago: a.metodoPago || "N/A",
          notas: a.notas || "",
          fecha: a.fecha
            ? new Date(a.fecha).toLocaleDateString()
            : new Date(a.createdAt).toLocaleDateString(),
        }));
        setAportes(aportesTransformados);
      }

      if (gastosRes.ok) {
        const data = await gastosRes.json();
        const gastosTransformados = data
          .filter((g: any) => g.colectaId === colectaId)
          .map((g: any) => ({
            id: g.id,
            concepto: g.concepto || g.descripcion || "",
            categoria: g.categoria || "Otros",
            cantidad: g.cantidad,
            quienPago: g.quienPagoNombre || g.quienPago?.nombre || "N/A",
            quienPagoId: g.quienPagoId || "",
            notas: g.notas || "",
            fecha: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "N/A",
          }));
        setGastos(gastosTransformados);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas
  const estadisticas = useMemo(() => {
    const totalAportado = aportes.reduce((sum, a) => sum + a.cantidad, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.cantidad, 0);
    const promedio = aportes.length > 0 ? totalAportado / aportes.length : 0;
    const porcentaje = colecta ? Math.round((totalAportado / colecta.objetivo) * 100) : 0;
    const aportadosCount = aportes.filter((a) => a.estado === "aportado").length;
    const saldo = totalAportado - totalGastos;

    return {
      totalAportado,
      totalGastos,
      saldo,
      cantidad: aportes.length,
      promedio,
      porcentaje,
      aportadosCount,
    };
  }, [aportes, gastos, colecta]);

  // Filtrar miembros para los modales
  const miembrosFiltradosAporte = useMemo(() => {
    return miembros.filter((m) =>
      m.nombre.toLowerCase().includes(busquedaMiembroAporte.toLowerCase()),
    );
  }, [miembros, busquedaMiembroAporte]);

  const miembrosFiltradosGasto = useMemo(() => {
    return miembros.filter((m) =>
      m.nombre.toLowerCase().includes(busquedaMiembroGasto.toLowerCase()),
    );
  }, [miembros, busquedaMiembroGasto]);

  const guardarCambios = async () => {
    try {
      const res = await fetch(`/api/colectas/${colectaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Colecta actualizada correctamente");
        setEditando(false);
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al actualizar la colecta");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar los cambios");
    }
  };

  const cancelarEdicion = () => {
    if (!colecta) return;
    setFormData({
      nombre: colecta.nombre || "",
      descripcion: colecta.descripcion || "",
      objetivo: colecta.objetivo || 0,
      estado: colecta.estado || "activa",
      fechaCierre: colecta.fechaCierre
        ? new Date(colecta.fechaCierre).toISOString().split("T")[0]
        : "",
    });
    setEditando(false);
  };

  const crearAporte = async () => {
    // Validación
    if (!nuevoAporte.miembroId) {
      toast.error("Debes seleccionar un miembro");
      return;
    }
    if (!nuevoAporte.cantidad || nuevoAporte.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    setGuardandoAporte(true);
    try {
      const res = await fetch("/api/colectas/aportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoAporte,
          colectaId,
        }),
      });

      if (res.ok) {
        toast.success("Aporte registrado correctamente");
        setModalAporteAbierto(false);
        setNuevoAporte({
          miembroId: "",
          cantidad: 0,
          estado: "aportado",
          metodoPago: "",
          notas: "",
        });
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al registrar el aporte");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar el aporte");
    } finally {
      setGuardandoAporte(false);
    }
  };

  const cerrarModalAporte = () => {
    setModalAporteAbierto(false);
    setBusquedaMiembroAporte("");
    setNuevoAporte({
      miembroId: "",
      cantidad: 0,
      estado: "aportado",
      metodoPago: "",
      notas: "",
    });
  };

  const handleEditarAporte = (aporte: any) => {
    setAporteEditando(aporte);
    setModalEditarAporte(true);
  };

  const actualizarAporte = async () => {
    if (!aporteEditando) return;

    // Validación
    if (!aporteEditando.miembroId) {
      toast.error("Debes seleccionar un miembro");
      return;
    }
    if (!aporteEditando.cantidad || aporteEditando.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    setGuardandoAporte(true);
    try {
      const res = await fetch(`/api/colectas/aportes/${aporteEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miembroId: aporteEditando.miembroId,
          cantidad: aporteEditando.cantidad,
          estado: aporteEditando.estado,
          metodoPago: aporteEditando.metodoPago,
          notas: aporteEditando.notas,
        }),
      });

      if (res.ok) {
        toast.success("Aporte actualizado correctamente");
        setModalEditarAporte(false);
        setAporteEditando(null);
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al actualizar el aporte");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el aporte");
    } finally {
      setGuardandoAporte(false);
    }
  };

  const cerrarModalEditarAporte = () => {
    setModalEditarAporte(false);
    setAporteEditando(null);
    setBusquedaMiembroAporte("");
  };

  const handleEliminarAporte = async (aporteId: string) => {
    setAporteEliminarId(aporteId);
    setMostrarConfirmAporte(true);
  };

  const confirmarEliminarAporte = async () => {
    if (!aporteEliminarId) return;

    try {
      const res = await fetch(`/api/colectas/aportes/${aporteEliminarId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Aporte eliminado correctamente");
        setMostrarConfirmAporte(false);
        setAporteEliminarId(null);
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al eliminar el aporte");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el aporte");
    }
  };

  const handleEditarGasto = (gasto: any) => {
    // Si la categoría no es una de las predefinidas, es personalizada
    const categoriasPredefinidas = [
      "cancha",
      "arbitros",
      "jugadores",
      "equipamiento",
      "viajes",
      "alimentacion",
      "otros",
    ];
    const esCustom = !categoriasPredefinidas.includes(gasto.categoria.toLowerCase());

    setGastoEditando({
      ...gasto,
      categoria: esCustom ? "otros" : gasto.categoria,
    });

    if (esCustom) {
      setCategoriaCustomGasto(gasto.categoria);
    }

    setModalEditarGasto(true);
  };

  const handleEliminarGasto = (gastoId: string) => {
    setGastoEliminarId(gastoId);
    setMostrarConfirmGasto(true);
  };

  const confirmarEliminarGasto = async () => {
    if (!gastoEliminarId) return;

    try {
      const res = await fetch(`/api/gastos/${gastoEliminarId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Gasto eliminado correctamente");
        setMostrarConfirmGasto(false);
        setGastoEliminarId(null);
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al eliminar el gasto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el gasto");
    }
  };

  const actualizarGasto = async () => {
    if (!gastoEditando) return;

    // Validación
    if (!gastoEditando.concepto.trim()) {
      toast.error("El concepto es requerido");
      return;
    }
    if (gastoEditando.categoria === "otros" && !categoriaCustomGasto.trim()) {
      toast.error("Debes especificar el tipo de gasto");
      return;
    }

    setGuardandoGasto(true);
    try {
      const res = await fetch(`/api/gastos/${gastoEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: gastoEditando.concepto,
          cantidad: gastoEditando.cantidad,
          categoria:
            gastoEditando.categoria === "otros"
              ? categoriaCustomGasto
              : gastoEditando.categoria,
          quienPagoId: gastoEditando.quienPagoId,
          notas: gastoEditando.notas,
        }),
      });

      if (res.ok) {
        toast.success("Gasto actualizado correctamente");
        setModalEditarGasto(false);
        setGastoEditando(null);
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al actualizar el gasto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el gasto");
    } finally {
      setGuardandoGasto(false);
    }
  };

  const cerrarModalEditarGasto = () => {
    setModalEditarGasto(false);
    setGastoEditando(null);
    setBusquedaMiembroGasto("");
    setCategoriaCustomGasto("");
  };

  const crearGasto = async () => {
    // Validación
    if (!nuevoGasto.concepto.trim()) {
      toast.error("Debes ingresar un concepto");
      return;
    }
    if (!nuevoGasto.cantidad || nuevoGasto.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (!nuevoGasto.categoria) {
      toast.error("Debes seleccionar una categoría");
      return;
    }
    if (nuevoGasto.categoria === "otros" && !nuevoGasto.categoriaCustom.trim()) {
      toast.error("Debes especificar el tipo de gasto");
      return;
    }
    if (!nuevoGasto.quienPagoId) {
      toast.error("Debes seleccionar quién pagó");
      return;
    }

    setGuardandoGasto(true);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: nuevoGasto.concepto,
          cantidad: nuevoGasto.cantidad,
          categoria:
            nuevoGasto.categoria === "otros"
              ? nuevoGasto.categoriaCustom
              : nuevoGasto.categoria,
          quienPagoId: nuevoGasto.quienPagoId,
          notas: nuevoGasto.notas,
          colectaId,
          tipoGasto: "colecta",
        }),
      });

      if (res.ok) {
        toast.success("Gasto registrado correctamente");
        setModalGastoAbierto(false);
        setNuevoGasto({
          concepto: "",
          cantidad: 0,
          categoria: "",
          categoriaCustom: "",
          quienPagoId: "",
          notas: "",
        });
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al registrar el gasto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar el gasto");
    } finally {
      setGuardandoGasto(false);
    }
  };

  const cerrarModalGasto = () => {
    setModalGastoAbierto(false);
    setBusquedaMiembroGasto("");
    setNuevoGasto({
      concepto: "",
      cantidad: 0,
      categoria: "",
      categoriaCustom: "",
      quienPagoId: "",
      notas: "",
    });
  };

  const copiarLink = () => {
    const url = `${window.location.origin}/colectas/${colectaId}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const volverAtras = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/admin/colectas");
  };

  // Exportar a PDF
  const exportarPDF = () => {
    if (!colecta) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const fechaActual = new Date().toLocaleDateString("es-PY");

    // Portada
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(24);
    doc.text("CLUB FINANZAS", 105, 90, { align: "center" });
    doc.setFontSize(16);
    doc.text("Reporte de Colecta", 105, 110, { align: "center" });
    doc.setFontSize(12);
    doc.text(fechaActual, 105, 128, { align: "center" });

    // Pagina 2 - Resumen
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(15, 23, 42);

    doc.setFontSize(18);
    doc.text("RESUMEN DE COLECTA", 20, 20);

    doc.setFontSize(11);
    let y = 35;
    doc.setFont("helvetica", "bold");
    doc.text("Colecta:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(colecta.nombre, 60, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Descripcion:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(colecta.descripcion || "-", 60, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Estado:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(colecta.estado, 60, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Creacion:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(colecta.createdAt).toLocaleDateString("es-PY"), 60, y);
    y += 15;

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: [
        ["Objetivo", formatCurrencyFull(colecta.objetivo)],
        ["Total aportado", formatCurrencyFull(estadisticas.totalAportado)],
        ["Total gastos", formatCurrencyFull(estadisticas.totalGastos)],
        ["Saldo", formatCurrencyFull(estadisticas.saldo)],
        ["Avance", `${Math.min(estadisticas.porcentaje, 100)}%`],
        ["Aportes", String(estadisticas.cantidad)],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
      styles: { fontSize: 11 },
    });

    // Pagina 3 - Aportes
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("APORTES", 20, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Miembro", "Monto", "Metodo", "Estado", "Fecha"]],
      body: aportes.map((a) => [
        a.miembroNombre,
        formatCurrencyFull(a.cantidad),
        a.metodoPago,
        a.estado,
        a.fecha,
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
      styles: { fontSize: 11 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Pagina 4 - Gastos
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("GASTOS", 20, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Concepto", "Categoria", "Monto", "Quien pago", "Fecha"]],
      body: gastos.map((g) => [
        g.concepto,
        g.categoria,
        formatCurrencyFull(g.cantidad),
        g.quienPago,
        g.fecha,
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 11 },
      styles: { fontSize: 11 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Pie de pagina
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Pagina ${i} de ${pageCount} - Club Finanzas - ${fechaActual}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    doc.save(
      `colecta_${colecta.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const columns: TableColumn[] = [
    { key: "miembroNombre", label: "Miembro" },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (value) => (
        <span className="font-semibold text-sky-300">
          {formatCurrencyShort(value as number)}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            value === "aportado"
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-amber-500/20 text-amber-200"
          }`}
        >
          {value}
        </span>
      ),
    },
    { key: "metodoPago", label: "Método de Pago" },
    { key: "fecha", label: "Fecha" },
    {
      key: "acciones",
      label: "Acciones",
      render: (_, row: any) => (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleEditarAporte(row)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 rounded-lg transition cursor-pointer"
            title="Editar aporte"
          >
            <FiEdit size={16} />
            Editar
          </button>
          <button
            onClick={() => handleEliminarAporte(row.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg transition cursor-pointer"
            title="Eliminar aporte"
          >
            <FiTrash size={16} />
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  const gastosColumns: TableColumn[] = [
    { key: "concepto", label: "Concepto" },
    { key: "categoria", label: "Categoría" },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (value) => (
        <span className="font-semibold text-rose-300">
          -{formatCurrencyShort(value as number)}
        </span>
      ),
    },
    { key: "quienPago", label: "Quien Pagó" },
    { key: "fecha", label: "Fecha" },
    {
      key: "acciones",
      label: "Acciones",
      render: (_, row: any) => (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleEditarGasto(row)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 rounded-lg transition cursor-pointer"
            title="Editar gasto"
          >
            <FiEdit size={16} />
            Editar
          </button>
          <button
            onClick={() => handleEliminarGasto(row.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg transition cursor-pointer"
            title="Eliminar gasto"
          >
            <FiTrash size={16} />
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Cargando informacion de la colecta...</p>
      </div>
    );
  }

  if (!colecta) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={volverAtras}
          className="flex items-center gap-2 text-sky-300 hover:text-sky-200 font-medium"
        >
          <FiArrowLeft /> Volver a Colectas
        </button>
        <div className="text-center py-12">
          <p className="text-rose-300">Colecta no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <button
              type="button"
              onClick={volverAtras}
              className="flex items-center gap-2 text-sky-300 hover:text-sky-200 font-medium mb-3"
            >
              <FiArrowLeft /> Volver a Colectas
            </button>
            {!editando ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">
                  {colecta.nombre}
                </h1>
                <p className="text-sm text-slate-400 mt-1">{colecta.descripcion}</p>
              </>
            ) : (
              <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full text-2xl font-semibold text-slate-100 bg-slate-900 border-b border-slate-700 focus:border-sky-500 outline-none pb-1"
                  placeholder="Nombre de la colecta"
                />
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="w-full text-sm text-slate-200 bg-slate-900 border border-slate-700 rounded-lg p-2 focus:border-sky-500 outline-none"
                  placeholder="Descripcion"
                  rows={2}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {!editando ? (
              <>
                <button
                  onClick={() => setEditando(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition"
                >
                  <FiEdit size={18} /> Editar
                </button>
                <button
                  onClick={copiarLink}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition"
                >
                  {copiado ? (
                    <>
                      <FiCheck size={18} /> Copiado
                    </>
                  ) : (
                    <>
                      <FiCopy size={18} /> Copiar Link
                    </>
                  )}
                </button>
                <button
                  onClick={exportarPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition"
                >
                  <FiDownload size={18} /> PDF
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={guardarCambios}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition"
                >
                  <FiSave size={18} /> Guardar
                </button>
                <button
                  onClick={cancelarEdicion}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition"
                >
                  <FiX size={18} /> Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Formulario de edición */}
      {editando && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-4 text-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Objetivo (₲)
              </label>
              <input
                type="number"
                value={formData.objetivo}
                onChange={(e) =>
                  setFormData({ ...formData, objetivo: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="activa">Activa</option>
                <option value="cerrada">Cerrada</option>
                <option value="completada">Completada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha de Cierre (opcional)
              </label>
              <input
                type="date"
                value={formData.fechaCierre}
                onChange={(e) =>
                  setFormData({ ...formData, fechaCierre: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Estado Badge */}
      {!editando && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
              colecta.estado === "activa"
                ? "bg-emerald-500/20 text-emerald-200"
                : colecta.estado === "cerrada"
                  ? "bg-blue-900/30 text-blue-100"
                  : "bg-blue-900/30 text-blue-100"
            }`}
          >
            {colecta.estado}
          </span>
          {colecta.fechaCierre && (
            <span className="text-xs text-white font-medium">
              Cierre: {new Date(colecta.fechaCierre).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Objetivo</p>
              <p className="text-xl sm:text-2xl font-semibold text-sky-300 mt-1">
                {formatCurrencyShort(colecta.objetivo)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-sky-500/10 rounded-full">
              <FiDollarSign className="text-sky-300" size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Aportado</p>
              <p className="text-xl sm:text-2xl font-semibold text-emerald-300 mt-1">
                {formatCurrencyShort(estadisticas.totalAportado)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-full">
              <FiTrendingUp className="text-emerald-300" size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Gastado</p>
              <p className="text-xl sm:text-2xl font-semibold text-rose-300 mt-1">
                {formatCurrencyShort(estadisticas.totalGastos)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-rose-500/10 rounded-full">
              <FiTrendingDown className="text-rose-300" size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Saldo</p>
              <p
                className={`text-xl sm:text-2xl font-semibold mt-1 ${estadisticas.saldo >= 0 ? "text-emerald-300" : "text-amber-300"}`}
              >
                {formatCurrencyShort(estadisticas.saldo)}
              </p>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-full ${estadisticas.saldo >= 0 ? "bg-emerald-500/10" : "bg-amber-500/10"}`}
            >
              <FiDollarSign
                className={
                  estadisticas.saldo >= 0 ? "text-emerald-300" : "text-amber-300"
                }
                size={20}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avance</p>
              <p className="text-xl sm:text-2xl font-semibold text-violet-300 mt-1">
                {Math.min(estadisticas.porcentaje, 100)}%
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div
                  className="bg-violet-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(estadisticas.porcentaje, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 px-4 sm:px-6">
          <div className="flex gap-4 sm:gap-6">
            <button
              onClick={() => setActiveTab("aportes")}
              className={`py-4 px-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === "aportes"
                  ? "text-sky-300 border-sky-400"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              Aportes ({estadisticas.cantidad})
            </button>
            <button
              onClick={() => setActiveTab("gastos")}
              className={`py-4 px-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === "gastos"
                  ? "text-sky-300 border-sky-400"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              Gastos ({gastos.length})
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "aportes" ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                  Aportes de esta Colecta
                </h2>
                <button
                  type="button"
                  onClick={() => setModalAporteAbierto(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition text-sm"
                >
                  <FiPlus size={16} /> Registrar Aporte
                </button>
              </div>
              <AdminTable
                columns={columns}
                data={aportes}
                loading={loading}
                emptyMessage="No hay aportes en esta colecta"
                itemsPerPage={10}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                  Gastos de esta Colecta
                </h2>
                <button
                  type="button"
                  onClick={() => setModalGastoAbierto(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition text-sm"
                >
                  <FiPlus size={16} /> Registrar Gasto
                </button>
              </div>
              <AdminTable
                columns={gastosColumns}
                data={gastos}
                loading={loading}
                emptyMessage="No hay gastos registrados en esta colecta"
                itemsPerPage={10}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal Registrar Aporte */}
      {modalAporteAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalAporte}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">
                  Registrar Nuevo Aporte
                </h2>
                <button
                  type="button"
                  onClick={cerrarModalAporte}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Miembro */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Miembro *
                  </label>
                  <div className="relative mb-2">
                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={busquedaMiembroAporte}
                      onChange={(e) => setBusquedaMiembroAporte(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Buscar miembro..."
                    />
                  </div>
                  <select
                    value={nuevoAporte.miembroId}
                    onChange={(e) =>
                      setNuevoAporte({ ...nuevoAporte, miembroId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                    size={5}
                  >
                    <option value="">Selecciona un miembro</option>
                    {miembrosFiltradosAporte.map((miembro) => (
                      <option key={miembro.id} value={miembro.id}>
                        {miembro.nombre}
                      </option>
                    ))}
                  </select>
                  {busquedaMiembroAporte && miembrosFiltradosAporte.length === 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      No se encontraron miembros
                    </p>
                  )}
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Cantidad (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      nuevoAporte.cantidad
                        ? nuevoAporte.cantidad.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setNuevoAporte({
                        ...nuevoAporte,
                        cantidad: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 20000, 50000, 100000, 200000, 500000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setNuevoAporte({ ...nuevoAporte, cantidad: monto })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={nuevoAporte.estado}
                    onChange={(e) =>
                      setNuevoAporte({ ...nuevoAporte, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="aportado">Aportado</option>
                    <option value="comprometido">Comprometido</option>
                  </select>
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={nuevoAporte.metodoPago}
                    onChange={(e) =>
                      setNuevoAporte({ ...nuevoAporte, metodoPago: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un método</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={nuevoAporte.notas}
                    onChange={(e) =>
                      setNuevoAporte({ ...nuevoAporte, notas: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Escribe alguna nota adicional..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalAporte}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardandoAporte}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crearAporte}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition disabled:bg-slate-700"
                  disabled={guardandoAporte}
                >
                  {guardandoAporte ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto */}
      {modalGastoAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalGasto}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">
                  Registrar Nuevo Gasto
                </h2>
                <button
                  type="button"
                  onClick={cerrarModalGasto}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Concepto */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    value={nuevoGasto.concepto}
                    onChange={(e) =>
                      setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Ej: Alquiler de cancha"
                    required
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Cantidad (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      nuevoGasto.cantidad
                        ? nuevoGasto.cantidad.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setNuevoGasto({
                        ...nuevoGasto,
                        cantidad: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 20000, 50000, 100000, 200000, 500000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => setNuevoGasto({ ...nuevoGasto, cantidad: monto })}
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={nuevoGasto.categoria}
                    onChange={(e) =>
                      setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="cancha">Cancha</option>
                    <option value="arbitros">Árbitros</option>
                    <option value="jugadores">Jugadores</option>
                    <option value="equipamiento">Equipamiento</option>
                    <option value="viajes">Viajes</option>
                    <option value="alimentacion">Alimentación</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Campo personalizado para "Otros" */}
                {nuevoGasto.categoria === "otros" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Especificar tipo de gasto *
                    </label>
                    <input
                      type="text"
                      value={nuevoGasto.categoriaCustom}
                      onChange={(e) =>
                        setNuevoGasto({ ...nuevoGasto, categoriaCustom: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="ej: Decoración, Logística, etc."
                      required
                    />
                  </div>
                )}

                {/* Quién Pagó */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Quién Pagó *
                  </label>
                  <div className="relative mb-2">
                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={busquedaMiembroGasto}
                      onChange={(e) => setBusquedaMiembroGasto(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Buscar miembro..."
                    />
                  </div>
                  <select
                    value={nuevoGasto.quienPagoId}
                    onChange={(e) =>
                      setNuevoGasto({ ...nuevoGasto, quienPagoId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                    size={5}
                  >
                    <option value="">Selecciona un miembro</option>
                    {miembrosFiltradosGasto.map((miembro) => (
                      <option key={miembro.id} value={miembro.id}>
                        {miembro.nombre}
                      </option>
                    ))}
                  </select>
                  {busquedaMiembroGasto && miembrosFiltradosGasto.length === 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      No se encontraron miembros
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={nuevoGasto.notas}
                    onChange={(e) =>
                      setNuevoGasto({ ...nuevoGasto, notas: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Agrega detalles adicionales..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalGasto}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardandoGasto}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crearGasto}
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition disabled:bg-slate-700"
                  disabled={guardandoGasto}
                >
                  {guardandoGasto ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Aporte */}
      {modalEditarAporte && aporteEditando && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalEditarAporte}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Editar Aporte</h2>
                <button
                  type="button"
                  onClick={cerrarModalEditarAporte}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Miembro */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Miembro *
                  </label>
                  <div className="relative mb-2">
                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={busquedaMiembroAporte}
                      onChange={(e) => setBusquedaMiembroAporte(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Buscar miembro..."
                    />
                  </div>
                  <select
                    value={aporteEditando.miembroId}
                    onChange={(e) =>
                      setAporteEditando({ ...aporteEditando, miembroId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                    size={5}
                  >
                    <option value="">Selecciona un miembro</option>
                    {miembrosFiltradosAporte.map((miembro) => (
                      <option key={miembro.id} value={miembro.id}>
                        {miembro.nombre}
                      </option>
                    ))}
                  </select>
                  {busquedaMiembroAporte && miembrosFiltradosAporte.length === 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      No se encontraron miembros
                    </p>
                  )}
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Cantidad (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      aporteEditando.cantidad
                        ? aporteEditando.cantidad.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setAporteEditando({
                        ...aporteEditando,
                        cantidad: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 20000, 50000, 100000, 200000, 500000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setAporteEditando({ ...aporteEditando, cantidad: monto })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={aporteEditando.estado}
                    onChange={(e) =>
                      setAporteEditando({ ...aporteEditando, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="aportado">Aportado</option>
                    <option value="comprometido">Comprometido</option>
                  </select>
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={aporteEditando.metodoPago || ""}
                    onChange={(e) =>
                      setAporteEditando({ ...aporteEditando, metodoPago: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un método</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={aporteEditando.notas || ""}
                    onChange={(e) =>
                      setAporteEditando({ ...aporteEditando, notas: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Escribe alguna nota adicional..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalEditarAporte}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardandoAporte}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={actualizarAporte}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:bg-slate-700"
                  disabled={guardandoAporte}
                >
                  {guardandoAporte ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {mostrarConfirmAporte && aporteEliminarId && (
        <ConfirmDialog
          title="Eliminar Aporte"
          message="¿Estás seguro de eliminar este aporte?"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminarAporte}
          onCancel={() => {
            setMostrarConfirmAporte(false);
            setAporteEliminarId(null);
          }}
          isDangerous={true}
        />
      )}

      {/* Modal Editar Gasto */}
      {modalEditarGasto && gastoEditando && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalEditarGasto}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Editar Gasto</h2>
                <button
                  type="button"
                  onClick={cerrarModalEditarGasto}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Concepto */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    value={gastoEditando.concepto}
                    onChange={(e) =>
                      setGastoEditando({ ...gastoEditando, concepto: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="¿Qué se pagó?"
                    required
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Cantidad (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      gastoEditando.cantidad
                        ? gastoEditando.cantidad.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setGastoEditando({
                        ...gastoEditando,
                        cantidad: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 20000, 50000, 100000, 200000, 500000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setGastoEditando({ ...gastoEditando, cantidad: monto })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={gastoEditando.categoria}
                    onChange={(e) =>
                      setGastoEditando({ ...gastoEditando, categoria: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="cancha">Cancha</option>
                    <option value="arbitros">Árbitros</option>
                    <option value="jugadores">Jugadores</option>
                    <option value="equipamiento">Equipamiento</option>
                    <option value="viajes">Viajes</option>
                    <option value="alimentacion">Alimentación</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Campo personalizado para "Otros" */}
                {gastoEditando.categoria === "otros" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Especificar tipo de gasto *
                    </label>
                    <input
                      type="text"
                      value={categoriaCustomGasto}
                      onChange={(e) => setCategoriaCustomGasto(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="ej: Decoración, Logística, etc."
                      required
                    />
                  </div>
                )}

                {/* Quién Pagó */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Quién Pagó *
                  </label>
                  <div className="relative mb-2">
                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={busquedaMiembroGasto}
                      onChange={(e) => setBusquedaMiembroGasto(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Buscar miembro..."
                    />
                  </div>
                  <select
                    value={gastoEditando.quienPagoId}
                    onChange={(e) =>
                      setGastoEditando({ ...gastoEditando, quienPagoId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                    size={5}
                  >
                    <option value="">Selecciona un miembro</option>
                    {miembrosFiltradosGasto.map((miembro) => (
                      <option key={miembro.id} value={miembro.id}>
                        {miembro.nombre}
                      </option>
                    ))}
                  </select>
                  {busquedaMiembroGasto && miembrosFiltradosGasto.length === 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      No se encontraron miembros
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={gastoEditando.notas || ""}
                    onChange={(e) =>
                      setGastoEditando({ ...gastoEditando, notas: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Agrega detalles adicionales..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalEditarGasto}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardandoGasto}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={actualizarGasto}
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition disabled:bg-slate-700"
                  disabled={guardandoGasto}
                >
                  {guardandoGasto ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmGasto && gastoEliminarId && (
        <ConfirmDialog
          title="Eliminar Gasto"
          message="¿Estás seguro de eliminar este gasto?"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminarGasto}
          onCancel={() => {
            setMostrarConfirmGasto(false);
            setGastoEliminarId(null);
          }}
          isDangerous={true}
        />
      )}
    </div>
  );
}
