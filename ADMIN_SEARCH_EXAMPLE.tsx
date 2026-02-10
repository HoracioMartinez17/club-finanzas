// Ejemplo de cómo usar la búsqueda en una página admin
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AdminTable, TableColumn } from "@/components/AdminTable";
import { SearchBar } from "@/components/SearchBar";
import { FiPlus } from "react-icons/fi";

interface Colecta {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  totalAportado: number;
  estado: string;
}

export default function AdminColectasConBusqueda() {
  const [colectas, setColectas] = useState<Colecta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    cargarColectas();
  }, []);

  const cargarColectas = async () => {
    try {
      // Intentar API real
      try {
        const res = await fetch("/api/colectas");
        if (res.ok) {
          const data = await res.json();
          setColectas(data);
          return;
        }
      } catch {
        console.log("API real no disponible");
      }

      // Fallback a mock
      const res = await fetch("/api/colectas/mock");
      if (res.ok) {
        const data = await res.json();
        setColectas(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar colectas según búsqueda
  const colectasFiltradas = useMemo(() => {
    if (!searchQuery) return colectas;

    return colectas.filter(
      (colecta) =>
        colecta.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        colecta.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [colectas, searchQuery]);

  const handleEdit = (colecta: Colecta) => {
    console.log("Editar:", colecta);
  };

  const handleDelete = async (colecta: Colecta) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la colecta "${colecta.nombre}"?`)) {
      try {
        const res = await fetch(`/api/colectas/${colecta.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setColectas(colectas.filter((c) => c.id !== colecta.id));
          alert("Colecta eliminada correctamente");
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar la colecta");
      }
    }
  };

  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "descripcion", label: "Descripción" },
    {
      key: "objetivo",
      label: "Objetivo",
      render: (value) => `$${value.toLocaleString()}`,
    },
    {
      key: "totalAportado",
      label: "Aportado",
      render: (value) => `$${value.toLocaleString()}`,
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            value === "activa"
              ? "bg-green-100 text-green-800"
              : value === "cerrada"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestionar Colectas</h1>
        <Link
          href="/admin/colectas/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Nueva Colecta
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <SearchBar
          placeholder="Buscar colecta por nombre o descripción..."
          onSearch={setSearchQuery}
        />

        <AdminTable
          columns={columns}
          data={colectasFiltradas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage={
            searchQuery
              ? "No se encontraron colectas que coincidan con la búsqueda"
              : "No hay colectas registradas"
          }
        />
      </div>
    </div>
  );
}
