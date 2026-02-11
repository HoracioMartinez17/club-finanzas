"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

export default function NuevoClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    planId: "free",
    logoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token_superadmin");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/super-admin/clubes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear club");
      }

      toast.success("Club creado correctamente");
      setTimeout(() => router.push("/super-admin/clubes"), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generar slug cuando se escribe el nombre
    if (name === "nombre" && !formData.slug) {
      const autoSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y caracteres especiales con guiones
        .replace(/^-+|-+$/g, ""); // Quitar guiones del inicio y final
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/super-admin/clubes"
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium mb-4 inline-flex transition-colors"
          >
            <FiArrowLeft />
            <span>Volver a clubes</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Crear Nuevo Club</h1>
          <p className="text-slate-400">Configura un nuevo club en el sistema</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Nombre del Club <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-100 placeholder-slate-500 transition-all"
                placeholder="Ej: Sporting Club Luqueño"
              />
              <p className="text-sm text-slate-500 mt-2">
                El nombre completo del club tal como aparecerá en el sistema
              </p>
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Slug (URL) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center">
                <span className="text-slate-400 bg-slate-900/50 px-4 py-3 border border-r-0 border-slate-700 rounded-l-lg font-mono">
                  /
                </span>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-r-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-100 placeholder-slate-500 font-mono transition-all"
                  placeholder="sporting-luqueno"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Solo letras minúsculas, números y guiones. Se usa en la URL: /
                <span className="font-mono text-cyan-400">{formData.slug || "slug"}</span>
              </p>
            </div>

            {/* Plan */}
            <div>
              <label
                htmlFor="planId"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Plan
              </label>
              <select
                id="planId"
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-100 transition-all"
              >
                <option value="free">Gratis - Sin costo, funcionalidades básicas</option>
                <option value="pro">Pro - Funcionalidades avanzadas</option>
                <option value="enterprise">Enterprise - Todas las funcionalidades</option>
              </select>
            </div>

            {/* Logo URL */}
            <div>
              <label
                htmlFor="logoUrl"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                URL del Logo (opcional)
              </label>
              <input
                type="url"
                id="logoUrl"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-100 placeholder-slate-500 transition-all"
                placeholder="https://ejemplo.com/logo.png"
              />
              <p className="text-sm text-slate-500 mt-2">
                URL pública de la imagen del logo
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/50 my-6"></div>

            {/* Info Box */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex gap-3">
                <FiInfo className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-cyan-300">
                  <p className="font-semibold mb-2">Al crear el club se configurará:</p>
                  <ul className="space-y-1 text-cyan-400/80">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                      Configuración inicial del club
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                      Transparencia pública activada por defecto
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                      Estado activo
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link
                href="/super-admin/clubes"
                className="px-6 py-3 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700/30 transition-all font-medium"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-cyan-500/20"
              >
                {loading ? "Creando..." : "Crear Club"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
