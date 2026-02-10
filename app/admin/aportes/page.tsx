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
} from "react-icons/fi";
import { SearchBar } from "@/components/SearchBar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Aporte {
  id: string;
  miembroNombre: string;
  colectaNombre: string;
  cantidad: number;
  estado: string;
  metodoPago: string;
  fecha: string;
}

const ESTADOS = ["Todos", "aportado", "comprometido"];
const METODOS_PAGO = ["Todos", "efectivo", "transferencia", "cheque", "otro"];

interface Miembro {
  id: string;
  nombre: string;
}

export default function AdminAportes() {
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState("Todos");
  const [periodoFiltro, setPeriodoFiltro] = useState("Todos");
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [aporteEliminar, setAporteEliminar] = useState<Aporte | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [aporteEditando, setAporteEditando] = useState<Aporte | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Estados para nuevo aporte individual
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [nuevoAporte, setNuevoAporte] = useState({
    miembroId: "",
    cantidad: 0,
    estado: "aportado",
    metodoPago: "efectivo",
  });

  useEffect(() => {
    cargarAportes();
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

  const cargarAportes = async () => {
    try {
      const res = await fetch("/api/colectas/aportes");
      if (res.ok) {
        const data = await res.json();
        const aportesTransformados = data.map((a: any) => ({
          id: a.id,
          miembroNombre: a.miembroNombre || a.miembro?.nombre || "N/A",
          colectaNombre: a.colecta?.nombre || "N/A",
          cantidad: a.cantidad,
          estado: a.estado || "aportado",
          metodoPago: a.metodoPago || "N/A",
          fecha: a.fecha
            ? new Date(a.fecha).toLocaleDateString()
            : new Date(a.createdAt).toLocaleDateString(),
        }));
        setAportes(aportesTransformados);
        return;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (aporte: Aporte) => {
    setAporteEditando(aporte);
    setModalEditarAbierto(true);
  };

  const handleDelete = async (aporte: Aporte) => {
    setAporteEliminar(aporte);
    setMostrarConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!aporteEliminar) return;

    try {
      const res = await fetch(`/api/colectas/aportes/${aporteEliminar.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAportes(aportes.filter((a) => a.id !== aporteEliminar.id));
        toast.success("Aporte eliminado correctamente");
        setMostrarConfirm(false);
        setAporteEliminar(null);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el aporte");
    }
  };

  const actualizarAporte = async () => {
    if (!aporteEditando) return;

    // Validaciones
    if (!aporteEditando.cantidad || aporteEditando.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    // Guardar estado anterior para poder revertir si falla
    const aportesAnteriores = [...aportes];

    // Actualización optimista: actualizar UI inmediatamente
    setAportes(
      aportes.map((a) =>
        a.id === aporteEditando.id
          ? {
              ...a,
              cantidad: aporteEditando.cantidad,
              estado: aporteEditando.estado,
              metodoPago: aporteEditando.metodoPago,
              fecha: aporteEditando.fecha,
            }
          : a,
      ),
    );

    // Cerrar modal y mostrar feedback inmediato
    cerrarModalEditar();
    toast.success("Aporte actualizado correctamente");

    setGuardando(true);
    try {
      const res = await fetch(`/api/colectas/aportes/${aporteEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad: aporteEditando.cantidad,
          estado: aporteEditando.estado,
          metodoPago: aporteEditando.metodoPago,
          fecha: aporteEditando.fecha,
        }),
      });

      if (!res.ok) {
        // Si falla, revertir a estado anterior
        setAportes(aportesAnteriores);
        const error = await res.json();
        toast.error(
          error.error || "Error al actualizar el aporte. Se revirtieron los cambios.",
        );
      }
    } catch (error) {
      // Si hay error de red, revertir cambios
      setAportes(aportesAnteriores);
      console.error("Error:", error);
      toast.error("Error de conexión. Se revirtieron los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setAporteEditando(null);
  };

  const abrirModalNuevo = () => {
    setNuevoAporte({
      miembroId: "",
      cantidad: 0,
      estado: "aportado",
      metodoPago: "efectivo",
    });
    setModalNuevoAbierto(true);
  };

  const cerrarModalNuevo = () => {
    setModalNuevoAbierto(false);
    setNuevoAporte({
      miembroId: "",
      cantidad: 0,
      estado: "aportado",
      metodoPago: "efectivo",
    });
  };

  const crearAporteIndividual = async () => {
    if (!nuevoAporte.miembroId) {
      toast.error("Debes seleccionar un miembro");
      return;
    }

    if (!nuevoAporte.cantidad || nuevoAporte.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/colectas/aportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miembroId: nuevoAporte.miembroId,
          cantidad: nuevoAporte.cantidad,
          estado: nuevoAporte.estado,
          metodoPago: nuevoAporte.metodoPago,
        }),
      });

      if (res.ok) {
        toast.success("Aporte registrado correctamente");
        cerrarModalNuevo();
        cargarAportes();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al crear el aporte");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado y búsqueda
  const aportesFiltrados = useMemo(() => {
    return aportes.filter((aporte) => {
      const matchQuery =
        searchQuery === "" ||
        aporte.miembroNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aporte.colectaNombre.toLowerCase().includes(searchQuery.toLowerCase());

      const matchEstado = estadoFiltro === "Todos" || aporte.estado === estadoFiltro;
      const matchMetodo =
        metodoPagoFiltro === "Todos" || aporte.metodoPago === metodoPagoFiltro;

      let matchPeriodo = true;
      if (periodoFiltro !== "Todos" && aporte.fecha) {
        const fechaAporte = new Date(aporte.fecha);
        const hoy = new Date();

        if (periodoFiltro === "Este mes") {
          matchPeriodo =
            fechaAporte.getMonth() === hoy.getMonth() &&
            fechaAporte.getFullYear() === hoy.getFullYear();
        } else if (periodoFiltro === "Este trimestre") {
          const trimestreActual = Math.floor(hoy.getMonth() / 3);
          const trimestreAporte = Math.floor(fechaAporte.getMonth() / 3);
          matchPeriodo =
            trimestreAporte === trimestreActual &&
            fechaAporte.getFullYear() === hoy.getFullYear();
        } else if (periodoFiltro === "Este año") {
          matchPeriodo = fechaAporte.getFullYear() === hoy.getFullYear();
        }
      }

      return matchQuery && matchEstado && matchMetodo && matchPeriodo;
    });
  }, [aportes, searchQuery, estadoFiltro, metodoPagoFiltro, periodoFiltro]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = aportesFiltrados.reduce((sum, a) => sum + a.cantidad, 0);
    const promedio = aportesFiltrados.length > 0 ? total / aportesFiltrados.length : 0;

    const aportesPorMiembro = aportesFiltrados.reduce(
      (acc, a) => {
        acc[a.miembroNombre] = (acc[a.miembroNombre] || 0) + a.cantidad;
        return acc;
      },
      {} as Record<string, number>,
    );

    const miembroMasAportes = Object.entries(aportesPorMiembro).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      total,
      cantidad: aportesFiltrados.length,
      promedio,
      miembroMasAportes: miembroMasAportes ? miembroMasAportes[0] : "N/A",
    };
  }, [aportesFiltrados]);

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape para más espacio

    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Azul para aportes
    doc.text("Reporte de Aportes", 15, 18);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 28);
    doc.text(`Total de aportes: ${aportesFiltrados.length}`, 95, 28);

    doc.text(`Monto total: $${estadisticas.total.toLocaleString()}`, 15, 35);
    doc.text(`Promedio por aporte: $${estadisticas.promedio.toLocaleString()}`, 95, 35);

    autoTable(doc, {
      startY: 45,
      head: [["Miembro", "Colecta", "Cantidad", "Estado", "Método de Pago", "Fecha"]],
      body: aportesFiltrados.map((a) => [
        a.miembroNombre,
        a.colectaNombre,
        `$${a.cantidad.toLocaleString()}`,
        a.estado,
        a.metodoPago,
        a.fecha,
      ]),
      styles: {
        fontSize: 11,
        cellPadding: 7,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [37, 99, 235],
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
        // Sugerencia para moviles
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

    doc.save(`aportes_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const columns: TableColumn[] = [
    { key: "miembroNombre", label: "Miembro" },
    { key: "colectaNombre", label: "Colecta" },
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
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gestión</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Historial de Aportes</h1>
            <p className="text-sm text-slate-400">
              Visualiza y gestiona todos los aportes de los miembros
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Botón Nuevo Aporte Individual */}
            <button
              onClick={abrirModalNuevo}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition"
            >
              <FiDollarSign size={18} /> Nuevo Aporte
            </button>

            <button
              onClick={exportarPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-emerald-700 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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
            Total Aportado
          </p>
          <p className="mt-2 text-2xl font-semibold text-sky-300">
            {formatCurrencyShort(estadisticas.total)}
          </p>
          <p className="text-xs text-slate-500">En todas las colectas</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            N° de Aportes
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {estadisticas.cantidad}
          </p>
          <p className="text-xs text-slate-500">Registrados</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Aporte Promedio
          </p>
          <p className="mt-2 text-2xl font-semibold text-violet-300">
            {formatCurrencyShort(estadisticas.promedio)}
          </p>
          <p className="text-xs text-slate-500">Por aporte</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Miembro Destacado
          </p>
          <p className="mt-2 text-lg font-semibold text-amber-300">
            {estadisticas.miembroMasAportes}
          </p>
          <p className="text-xs text-slate-500">Mayor contribución</p>
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
              placeholder="Buscar por miembro, colecta..."
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por método de pago */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Método de Pago
            </label>
            <select
              value={metodoPagoFiltro}
              onChange={(e) => setMetodoPagoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Período */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Período</label>
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="Todos">Todos</option>
            <option value="Este mes">Este mes</option>
            <option value="Este trimestre">Este trimestre</option>
            <option value="Este año">Este año</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
        <AdminTable
          columns={columns}
          data={aportesFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay aportes que coincidan con los filtros"
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

      {mostrarConfirm && aporteEliminar && (
        <ConfirmDialog
          title="Eliminar Aporte"
          message="¿Estás seguro de que deseas eliminar este aporte?"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminacion}
          onCancel={() => {
            setMostrarConfirm(false);
            setAporteEliminar(null);
          }}
          isDangerous={true}
        />
      )}

      {/* Modal Editar Aporte */}
      {modalEditarAbierto && aporteEditando && (
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
                <h2 className="text-xl font-semibold text-slate-100">Editar Aporte</h2>
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
                    value={aporteEditando.miembroNombre}
                    disabled
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed"
                  />
                </div>

                {/* Colecta (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Colecta
                  </label>
                  <input
                    type="text"
                    value={aporteEditando.colectaNombre}
                    disabled
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
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
                    value={aporteEditando.metodoPago}
                    onChange={(e) =>
                      setAporteEditando({
                        ...aporteEditando,
                        metodoPago: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={
                      aporteEditando.fecha
                        ? new Date(aporteEditando.fecha.split("/").reverse().join("-"))
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setAporteEditando({
                        ...aporteEditando,
                        fecha: new Date(e.target.value).toLocaleDateString(),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={actualizarAporte}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:bg-slate-700"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Aporte Individual */}
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
                <h2 className="text-xl font-semibold text-slate-100">
                  Registrar Aporte Individual
                </h2>
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
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
                  <select
                    value={nuevoAporte.miembroId}
                    onChange={(e) =>
                      setNuevoAporte({ ...nuevoAporte, miembroId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar miembro...</option>
                    {miembros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Este aporte NO estará vinculado a ninguna colecta específica
                  </p>
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
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
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
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      setNuevoAporte({
                        ...nuevoAporte,
                        metodoPago: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crearAporteIndividual}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition disabled:bg-slate-700"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Registrar Aporte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
