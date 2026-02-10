"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Guardar token en cookies (la API lo hace)
      // También guardamos en localStorage para acceso del cliente
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Redirigir según el rol
      if (data.user?.rol === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 via-transparent to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-100 via-transparent to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-black text-white font-bold text-lg mb-4">
            ⚽
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Club Finanzas</h1>
          <p className="text-sm text-gray-700">Gestiona tu club de fútbol</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* Email Input */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@email.com"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-600 transition-colors focus:outline-none focus:bg-white focus:ring-1 focus:ring-black"
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-600 transition-colors focus:outline-none focus:bg-white focus:ring-1 focus:ring-black"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <p className="text-xs text-gray-700">O</p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Demo Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 mb-6">
          <p className="text-xs font-semibold text-gray-900">Demo</p>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-mono text-gray-900">admin@club.com</span>
            </div>
            <div className="flex justify-between">
              <span>Pass:</span>
              <span className="font-mono text-gray-900">••••••••</span>
            </div>
          </div>
          <p className="text-xs text-gray-700 pt-2 border-t border-gray-200">
            Ver en seed.ts
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-xs text-gray-600">
            No eres admin?{" "}
            <Link href="/" className="text-black hover:underline font-medium">
              Volver al inicio
            </Link>
          </p>
          <p className="text-xs text-gray-700">© 2026 Club Finanzas</p>
        </div>
      </div>
    </div>
  );
}
