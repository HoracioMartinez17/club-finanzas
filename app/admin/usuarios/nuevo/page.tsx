"use client";

import { useState } from "react";
import { AdminForm, FormField } from "@/components/AdminForm";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function NuevoUsuario() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const fields: FormField[] = [
    {
      name: "nombre",
      label: "Nombre Completo",
      type: "text",
      required: true,
      placeholder: "Ej: Carlos Martínez",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "usuario@example.com",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "text",
      required: true,
      placeholder: "Contraseña segura",
    },
    {
      name: "rol",
      label: "Rol",
      type: "select",
      required: true,
      options: [
        { value: "admin", label: "Administrador" },
        { value: "tesorero", label: "Tesorero" },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Usuario creado correctamente");
        setTimeout(() => {
          router.push("/admin/usuarios");
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al crear el usuario");
      }
    } catch (error) {
      toast.error("Error al crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminForm
        title="Nuevo Usuario Administrador"
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/usuarios")}
        loading={loading}
      />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          success: {
            style: {
              background: "#3b82f6",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#3b82f6",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#ef4444",
            },
          },
        }}
      />
    </div>
  );
}
