"use client";

import { useState } from "react";
import { AdminForm, FormField } from "@/components/AdminForm";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function NuevaColecta() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const fields: FormField[] = [
    {
      name: "nombre",
      label: "Nombre de la Colecta",
      type: "text",
      required: true,
      placeholder: "Ej: Reparación de la cancha",
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "textarea",
      required: false,
      placeholder: "Describe el propósito de la colecta...",
    },
    {
      name: "objetivo",
      label: "Objetivo ($)",
      type: "number",
      required: true,
      placeholder: "Monto a recaudar",
    },
    {
      name: "estado",
      label: "Estado Inicial",
      type: "select",
      required: true,
      options: [
        { value: "activa", label: "Activa" },
        { value: "cerrada", label: "Cerrada" },
      ],
    },
    {
      name: "fechaCierre",
      label: "Fecha de Cierre (opcional)",
      type: "date",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/colectas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Colecta creada correctamente");
        setTimeout(() => {
          router.push("/admin/colectas");
        }, 2000);
      } else {
        toast.error("Error al crear la colecta");
      }
    } catch (error) {
      toast.error("Error al crear la colecta");
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
        title="Nueva Colecta"
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/colectas")}
        loading={loading}
      />
    </div>
  );
}
