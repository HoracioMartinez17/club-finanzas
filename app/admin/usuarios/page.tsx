"use client";

import { useState } from "react";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import { FiPlus, FiX, FiSave, FiEye, FiEyeOff } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useUsuarios } from "@/lib/hooks/useData";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
}

export default function AdminUsuarios() {
  const {
    usuarios,
    isLoading: loading,
    mutate: recargarUsuarios,
    optimisticAdd,
    optimisticEdit,
    optimisticDelete,
  } = useUsuarios();
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarPasswordEditar, setMostrarPasswordEditar] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "admin",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const validarFormulario = (esEdicion = false) => {
    const nuevosErrores: FormErrors = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      nuevosErrores.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = "Email inválido";
    }

    // La contraseña solo es requerida en creación
    if (!esEdicion) {
      if (!formData.password.trim()) {
        nuevosErrores.password = "La contraseña es requerida";
      } else if (formData.password.length < 6) {
        nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
      }
    } else if (formData.password.trim() && formData.password.length < 6) {
      nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.rol) {
      nuevosErrores.rol = "Selecciona un rol";
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Agregar con ID temporal
    const tempId = `temp-${Date.now()}`;
    optimisticAdd({
      id: tempId,
      ...formData,
      password: "", // No mostrar password en UI
    });

    toast.success("Usuario creado correctamente");
    cerrarModal();

    setGuardando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Recargar para obtener ID real
        recargarUsuarios();
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al crear el usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el usuario");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFormData({
      nombre: "",
      email: "",
      password: "",
      rol: "admin",
    });
    setErrors({});
    setMostrarPassword(false);
  };

  const handleEdit = (usuario: Usuario) => {
    setUsuarioEditar(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
    });
    setModalEditarAbierto(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setUsuarioEditar(null);
    setFormData({
      nombre: "",
      email: "",
      password: "",
      rol: "admin",
    });
    setErrors({});
    setMostrarPasswordEditar(false);
  };

  const actualizarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario(true) || !usuarioEditar) return;

    const payload: any = {
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol,
    };

    // Solo incluir contraseña si se proporcionó una nueva
    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    // Actualizar UI inmediatamente
    optimisticEdit(usuarioEditar.id, payload);
    toast.success("Usuario actualizado correctamente");
    cerrarModalEditar();

    setGuardando(true);
    try {
      const res = await fetch(`/api/usuarios/${usuarioEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Si falla, revertir
        const data = await res.json();
        toast.error(data.message || "Error al actualizar el usuario");
        recargarUsuarios();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el usuario");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    setUsuarioEliminar(usuario);
    setMostrarConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!usuarioEliminar) return;

    const idEliminar = usuarioEliminar.id;

    // Eliminar de UI inmediatamente
    optimisticDelete(idEliminar);
    toast.success("Usuario eliminado correctamente");
    setMostrarConfirm(false);
    setUsuarioEliminar(null);

    try {
      const res = await fetch(`/api/usuarios/${idEliminar}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Si falla, revertir
        toast.error("Error al eliminar el usuario");
        recargarUsuarios();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el usuario");
    }
  };

  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "email", label: "Email" },
    {
      key: "rol",
      label: "Rol",
      render: (value) => (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-200">
          {value}
        </span>
      ),
    },
    {
      key: "activo",
      label: "Estado",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium
            value ? \"bg-emerald-500/20 text-emerald-200\" : \"bg-rose-500/20 text-rose-200\"
          }`}
        >
          {value ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    { key: "fechaCreacion", label: "Fecha Creación" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Administración
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Gestionar Usuarios</h1>
            <p className="text-sm text-slate-400">
              Controla el acceso y los permisos de los usuarios
            </p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition w-full sm:w-auto"
          >
            <FiPlus /> Nuevo Usuario
          </button>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
        <AdminTable
          columns={columns}
          data={usuarios}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay usuarios registrados"
          itemsPerPage={10}
        />
      </div>

      {/* Modal Editar Usuario */}
      {modalEditarAbierto && usuarioEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-lg border border-slate-800 shadow-xl max-w-md w-full animation-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-slate-100">Editar Usuario</h2>
              <button
                onClick={cerrarModalEditar}
                className="text-slate-400 hover:text-slate-300 transition"
              >
                <FiX size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={actualizarUsuario} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Carlos Martínez"
                  className={`w-full px-4 py-2 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 ${
                    errors.nombre ? "border-rose-400" : "border-slate-700"
                  }`}
                />
                {errors.nombre && (
                  <p className="text-rose-400 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@example.com"
                  className={`w-full px-4 py-2 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 ${
                    errors.email ? "border-rose-400" : "border-slate-700"
                  }`}
                />
                {errors.email && (
                  <p className="text-rose-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nueva Contraseña{" "}
                  <span className="text-slate-500 text-xs">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type={mostrarPasswordEditar ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Dejar vacío para mantener actual"
                    className={`w-full px-4 py-2 pr-10 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 ${
                      errors.password ? "border-rose-400" : "border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordEditar(!mostrarPasswordEditar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                  >
                    {mostrarPasswordEditar ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rol <span className="text-rose-400">*</span>
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                    errors.rol ? "border-rose-400" : "border-slate-700"
                  }`}
                >
                  <option value="admin">Administrador</option>
                  <option value="tesorero">Tesorero</option>
                </select>
                {errors.rol && <p className="text-rose-400 text-sm mt-1">{errors.rol}</p>}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiSave size={18} />
                  {guardando ? "Guardando..." : "Actualizar Usuario"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  disabled={guardando}
                  className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-lg border border-slate-800 shadow-xl max-w-md w-full animation-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-slate-100">Nuevo Usuario</h2>
              <button
                onClick={cerrarModal}
                className="text-slate-400 hover:text-slate-300 transition"
              >
                <FiX size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={crearUsuario} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Carlos Martínez"
                  className={`w-full px-4 py-2 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 ${
                    errors.nombre ? "border-rose-400" : "border-slate-700"
                  }`}
                />
                {errors.nombre && (
                  <p className="text-rose-400 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@example.com"
                  className={`w-full px-4 py-2 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 ${
                    errors.email ? "border-rose-400" : "border-slate-700"
                  }`}
                />
                {errors.email && (
                  <p className="text-rose-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Contraseña segura"
                    className={`w-full px-4 py-2 pr-10 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 ${
                      errors.password ? "border-rose-400" : "border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                  >
                    {mostrarPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rol <span className="text-rose-400">*</span>
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                    errors.rol ? "border-rose-400" : "border-slate-700"
                  }`}
                >
                  <option value="admin">Administrador</option>
                  <option value="tesorero">Tesorero</option>
                </select>
                {errors.rol && <p className="text-rose-400 text-sm mt-1">{errors.rol}</p>}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiSave size={18} />
                  {guardando ? "Guardando..." : "Crear Usuario"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
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
        reverseOrder={false}
        toastOptions={{
          success: {
            style: {
              background: "#363636",
              color: "#86efac",
              border: "1px solid #475569",
            },
            iconTheme: {
              primary: "#86efac",
              secondary: "#363636",
            },
          },
          error: {
            style: {
              background: "#363636",
              color: "#fca5a5",
              border: "1px solid #475569",
            },
            iconTheme: {
              primary: "#fca5a5",
              secondary: "#363636",
            },
          },
        }}
      />

      {mostrarConfirm && usuarioEliminar && (
        <ConfirmDialog
          title="Eliminar Usuario"
          message={`¿Estás seguro de que deseas eliminar a ${usuarioEliminar.nombre}?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmarEliminacion}
          onCancel={() => {
            setMostrarConfirm(false);
            setUsuarioEliminar(null);
          }}
          isDangerous={true}
        />
      )}
    </div>
  );
}
