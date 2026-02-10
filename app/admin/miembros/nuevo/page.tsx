"use client";

import { useState } from "react";
import { AdminForm, FormField } from "@/components/AdminForm";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function NuevoMiembro() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const fields: FormField[] = [
    {
      name: "nombre",
      label: "Nombre Completo",
      type: "text",
      required: true,
      placeholder: "Ej: Juan García López",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: false,
      placeholder: "juan@example.com",
    },
    {
      name: "telefono",
      label: "Teléfono",
      type: "text",
      required: false,
      placeholder: "Ej: 123456789",
    },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      required: true,
      options: [
        { value: "activo", label: "Activo" },
        { value: "inactivo", label: "Inactivo" },
      ],
    },
    {
      name: "deudaCuota",
      label: "Deuda de Cuota ($)",
      type: "number",
      required: false,
      placeholder: "0",
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/miembros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          deudaCuota: parseFloat(data.deudaCuota) || 0,
        }),
      });

      if (response.ok) {
        toast.success("Miembro creado correctamente");
        setTimeout(() => {
          router.push("/admin/miembros");
        }, 2000);
      } else {
        toast.error("Error al crear el miembro");
      }
    } catch (error) {
      toast.error("Error al crear el miembro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: "#3b82f6",
              color: "white",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "white",
            },
          },
        }}
      />
      <AdminForm
        title="Nuevo Miembro"
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/miembros")}
        loading={loading}
      />
    </div>
  );
}
