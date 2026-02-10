"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import {
  FiPlus,
  FiDownload,
  FiFilter,
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiFileText,
  FiFile,
  FiX,
  FiSave,
} from "react-icons/fi";
import { SearchBar } from "@/components/SearchBar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Ingreso {
  id: string;
  concepto: string;
  cantidad: number;
  fuente: string;
  responsable: string;
  miembroId?: string;
  fecha: string;
}

const FUENTE_MERCH_OLD = "Merchandising";
const FUENTE_MERCH_NEW = "Productos del club";

const FUENTES = [
  "Todas",
  "Venta de Alimentos",
  "Eventos",
  "Rifas",
  "Patrocinios",
  FUENTE_MERCH_NEW,
  "Cuotas Sociales",
  "Otros",
];

const normalizarFuente = (fuente?: string) => {
  if (!fuente) return "Otros";
  return fuente === FUENTE_MERCH_OLD ? FUENTE_MERCH_NEW : fuente;
};

const getFuenteColor = (fuente: string) => {
  const colores: Record<string, string> = {
    "Venta de Alimentos": "bg-orange-500/20 text-orange-200",
    Eventos: "bg-purple-500/20 text-purple-200",
    Rifas: "bg-pink-500/20 text-pink-200",
    Patrocinios: "bg-blue-500/20 text-blue-200",
    [FUENTE_MERCH_NEW]: "bg-emerald-500/20 text-emerald-200",
    "Cuotas Sociales": "bg-indigo-500/20 text-indigo-200",
    Otros: "bg-slate-500/20 text-slate-200",
  };
  return colores[normalizarFuente(fuente)] || "bg-slate-500/20 text-slate-200";
};

export default function AdminIngresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fuenteFiltro, setFuenteFiltro] = useState("Todas");
  const [periodoFiltro, setPeriodoFiltro] = useState("Todos");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [ingresoEditando, setIngresoEditando] = useState<any>(null);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [ingresoEliminar, setIngresoEliminar] = useState<Ingreso | null>(null);
  const [formData, setFormData] = useState({
    concepto: "",
    cantidad: "",
    fuente: "",
    miembroId: "",
    fecha: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    cargarIngresos();
    cargarMiembros();
  }, []);

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

  const cargarIngresos = async () => {
    try {
      const res = await fetch("/api/ingresos");
      if (res.ok) {
        const data = await res.json();
        const ingresosTransformados = data.map((i: any) => ({
          id: i.id,
          concepto: i.concepto,
          cantidad: i.cantidad,
          fuente: normalizarFuente(i.fuente),
          responsable: i.miembro?.nombre || "N/A",
          miembroId: i.miembroId,
          fecha: i.fecha
            ? new Date(i.fecha).toLocaleDateString()
            : new Date(i.createdAt).toLocaleDateString(),
        }));
        setIngresos(ingresosTransformados);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ingreso: Ingreso) => {
    setIngresoEditando({
      ...ingreso,
      miembroId: ingreso.miembroId || "",
    });
    setModalEditarAbierto(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setIngresoEditando(null);
  };

  const handleChangeEditar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setIngresoEditando((prev: any) => ({ ...prev, [name]: value }));
  };

  const editarIngreso = async () => {
    if (!ingresoEditando.concepto.trim()) {
      toast.error("El concepto es requerido");
      return;
    }

    if (!ingresoEditando.cantidad || parseFloat(ingresoEditando.cantidad) <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (!ingresoEditando.fuente) {
      toast.error("La fuente es requerida");
      return;
    }

    // Guardar estado anterior para poder revertir si falla
    const ingresosAnteriores = [...ingresos];

    // Actualización optimista: actualizar UI inmediatamente
    setIngresos(
      ingresos.map((i) =>
        i.id === ingresoEditando.id
          ? {
              ...i,
              concepto: ingresoEditando.concepto,
              cantidad: parseFloat(ingresoEditando.cantidad) || ingresoEditando.cantidad,
              fuente: normalizarFuente(ingresoEditando.fuente),
              miembroId: ingresoEditando.miembroId,
              fecha: ingresoEditando.fecha
                ? new Date(ingresoEditando.fecha).toLocaleDateString()
                : i.fecha,
            }
          : i,
      ),
    );

    // Cerrar modal y mostrar feedback inmediato
    cerrarModalEditar();
    toast.success("Ingreso actualizado exitosamente");

    setGuardando(true);

    try {
      const res = await fetch(`/api/ingresos/${ingresoEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          concepto: ingresoEditando.concepto,
          cantidad: parseFloat(ingresoEditando.cantidad),
          fuente: ingresoEditando.fuente,
          miembroId: ingresoEditando.miembroId || null,
          fecha: ingresoEditando.fecha,
        }),
      });

      if (!res.ok) {
        // Si falla, revertir a estado anterior
        setIngresos(ingresosAnteriores);
        const data = await res.json();
        toast.error(
          data.error || "Error al actualizar el ingreso. Se revirtieron los cambios.",
        );
      }
    } catch (error) {
      // Si hay error de red, revertir cambios
      setIngresos(ingresosAnteriores);
      console.error("Error:", error);
      toast.error("Error de conexión. Se revirtieron los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (ingreso: Ingreso) => {
    setIngresoEliminar(ingreso);
    setMostrarConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!ingresoEliminar) return;

    try {
      const res = await fetch(`/api/ingresos/${ingresoEliminar.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIngresos(ingresos.filter((i) => i.id !== ingresoEliminar.id));
        toast.success("Ingreso eliminado correctamente");
        setMostrarConfirm(false);
        setIngresoEliminar(null);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el ingreso");
    }
  };

  const abrirModal = () => {
    setFormData({
      concepto: "",
      cantidad: "",
      fuente: "",
      miembroId: "",
      fecha: new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFormData({
      concepto: "",
      cantidad: "",
      fuente: "",
      miembroId: "",
      fecha: new Date().toISOString().split("T")[0],
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.concepto.trim()) {
      newErrors.concepto = "El concepto es requerido";
    }

    if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
      newErrors.cantidad = "La cantidad debe ser mayor a 0";
    }

    if (!formData.fuente) {
      newErrors.fuente = "La fuente es requerida";
    }

    if (!formData.fecha) {
      newErrors.fecha = "La fecha es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setGuardando(true);

    try {
      const res = await fetch("/api/ingresos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cantidad: parseFloat(formData.cantidad),
          miembroId: formData.miembroId || null,
        }),
      });

      if (res.ok) {
        toast.success("Ingreso creado exitosamente");
        cerrarModal();
        cargarIngresos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al crear el ingreso");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el ingreso");
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado y búsqueda
  const ingresosFiltrados = useMemo(() => {
    return ingresos.filter((ingreso) => {
      const matchQuery =
        searchQuery === "" ||
        ingreso.concepto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ingreso.responsable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ingreso.fuente.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFuente = fuenteFiltro === "Todas" || ingreso.fuente === fuenteFiltro;

      let matchPeriodo = true;
      if (periodoFiltro !== "Todos" && ingreso.fecha) {
        const fechaIngreso = new Date(ingreso.fecha);
        const hoy = new Date();

        if (periodoFiltro === "Este mes") {
          matchPeriodo =
            fechaIngreso.getMonth() === hoy.getMonth() &&
            fechaIngreso.getFullYear() === hoy.getFullYear();
        } else if (periodoFiltro === "Este trimestre") {
          const trimestreActual = Math.floor(hoy.getMonth() / 3);
          const trimestreIngreso = Math.floor(fechaIngreso.getMonth() / 3);
          matchPeriodo =
            trimestreIngreso === trimestreActual &&
            fechaIngreso.getFullYear() === hoy.getFullYear();
        } else if (periodoFiltro === "Este año") {
          matchPeriodo = fechaIngreso.getFullYear() === hoy.getFullYear();
        }
      }

      return matchQuery && matchFuente && matchPeriodo;
    });
  }, [ingresos, searchQuery, fuenteFiltro, periodoFiltro]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = ingresosFiltrados.reduce((sum, i) => sum + i.cantidad, 0);
    const promedio = ingresosFiltrados.length > 0 ? total / ingresosFiltrados.length : 0;

    const ingresosPorFuente = ingresosFiltrados.reduce(
      (acc, i) => {
        acc[i.fuente] = (acc[i.fuente] || 0) + i.cantidad;
        return acc;
      },
      {} as Record<string, number>,
    );

    const fuenteMasIngresos = Object.entries(ingresosPorFuente).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      total,
      cantidad: ingresosFiltrados.length,
      promedio,
      fuenteMasIngresos: fuenteMasIngresos ? fuenteMasIngresos[0] : "N/A",
    };
  }, [ingresosFiltrados]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ["Concepto", "Fuente", "Cantidad", "Responsable", "Fecha"];
    const rows = ingresosFiltrados.map((i) => [
      i.concepto,
      i.fuente,
      i.cantidad.toString(),
      i.responsable,
      i.fecha,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ingresos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape para más espacio

    doc.setFontSize(22);
    doc.setTextColor(22, 163, 74); // Verde para ingresos
    doc.text("Reporte de Ingresos", 15, 18);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 28);
    doc.text(`Total de ingresos: ${ingresosFiltrados.length}`, 95, 28);

    doc.text(`Monto total: $${estadisticas.total.toLocaleString()}`, 15, 35);
    doc.text(`Promedio por ingreso: $${estadisticas.promedio.toLocaleString()}`, 95, 35);

    autoTable(doc, {
      startY: 45,
      head: [["Concepto", "Fuente", "Cantidad", "Responsable", "Fecha"]],
      body: ingresosFiltrados.map((i) => [
        i.concepto,
        i.fuente,
        `$${i.cantidad.toLocaleString()}`,
        i.responsable,
        i.fecha,
      ]),
      styles: {
        fontSize: 11,
        cellPadding: 7,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
        lineWidth: 0.5,
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: 15, right: 15, top: 45 },
      didDrawPage: function (data: any) {
        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${data.pageNumber} de ${(doc as any).internal.pages.length - 1} - Club Finanzas`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 14,
          { align: "center" },
        );
        // Sugerencia para móviles
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(
          "💡 Para visualizar mejor en dispositivos móviles, prueba rotando la pantalla",
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" },
        );
      },
    });

    doc.save(`ingresos_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportMenu(false);
  };

  const columns: TableColumn[] = [
    { key: "concepto", label: "Concepto" },
    {
      key: "fuente",
      label: "Fuente",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getFuenteColor(value as string)}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (value) => (
        <span className="font-semibold text-emerald-300">
          {formatCurrencyShort(value as number)}
        </span>
      ),
    },
    { key: "responsable", label: "Responsable" },
    { key: "fecha", label: "Fecha" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gestión</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Gestionar Ingresos</h1>
            <p className="text-sm text-slate-400">
              Registra ingresos por ventas, eventos, rifas y más
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Dropdown de exportación */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 transition"
              >
                <FiDownload size={18} /> Exportar
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-lg shadow-lg border border-slate-700 py-1 z-20">
                    <button
                      onClick={exportarCSV}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition"
                    >
                      <FiFile size={16} className="text-emerald-400" />
                      <div className="text-left">
                        <div className="font-medium">Exportar CSV</div>
                        <div className="text-xs text-slate-400">
                          Para Excel y hojas de cálculo
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={exportarPDF}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition"
                    >
                      <FiFileText size={16} className="text-rose-400" />
                      <div className="text-left">
                        <div className="font-medium">Exportar PDF</div>
                        <div className="text-xs text-slate-400">Documento imprimible</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={abrirModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition flex-1 sm:flex-initial"
            >
              <FiPlus /> Nuevo Ingreso
            </button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Total Ingresado
          </p>
          <p className="mt-2 text-2xl font-semibold text-sky-300">
            {formatCurrencyShort(estadisticas.total)}
          </p>
          <p className="text-xs text-slate-500">En todas las fuentes</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            N° de Ingresos
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {estadisticas.cantidad}
          </p>
          <p className="text-xs text-slate-500">Registrados</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Ingreso Promedio
          </p>
          <p className="mt-2 text-2xl font-semibold text-violet-300">
            {formatCurrencyShort(estadisticas.promedio)}
          </p>
          <p className="text-xs text-slate-500">Por ingreso</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Fuente Principal
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-300">
            {estadisticas.fuenteMasIngresos}
          </p>
          <p className="text-xs text-slate-500">Mayor ingreso</p>
        </div>
      </section>

      {/* Filtros y Búsqueda */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-medium mb-3">
          <FiFilter size={18} />
          <span>Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar
            </label>
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Buscar por concepto, fuente..."
            />
          </div>

          {/* Filtro por fuente */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fuente de Ingreso
            </label>
            <select
              value={fuenteFiltro}
              onChange={(e) => setFuenteFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {FUENTES.map((fuente) => (
                <option key={fuente} value={fuente}>
                  {fuente}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por período */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Período
            </label>
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="Todos">Todos</option>
              <option value="Este mes">Este mes</option>
              <option value="Este trimestre">Este trimestre</option>
              <option value="Este año">Este año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
        <AdminTable
          columns={columns}
          data={ingresosFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay ingresos que coincidan con los filtros"
          itemsPerPage={10}
        />
      </div>

      {/* Modal Nuevo Ingreso */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModal}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Nuevo Ingreso</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Registra un nuevo ingreso para el club
                </p>
              </div>
              <button
                onClick={cerrarModal}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
              >
                <FiX size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Concepto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  placeholder="Ej: Venta de chipas del viernes"
                  className={`w-full px-4 py-2 border bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500 ${
                    errors.concepto ? "border-rose-500" : "border-slate-700"
                  }`}
                />
                {errors.concepto && (
                  <p className="text-rose-400 text-sm mt-1">{errors.concepto}</p>
                )}
              </div>

              {/* Cantidad y Fuente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cantidad <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-medium">
                      ₲
                    </span>
                    <input
                      type="text"
                      name="cantidad"
                      value={
                        formData.cantidad
                          ? parseFloat(formData.cantidad).toLocaleString("es-PY")
                          : ""
                      }
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\./g, "");
                        const numero = parseFloat(valor) || 0;
                        setFormData({
                          ...formData,
                          cantidad: numero.toString(),
                        });
                      }}
                      placeholder="0"
                      className={`w-full pl-8 pr-4 py-2 border bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500 ${
                        errors.cantidad ? "border-rose-500" : "border-slate-700"
                      }`}
                    />
                  </div>
                  {errors.cantidad && (
                    <p className="text-rose-400 text-sm mt-1">{errors.cantidad}</p>
                  )}
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 50000, 100000, 500000, 1000000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            cantidad: monto.toString(),
                          })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fuente <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="fuente"
                    value={formData.fuente}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.fuente ? "border-rose-500" : "border-slate-700"
                    }`}
                  >
                    <option value="">Seleccionar fuente...</option>
                    <option value="Venta de Alimentos">Venta de Alimentos</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Rifas">Rifas</option>
                    <option value="Patrocinios">Patrocinios</option>
                    <option value="Productos del club">Productos del club</option>
                    <option value="Cuotas Sociales">Cuotas Sociales</option>
                    <option value="Otros">Otros</option>
                  </select>
                  {errors.fuente && (
                    <p className="text-rose-400 text-sm mt-1">{errors.fuente}</p>
                  )}
                </div>
              </div>

              {/* Fecha y Responsable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.fecha ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {errors.fecha && (
                    <p className="text-rose-400 text-sm mt-1">{errors.fecha}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Responsable (Opcional)
                  </label>
                  <select
                    name="miembroId"
                    value={formData.miembroId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Ninguno</option>
                    {miembros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ejemplos */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-sm font-medium text-emerald-200 mb-2">
                  💡 Ejemplos de ingresos diversos:
                </p>
                <ul className="text-sm text-emerald-100 space-y-1 ml-4 list-disc">
                  <li>Venta de chipas, empanadas, bebidas en partidos</li>
                  <li>Eventos: torneos, festivales, cenas benéficas</li>
                  <li>Rifas de camisetas, balones, electrodomésticos</li>
                  <li>Patrocinios de empresas locales</li>
                  <li>Venta de productos del club: camisetas, gorras, etc.</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiSave size={18} />
                  {guardando ? "Guardando..." : "Guardar Ingreso"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="px-6 py-3 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Ingreso */}
      {modalEditarAbierto && ingresoEditando && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalEditar}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Editar Ingreso</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Modifica los datos del ingreso
                </p>
              </div>
              <button
                onClick={cerrarModalEditar}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
              >
                <FiX size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Concepto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="concepto"
                  value={ingresoEditando.concepto}
                  onChange={handleChangeEditar}
                  placeholder="Ej: Venta de chipas del viernes"
                  className="w-full px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                />
              </div>

              {/* Cantidad y Fuente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cantidad <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-medium">
                      ₲
                    </span>
                    <input
                      type="text"
                      name="cantidad"
                      value={
                        ingresoEditando.cantidad
                          ? parseFloat(ingresoEditando.cantidad).toLocaleString("es-PY")
                          : ""
                      }
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\./g, "");
                        const numero = parseFloat(valor) || 0;
                        setIngresoEditando({
                          ...ingresoEditando,
                          cantidad: numero,
                        });
                      }}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                    />
                  </div>
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 50000, 100000, 500000, 1000000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setIngresoEditando({
                            ...ingresoEditando,
                            cantidad: monto,
                          })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fuente <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="fuente"
                    value={ingresoEditando.fuente}
                    onChange={handleChangeEditar}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar fuente...</option>
                    <option value="Venta de Alimentos">Venta de Alimentos</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Rifas">Rifas</option>
                    <option value="Patrocinios">Patrocinios</option>
                    <option value="Productos del club">Productos del club</option>
                    <option value="Cuotas Sociales">Cuotas Sociales</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              {/* Fecha y Responsable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={
                      ingresoEditando.fecha
                        ? new Date(ingresoEditando.fecha).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={handleChangeEditar}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Responsable (Opcional)
                  </label>
                  <select
                    name="miembroId"
                    value={ingresoEditando.miembroId || ""}
                    onChange={handleChangeEditar}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Ninguno</option>
                    {miembros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  disabled={guardando}
                  className="flex-1 px-6 py-3 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={editarIngreso}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiSave size={18} />
                  {guardando ? "Guardando..." : "Guardar Cambios"}
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
              primary: "#10b981",
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

      {mostrarConfirm && ingresoEliminar && (
        <ConfirmDialog
          title="Eliminar Ingreso"
          message={`¿Estás seguro de que deseas eliminar este ingreso?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminacion}
          onCancel={() => {
            setMostrarConfirm(false);
            setIngresoEliminar(null);
          }}
          isDangerous={true}
        />
      )}
    </div>
  );
}
