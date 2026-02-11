"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import { FiPlus, FiX, FiEdit, FiTrash, FiSearch } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { useMiembros } from "@/lib/hooks/useData";

interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  deudaCuota: number;
}

export default function AdminMiembros() {
  const { miembros, isLoading: loading, mutate: recargarMiembros } = useMiembros();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [nuevoMiembro, setNuevoMiembro] = useState({
    nombre: "",
    email: "",
    telefono: "",
    estado: "activo",
    deudaCuota: 0,
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

  const miembrosFiltrados = useMemo(() => {
    const miembrosArray = Array.isArray(miembros) ? miembros : [];
    if (!busqueda.trim()) return miembrosArray;
    const busquedaLower = busqueda.toLowerCase();
    return miembrosArray.filter(
      (m: Miembro) =>
        m.nombre.toLowerCase().includes(busquedaLower) ||
        m.email.toLowerCase().includes(busquedaLower) ||
        m.telefono.toLowerCase().includes(busquedaLower),
    );
  }, [miembros, busqueda]);

  const resumen = useMemo(() => {
    const miembrosArray = Array.isArray(miembros) ? miembros : [];
    const total = miembrosArray.length;
    const activos = miembrosArray.filter((m: Miembro) => m.estado === "activo").length;
    const inactivos = miembrosArray.filter((m: Miembro) => m.estado === "inactivo").length;
    const deudaTotal = miembrosArray.reduce((sum: number, m: Miembro) => sum + (m.deudaCuota || 0), 0);

    return { total, activos, inactivos, deudaTotal };
  }, [miembros]);

  // Estados para editar
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState<Miembro | null>(null);

  // Estados para eliminar
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [miembroEliminar, setMiembroEliminar] = useState<Miembro | null>(null);

  const handleEdit = (miembro: Miembro) => {
    setMiembroEditando(miembro);
    setModalEditarAbierto(true);
  };

  const handleDelete = (miembro: Miembro) => {
    setMiembroEliminar(miembro);
    setModalEliminarAbierto(true);
  };

  const editarMiembro = async () => {
    if (!miembroEditando) return;

    // Validación
    if (!miembroEditando.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/miembros/${miembroEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: miembroEditando.nombre,
          email: miembroEditando.email.trim() || null,
          telefono: miembroEditando.telefono.trim() || null,
          estado: miembroEditando.estado,
          deudaCuota: miembroEditando.deudaCuota,
        }),
      });

      if (res.ok) {
        toast.success("Miembro actualizado correctamente");
        setModalEditarAbierto(false);
        setMiembroEditando(null);
        recargarMiembros();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al actualizar el miembro");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el miembro");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMiembro = async () => {
    if (!miembroEliminar) return;

    setGuardando(true);
    try {
      const res = await fetch(`/api/miembros/${miembroEliminar.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        recargarMiembros();
        toast.success("Miembro eliminado correctamente");
        setModalEliminarAbierto(false);
        setMiembroEliminar(null);
      } else {
        toast.error(data.error || "Error al eliminar el miembro");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el miembro");
    } finally {
      setGuardando(false);
    }
  };

  const crearMiembro = async () => {
    // Validación
    if (!nuevoMiembro.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoMiembro,
          email: nuevoMiembro.email.trim() || null,
          telefono: nuevoMiembro.telefono.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success("Miembro creado correctamente");
        setModalAbierto(false);
        setNuevoMiembro({
          nombre: "",
          email: "",
          telefono: "",
          estado: "activo",
          deudaCuota: 0,
        });
        recargarMiembros();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al crear el miembro");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el miembro");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevoMiembro({
      nombre: "",
      email: "",
      telefono: "",
      estado: "activo",
      deudaCuota: 0,
    });
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setMiembroEditando(null);
  };

  const cerrarModalEliminar = () => {
    setModalEliminarAbierto(false);
    setMiembroEliminar(null);
  };

  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    {
      key: "email",
      label: "Email",
      render: (value) => (
        <span className="text-slate-300">
          {value && String(value).trim() ? value : "-"}
        </span>
      ),
    },
    {
      key: "telefono",
      label: "Teléfono",
      render: (value) => (
        <span className="text-slate-300">
          {value && String(value).trim() ? value : "-"}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            value === "activo"
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-rose-500/20 text-rose-200"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "deudaCuota",
      label: "Deuda Cuota",
      render: (value) =>
        value > 0 ? (
          <span className="text-rose-300 font-semibold">
            {formatCurrencyShort(value)}
          </span>
        ) : (
          <span className="text-emerald-300">Sin deuda</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gestion</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Miembros del Club</h1>
            <p className="text-sm text-slate-400">
              Administra socios, estado y deudas pendientes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition w-full sm:w-auto"
          >
            <FiPlus /> Nuevo Miembro
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{resumen.total}</p>
          <p className="text-xs text-slate-500">Miembros registrados</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activos</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {resumen.activos}
          </p>
          <p className="text-xs text-slate-500">Al dia</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inactivos</p>
          <p className="mt-2 text-2xl font-semibold text-rose-300">{resumen.inactivos}</p>
          <p className="text-xs text-slate-500">Sin actividad</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deuda total</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {formatCurrencyShort(resumen.deudaTotal)}
          </p>
          <p className="text-xs text-slate-500">Pendiente de cobro</p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 space-y-4">
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
        <AdminTable
          columns={columns}
          data={miembrosFiltrados}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage={
            busqueda.trim()
              ? "No se encontraron miembros que coincidan"
              : "No hay miembros registrados"
          }
          itemsPerPage={10}
        />
      </div>

      {/* Modal Nuevo Miembro */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModal}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Nuevo Miembro</h2>
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
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nuevoMiembro.nombre}
                    onChange={(e) =>
                      setNuevoMiembro({ ...nuevoMiembro, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Ej: Juan García López"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={nuevoMiembro.email}
                    onChange={(e) =>
                      setNuevoMiembro({ ...nuevoMiembro, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="juan@example.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoMiembro.telefono}
                    onChange={(e) =>
                      setNuevoMiembro({ ...nuevoMiembro, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Ej: 0981123456"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={nuevoMiembro.estado}
                    onChange={(e) =>
                      setNuevoMiembro({ ...nuevoMiembro, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                {/* Deuda Cuota */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Deuda de Cuota (₲)
                  </label>
                  <input
                    type="text"
                    value={
                      nuevoMiembro.deudaCuota
                        ? nuevoMiembro.deudaCuota.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setNuevoMiembro({
                        ...nuevoMiembro,
                        deudaCuota: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 20000, 50000, 100000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setNuevoMiembro({ ...nuevoMiembro, deudaCuota: monto })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
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
                  onClick={crearMiembro}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:bg-slate-700"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Crear Miembro"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Miembro */}
      {modalEditarAbierto && miembroEditando && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalEditar}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Editar Miembro</h2>
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={miembroEditando.nombre}
                    onChange={(e) =>
                      setMiembroEditando({ ...miembroEditando, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Ej: Juan García López"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={miembroEditando.email || ""}
                    onChange={(e) =>
                      setMiembroEditando({ ...miembroEditando, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="juan@example.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="text"
                    value={miembroEditando.telefono || ""}
                    onChange={(e) =>
                      setMiembroEditando({ ...miembroEditando, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Ej: 0981123456"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={miembroEditando.estado}
                    onChange={(e) =>
                      setMiembroEditando({ ...miembroEditando, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                {/* Deuda Cuota */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Deuda de Cuota (₲)
                  </label>
                  <input
                    type="text"
                    value={
                      miembroEditando.deudaCuota
                        ? miembroEditando.deudaCuota.toLocaleString("es-PY")
                        : ""
                    }
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\./g, "");
                      const numero = parseFloat(valor) || 0;
                      setMiembroEditando({
                        ...miembroEditando,
                        deudaCuota: numero,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 20000, 50000, 100000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() =>
                          setMiembroEditando({ ...miembroEditando, deudaCuota: monto })
                        }
                        className="px-2 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition"
                      >
                        {(monto / 1000).toLocaleString()}mil
                      </button>
                    ))}
                  </div>
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
                  onClick={editarMiembro}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:bg-slate-700"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {modalEliminarAbierto && miembroEliminar && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cerrarModalEliminar}
        >
          <div
            className="modal-dark bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <FiTrash className="text-rose-300" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Eliminar Miembro
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Esta accion no se puede deshacer
                  </p>
                </div>
              </div>

              <p className="text-slate-200 mb-6">
                ¿Estas seguro de que deseas eliminar a{" "}
                <span className="font-semibold">{miembroEliminar.nombre}</span>?
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-300">
                  <strong>Nota:</strong> El historial de aportes y gastos del miembro se
                  conservara con su nombre para mantener la transparencia de los registros
                  del club.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModalEliminar}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={eliminarMiembro}
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition disabled:bg-slate-700"
                  disabled={guardando}
                >
                  {guardando ? "Eliminando..." : "Eliminar"}
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
    </div>
  );
}
