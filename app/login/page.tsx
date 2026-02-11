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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 via-blue-400 to-transparent rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-600 via-transparent to-transparent rounded-full blur-3xl opacity-15" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-500 to-transparent rounded-full blur-3xl opacity-10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 text-white font-bold text-lg mb-4">
            ⚽
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Club Finanzas</h1>
          <p className="text-sm text-slate-300">Gestiona tu club de fútbol</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-red-200">{error}</p>
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
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm placeholder-slate-400 text-white transition-all focus:outline-none focus:bg-slate-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 backdrop-blur-sm"
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
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm placeholder-slate-400 text-white transition-all focus:outline-none focus:bg-slate-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 backdrop-blur-sm"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-blue-500/50"
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
          <div className="flex-1 h-px bg-slate-700" />
          <p className="text-xs text-slate-400">O</p>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-400">
            ¿Necesitas ayuda?{" "}
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">
              Contactar administrador
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-xs text-slate-400">
            No eres admin?{" "}
            <Link href="/" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
              Volver al inicio
            </Link>
          </p>
          <p className="text-xs text-slate-500">© 2026 Club Finanzas</p>
          <p className="text-xs text-slate-600">Creado por <span className="text-purple-500 font-medium">Horacio Benítez</span></p>
        </div>
      </div>
    </div>
  );
}
