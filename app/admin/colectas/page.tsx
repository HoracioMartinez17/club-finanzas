"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import { FiPlus, FiX } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Colecta {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  totalAportado: number;
  estado: string;
}

export default function AdminColectas() {
  const [colectas, setColectas] = useState<Colecta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [colectaEliminar, setColectaEliminar] = useState<Colecta | null>(null);
  const router = useRouter();

  const [nuevaColecta, setNuevaColecta] = useState({
    nombre: "",
    descripcion: "",
    objetivo: 0,
    estado: "activa",
    fechaCierre: "",
  });

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

  const resumen = useMemo(() => {
    const total = colectas.length;
    const activas = colectas.filter((c) => c.estado === "activa").length;
    const objetivoTotal = colectas.reduce((sum, c) => sum + (c.objetivo || 0), 0);
    const aportadoTotal = colectas.reduce((sum, c) => sum + (c.totalAportado || 0), 0);
    const faltanteTotal = Math.max(objetivoTotal - aportadoTotal, 0);

    return { total, activas, objetivoTotal, aportadoTotal, faltanteTotal };
  }, [colectas]);

  useEffect(() => {
    cargarColectas();
  }, []);

  const cargarColectas = async () => {
    try {
      const res = await fetch("/api/colectas");
      if (!res.ok) {
        throw new Error("Error al cargar colectas");
      }

      const data = await res.json();
      setColectas(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (colecta: Colecta) => {
    // Navegar a la página de detalle/edición de la colecta
    router.push(`/admin/colectas/${colecta.id}`);
  };

  const handleDelete = async (colecta: Colecta) => {
    setColectaEliminar(colecta);
    setMostrarConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!colectaEliminar) return;

    try {
      const res = await fetch(`/api/colectas/${colectaEliminar.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setColectas(colectas.filter((c) => c.id !== colectaEliminar.id));
        toast.success("Colecta eliminada correctamente");
        setMostrarConfirm(false);
        setColectaEliminar(null);
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al eliminar la colecta");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar la colecta. Por favor, intenta de nuevo.");
    }
  };

  const crearColecta = async () => {
    // Validaciones
    if (!nuevaColecta.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!nuevaColecta.objetivo || nuevaColecta.objetivo <= 0) {
      toast.error("El objetivo debe ser mayor a 0");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/colectas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaColecta),
      });

      if (res.ok) {
        toast.success("Colecta creada correctamente");
        setModalAbierto(false);
        setNuevaColecta({
          nombre: "",
          descripcion: "",
          objetivo: 0,
          estado: "activa",
          fechaCierre: "",
        });
        cargarColectas();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al crear la colecta");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear la colecta");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevaColecta({
      nombre: "",
      descripcion: "",
      objetivo: 0,
      estado: "activa",
      fechaCierre: "",
    });
  };

  const columns: TableColumn[] = [
    {
      key: "nombre",
      label: "Nombre",
      render: (value, row) => (
        <Link
          href={`/admin/colectas/${row.id}`}
          className="text-sky-300 hover:text-sky-200 font-medium underline"
        >
          {value}
        </Link>
      ),
    },
    { key: "descripcion", label: "Descripción" },
    {
      key: "objetivo",
      label: "Objetivo",
      render: (value) => formatCurrencyShort(value),
    },
    {
      key: "totalAportado",
      label: "Aportado",
      render: (value) => formatCurrencyShort(value),
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            value === "activa"
              ? "bg-emerald-500/20 text-emerald-200"
              : value === "cerrada"
                ? "bg-blue-900/30 text-blue-100"
                : "bg-blue-900/30 text-blue-100"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gestion</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Colectas del Club</h1>
            <p className="text-sm text-slate-400">
              Administra colectas activas y el progreso de cada objetivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition w-full sm:w-auto"
          >
            <FiPlus /> Nueva Colecta
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{resumen.total}</p>
          <p className="text-xs text-slate-500">Colectas registradas</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activas</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {resumen.activas}
          </p>
          <p className="text-xs text-slate-500">En marcha ahora</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Aportado</p>
          <p className="mt-2 text-2xl font-semibold text-sky-300">
            {formatCurrencyShort(resumen.aportadoTotal)}
          </p>
          <p className="text-xs text-slate-500">Total juntado</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Falta juntar
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {formatCurrencyShort(resumen.faltanteTotal)}
          </p>
          <p className="text-xs text-slate-500">Para cerrar objetivos</p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
        <AdminTable
          columns={columns}
          data={colectas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay colectas registradas"
          itemsPerPage={10}
        />
      </div>

      {/* Modal Nueva Colecta */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModal}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Nueva Colecta</h2>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nombre de la Colecta *
                  </label>
                  <input
                    type="text"
                    value={nuevaColecta.nombre}
                    onChange={(e) =>
                      setNuevaColecta({ ...nuevaColecta, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Ej: Reparación de la cancha"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={nuevaColecta.descripcion}
                    onChange={(e) =>
                      setNuevaColecta({ ...nuevaColecta, descripcion: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Describe el propósito de la colecta..."
                    rows={3}
                  />
                </div>

                {/* Objetivo */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Objetivo (₲) *
                  </label>
                  <input
                    type="text"
                    value={
                      nuevaColecta.objetivo
                        ? nuevaColecta.objetivo.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setNuevaColecta({
                        ...nuevaColecta,
                        objetivo: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[100000, 200000, 500000, 1000000, 2000000, 5000000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setNuevaColecta({ ...nuevaColecta, objetivo: monto })
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
                    Estado Inicial
                  </label>
                  <select
                    value={nuevaColecta.estado}
                    onChange={(e) =>
                      setNuevaColecta({ ...nuevaColecta, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="activa">Activa</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                </div>

                {/* Fecha de Cierre */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Fecha de Cierre (opcional)
                  </label>
                  <input
                    type="date"
                    value={nuevaColecta.fechaCierre}
                    onChange={(e) =>
                      setNuevaColecta({ ...nuevaColecta, fechaCierre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crearColecta}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:bg-slate-700"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Crear Colecta"}
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

      {mostrarConfirm && colectaEliminar && (
        <ConfirmDialog
          title="Eliminar Colecta"
          message={`¿Estás seguro de que deseas eliminar la colecta "${colectaEliminar.nombre}"?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminacion}
          onCancel={() => {
            setMostrarConfirm(false);
            setColectaEliminar(null);
          }}
          isDangerous={true}
        />
      )}
    </div>
  );
}
