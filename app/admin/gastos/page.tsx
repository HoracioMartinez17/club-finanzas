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

interface Gasto {
  id: string;
  descripcion: string;
  cantidad: number;
  categoria: string;
  responsable: string;
  quienPagoId?: string;
  fecha: string;
  colecta: string;
}

interface Miembro {
  id: string;
  nombre: string;
}

interface FormErrors {
  concepto?: string;
  cantidad?: string;
  categoria?: string;
  quienPagoId?: string;
}

type GastoEditando = Omit<Gasto, "cantidad"> & {
  cantidad: string | number;
};

const CATEGORIAS = [
  "Todas",
  "cancha",
  "arbitros",
  "jugadores",
  "equipamiento",
  "viajes",
  "alimentacion",
  "otros",
];

// Función para capitalizar nombres de categorías
const capitalizarCategoria = (categoria: string) => {
  if (categoria === "Todas") return categoria;
  const nombres: Record<string, string> = {
    cancha: "Cancha",
    arbitros: "Árbitros",
    jugadores: "Jugadores",
    equipamiento: "Equipamiento",
    viajes: "Viajes",
    alimentacion: "Alimentación",
    otros: "Otros",
  };
  return nombres[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1);
};

const formatCurrencyShort = (value: number | undefined) => {
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

const getCategoriaColor = (categoria: string) => {
  const colores: Record<string, string> = {
    cancha: "bg-emerald-500/20 text-emerald-200",
    arbitros: "bg-sky-500/20 text-sky-200",
    jugadores: "bg-purple-500/20 text-purple-200",
    equipamiento: "bg-amber-500/20 text-amber-200",
    viajes: "bg-cyan-500/20 text-cyan-200",
    alimentacion: "bg-orange-500/20 text-orange-200",
    otros: "bg-slate-500/20 text-slate-200",
  };
  return colores[categoria.toLowerCase()] || "bg-slate-500/20 text-slate-200";
};

export default function AdminGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [periodoFiltro, setPeriodoFiltro] = useState("Todos");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<GastoEditando | null>(null);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [gastoEliminar, setGastoEliminar] = useState<Gasto | null>(null);
  const [formData, setFormData] = useState({
    concepto: "",
    cantidad: "",
    categoria: "",
    categoriaCustom: "",
    quienPagoId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoriaCustomGastoEditar, setCategoriaCustomGastoEditar] = useState("");

  useEffect(() => {
    cargarGastos();
    cargarMiembros();
  }, []);

  const cargarMiembros = async () => {
    try {
      const res = await fetch("/api/miembros");
      if (res.ok) {
        const data = await res.json();
        setMiembros(data);
      }
    } catch (error) {
      console.error("Error al cargar miembros:", error);
    }
  };

  const cargarGastos = async () => {
    try {
      // Intentar API real
      try {
        const res = await fetch("/api/gastos");
        if (res.ok) {
          const data = await res.json();
          // Transformar los datos de la API al formato esperado
          const gastosTransformados = data.map((g: any) => ({
            id: g.id,
            descripcion: g.concepto || g.descripcion || "",
            cantidad: g.cantidad,
            categoria: g.categoria,
            responsable:
              g.quienPagoNombre || g.quienPago?.nombre || g.responsable || "N/A",
            quienPagoId: g.quienPagoId,
            fecha: g.createdAt
              ? new Date(g.createdAt).toLocaleDateString()
              : g.fecha || "",
            colecta:
              typeof g.colecta === "object" && g.colecta
                ? g.colecta.nombre
                : g.colecta || "General",
          }));
          setGastos(gastosTransformados);
          return;
        }
      } catch {
        console.log("API real no disponible");
      }

      // Fallback a datos simulados
      setGastos([
        {
          id: "1",
          descripcion: "Material de construcción",
          cantidad: 500,
          categoria: "Infraestructura",
          responsable: "Carlos",
          fecha: "2024-01-10",
          colecta: "Reparación Cancha",
        },
        {
          id: "2",
          descripcion: "Camisetas y pantalones",
          cantidad: 300,
          categoria: "Equipamiento",
          responsable: "Jorge",
          fecha: "2024-01-12",
          colecta: "Uniforme Nuevo",
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validarFormulario = () => {
    const nuevosErrores: FormErrors = {};

    if (!formData.concepto.trim()) {
      nuevosErrores.concepto = "El concepto es requerido";
    }

    if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
      nuevosErrores.cantidad = "La cantidad debe ser mayor a 0";
    }

    if (!formData.categoria) {
      nuevosErrores.categoria = "Selecciona una categoría";
    }

    if (formData.categoria === "otros" && !formData.categoriaCustom.trim()) {
      nuevosErrores.categoria = "Debes especificar el tipo de gasto";
    }

    if (!formData.quienPagoId) {
      nuevosErrores.quienPagoId = "Selecciona quién realizó el gasto";
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const crearGasto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setGuardando(true);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: formData.concepto,
          cantidad: parseFloat(formData.cantidad),
          categoria:
            formData.categoria === "otros"
              ? formData.categoriaCustom
              : formData.categoria,
          quienPagoId: formData.quienPagoId,
        }),
      });

      if (res.ok) {
        toast.success("Gasto registrado correctamente");
        cerrarModal();
        cargarGastos();
      } else {
        toast.error("Error al registrar el gasto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al registrar el gasto");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFormData({
      concepto: "",
      cantidad: "",
      categoria: "",
      categoriaCustom: "",
      quienPagoId: "",
    });
  };

  const handleEdit = (gasto: any) => {
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
      cantidad: gasto.cantidad as unknown as string,
      responsable: gasto.quienPagoId || "",
      categoria: esCustom ? "otros" : gasto.categoria,
    });

    if (esCustom) {
      setCategoriaCustomGastoEditar(gasto.categoria);
    }

    setModalEditarAbierto(true);
  };

  const handleChangeEditar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (gastoEditando) {
      setGastoEditando({
        ...gastoEditando,
        [name]: value,
      });
    }
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setGastoEditando(null);
    setCategoriaCustomGastoEditar("");
  };

  const editarGasto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gastoEditando) return;

    if (gastoEditando.categoria === "otros" && !categoriaCustomGastoEditar.trim()) {
      toast.error("Debes especificar el tipo de gasto");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/gastos/${gastoEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: gastoEditando.descripcion,
          cantidad: parseFloat(gastoEditando.cantidad as unknown as string),
          categoria:
            gastoEditando.categoria === "otros"
              ? categoriaCustomGastoEditar
              : gastoEditando.categoria,
          quienPagoId: gastoEditando.responsable,
        }),
      });

      if (res.ok) {
        toast.success("Gasto actualizado correctamente");
        cerrarModalEditar();
        cargarGastos();
      } else {
        const error = await res.json();
        console.error("Error response:", error);
        toast.error("Error al actualizar el gasto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el gasto");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (gasto: Gasto) => {
    setGastoEliminar(gasto);
    setMostrarConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!gastoEliminar) return;

    try {
      const res = await fetch(`/api/gastos/${gastoEliminar.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGastos(gastos.filter((g) => g.id !== gastoEliminar.id));
        toast.success("Gasto eliminado correctamente");
        setMostrarConfirm(false);
        setGastoEliminar(null);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el gasto");
    }
  };

  // Filtrado y búsqueda
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((gasto) => {
      // Búsqueda por texto
      const matchQuery =
        searchQuery === "" ||
        gasto.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gasto.responsable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gasto.colecta.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro por categoría
      const matchCategoria =
        categoriaFiltro === "Todas" || gasto.categoria === categoriaFiltro;

      // Filtro por período
      let matchPeriodo = true;
      if (periodoFiltro !== "Todos" && gasto.fecha) {
        const fechaGasto = new Date(gasto.fecha);
        const hoy = new Date();

        if (periodoFiltro === "Este mes") {
          matchPeriodo =
            fechaGasto.getMonth() === hoy.getMonth() &&
            fechaGasto.getFullYear() === hoy.getFullYear();
        } else if (periodoFiltro === "Este trimestre") {
          const trimestreActual = Math.floor(hoy.getMonth() / 3);
          const trimestreGasto = Math.floor(fechaGasto.getMonth() / 3);
          matchPeriodo =
            trimestreGasto === trimestreActual &&
            fechaGasto.getFullYear() === hoy.getFullYear();
        } else if (periodoFiltro === "Este año") {
          matchPeriodo = fechaGasto.getFullYear() === hoy.getFullYear();
        }
      }

      return matchQuery && matchCategoria && matchPeriodo;
    });
  }, [gastos, searchQuery, categoriaFiltro, periodoFiltro]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = gastosFiltrados.reduce((sum, g) => sum + g.cantidad, 0);
    const promedio = gastosFiltrados.length > 0 ? total / gastosFiltrados.length : 0;

    // Categoría con más gasto
    const gastosPorCategoria = gastosFiltrados.reduce(
      (acc, g) => {
        acc[g.categoria] = (acc[g.categoria] || 0) + g.cantidad;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoriaMasGasto = Object.entries(gastosPorCategoria).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      total,
      cantidad: gastosFiltrados.length,
      promedio,
      categoriaMasGasto: categoriaMasGasto ? categoriaMasGasto[0] : "N/A",
    };
  }, [gastosFiltrados]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = [
      "Descripción",
      "Categoría",
      "Cantidad",
      "Responsable",
      "Fecha",
      "Colecta",
    ];
    const rows = gastosFiltrados.map((g) => [
      g.descripcion,
      capitalizarCategoria(g.categoria),
      g.cantidad.toString(),
      g.responsable,
      g.fecha,
      g.colecta,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gastos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape para más espacio

    // Título
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Azul del tema
    doc.text("Reporte de Gastos", 15, 18);

    // Información del reporte en dos columnas
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 28);
    doc.text(`Total de gastos: ${gastosFiltrados.length}`, 90, 28);

    doc.text(`Monto total: $${estadisticas.total.toLocaleString()}`, 15, 35);
    doc.text(`Promedio por gasto: $${estadisticas.promedio.toLocaleString()}`, 90, 35);

    // Tabla mejorada
    autoTable(doc, {
      startY: 45,
      head: [["Descripción", "Categoría", "Cantidad", "Responsable", "Fecha", "Colecta"]],
      body: gastosFiltrados.map((g) => [
        g.descripcion,
        capitalizarCategoria(g.categoria),
        `$${g.cantidad.toLocaleString()}`,
        g.responsable,
        g.fecha,
        g.colecta,
      ]),
      styles: {
        fontSize: 11,
        cellPadding: 7,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [30, 58, 138],
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

    doc.save(`gastos_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportMenu(false);
  };

  const columns: TableColumn[] = [
    { key: "descripcion", label: "Descripción" },
    {
      key: "categoria",
      label: "Categoría",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(value as string)}`}
        >
          {capitalizarCategoria(value as string)}
        </span>
      ),
    },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (value) => (
        <span className="font-semibold text-rose-300">
          {formatCurrencyShort(value as number)}
        </span>
      ),
    },
    { key: "responsable", label: "Responsable" },
    { key: "fecha", label: "Fecha" },
    {
      key: "colecta",
      label: "Colecta",
      render: (value) => <span className="text-sm text-slate-400">{value}</span>,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Control</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Gestionar Gastos</h1>
            <p className="text-sm text-slate-400">
              Administra y controla todos los gastos del club
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Dropdown de exportación */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition w-full sm:w-auto"
              >
                <FiDownload size={18} /> Exportar
              </button>

              {showExportMenu && (
                <>
                  {/* Overlay para cerrar al hacer click fuera */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />

                  {/* Menú dropdown */}
                  <div className="absolute right-0 mt-2 w-full sm:w-48 bg-slate-900 rounded-lg shadow-lg border border-slate-700 py-1 z-20">
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
              onClick={() => setModalAbierto(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition flex-1 sm:flex-initial"
            >
              <FiPlus /> Nuevo Gasto
            </button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Total Gastado
          </p>
          <p className="mt-2 text-2xl font-semibold text-rose-300">
            {formatCurrencyShort(estadisticas.total)}
          </p>
          <p className="text-xs text-slate-500">Monto total de gastos</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            N° de Gastos
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {estadisticas.cantidad}
          </p>
          <p className="text-xs text-slate-500">Gastos registrados</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Gasto Promedio
          </p>
          <p className="mt-2 text-2xl font-semibold text-violet-300">
            {formatCurrencyShort(estadisticas.promedio)}
          </p>
          <p className="text-xs text-slate-500">Por transacción</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Categoría Principal
          </p>
          <p className="mt-2 text-lg font-semibold text-amber-300">
            {capitalizarCategoria(estadisticas.categoriaMasGasto)}
          </p>
          <p className="text-xs text-slate-500">Más gastos aquí</p>
        </div>
      </section>

      {/* Filtros y Búsqueda */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-medium mb-3">
          <FiFilter size={18} />
          <span>Filtros</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar
            </label>
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Buscar por descripción, responsable..."
            />
          </div>

          {/* Filtro por categoría */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Categoría
            </label>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
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
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
          data={gastosFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay gastos que coincidan con los filtros"
          itemsPerPage={10}
        />
      </div>

      {/* Modal Nuevo Gasto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-slate-100">Nuevo Gasto</h2>
              <button
                onClick={cerrarModal}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={crearGasto} className="p-6 space-y-4">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Concepto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  placeholder="Ej: Material de construcción"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 bg-slate-900 text-slate-100 ${
                    errors.concepto ? "border-rose-500" : "border-slate-700"
                  }`}
                />
                {errors.concepto && (
                  <p className="text-rose-400 text-sm mt-1">{errors.concepto}</p>
                )}
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Cantidad <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">
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
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 bg-slate-900 text-slate-100 ${
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

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Categoría <span className="text-rose-400">*</span>
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-900 text-slate-100 ${
                    errors.categoria ? "border-rose-500" : "border-slate-700"
                  }`}
                >
                  <option value="">Seleccionar categoría...</option>
                  <option value="cancha">Cancha</option>
                  <option value="arbitros">Árbitros</option>
                  <option value="jugadores">Jugadores</option>
                  <option value="equipamiento">Equipamiento</option>
                  <option value="viajes">Viajes</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="otros">Otros</option>
                </select>
                {errors.categoria && (
                  <p className="text-rose-400 text-sm mt-1">{errors.categoria}</p>
                )}
              </div>

              {/* Campo personalizado para "Otros" */}
              {formData.categoria === "otros" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Especificar tipo de gasto <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="categoriaCustom"
                    value={formData.categoriaCustom}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="ej: Decoración, Logística, etc."
                    required
                  />
                </div>
              )}

              {/* Quién pagó */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Responsable <span className="text-rose-400">*</span>
                </label>
                <select
                  name="quienPagoId"
                  value={formData.quienPagoId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-900 text-slate-100 ${
                    errors.quienPagoId ? "border-rose-500" : "border-slate-700"
                  }`}
                >
                  <option value="">Seleccionar responsable...</option>
                  {miembros.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
                {errors.quienPagoId && (
                  <p className="text-rose-400 text-sm mt-1">{errors.quienPagoId}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiSave size={18} />
                  {guardando ? "Guardando..." : "Guardar Gasto"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Gasto */}
      {modalEditarAbierto && gastoEditando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-slate-100">Editar Gasto</h2>
              <button
                onClick={cerrarModalEditar}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={editarGasto} className="p-6 space-y-4">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Concepto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={gastoEditando.descripcion}
                  onChange={handleChangeEditar}
                  placeholder="Ej: Material de construcción"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500"
                />
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Cantidad <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">
                    ₲
                  </span>
                  <input
                    type="text"
                    name="cantidad"
                    value={
                      gastoEditando.cantidad
                        ? parseFloat(
                            gastoEditando.cantidad as unknown as string,
                          ).toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setGastoEditando({
                        ...gastoEditando,
                        cantidad: numero as unknown as string,
                      });
                    }}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500"
                  />
                </div>
                {/* Botones rápidos */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[10000, 50000, 100000, 500000, 1000000].map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() =>
                        setGastoEditando({
                          ...gastoEditando,
                          cantidad: monto as unknown as string,
                        })
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
                  Categoría <span className="text-rose-400">*</span>
                </label>
                <select
                  name="categoria"
                  value={gastoEditando.categoria}
                  onChange={handleChangeEditar}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Seleccionar categoría...</option>
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
                    Especificar tipo de gasto <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoriaCustomGastoEditar}
                    onChange={(e) => setCategoriaCustomGastoEditar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="ej: Decoración, Logística, etc."
                    required
                  />
                </div>
              )}

              {/* Responsable */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Responsable <span className="text-rose-400">*</span>
                </label>
                <select
                  name="responsable"
                  value={gastoEditando.responsable}
                  onChange={handleChangeEditar}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Seleccionar responsable...</option>
                  {miembros.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiSave size={18} />
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  disabled={guardando}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
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

      {mostrarConfirm && gastoEliminar && (
        <ConfirmDialog
          title="Eliminar Gasto"
          message={`¿Estás seguro de que deseas eliminar este gasto?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminacion}
          onCancel={() => {
            setMostrarConfirm(false);
            setGastoEliminar(null);
          }}
          isDangerous={true}
        />
      )}
    </div>
  );
}
