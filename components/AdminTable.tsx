"use client";

import React, { useState, useMemo } from "react";
import { FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

interface AdminTableProps {
  columns: TableColumn[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export function AdminTable({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  itemsPerPage = 10,
}: AdminTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const { paginatedData, totalPages, startIndex, endIndex } = useMemo(() => {
    const total = Math.ceil(data.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      paginatedData: data.slice(start, end),
      totalPages: total,
      startIndex: start + 1,
      endIndex: Math.min(end, data.length),
    };
  }, [data, currentPage, itemsPerPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-200">Cargando...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-slate-400">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-800"
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                className="border-b border-slate-800 hover:bg-slate-900/60 transition"
              >
                {columns.map((col) => (
                  <td
                    key={`${row.id || idx}-${col.key}`}
                    className="px-6 py-4 text-sm text-slate-200"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 text-sky-300 hover:bg-slate-800 rounded transition"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-rose-300 hover:bg-slate-800 rounded transition"
                          title="Eliminar"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para móvil */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((row, idx) => (
          <div
            key={row.id || idx}
            className="border border-slate-800 rounded-lg p-4 bg-slate-950 hover:shadow-md transition"
          >
            {columns.map((col) => (
              <div key={`${row.id || idx}-${col.key}`} className="mb-3 last:mb-0">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                  {col.label}
                </div>
                <div className="text-sm text-slate-100">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </div>
              </div>
            ))}
            {(onEdit || onDelete) && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sky-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    <FiEdit2 /> Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(row)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-rose-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="text-sm text-slate-400">
          Mostrando{" "}
          <span className="font-semibold">
            {startIndex}-{endIndex}
          </span>{" "}
          de <span className="font-semibold text-slate-200">{data.length}</span> registros
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            Pagina <span className="font-semibold text-slate-200">{currentPage}</span> de{" "}
            <span className="font-semibold text-slate-200">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-800 text-slate-200 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft size={18} />{" "}
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-800 text-slate-200 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="hidden sm:inline">Siguiente</span>{" "}
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
