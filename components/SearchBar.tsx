"use client";

import { useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = "Buscar...",
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Limpiar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Establecer nuevo timeout para debounce
    const newTimeoutId = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    setTimeoutId(newTimeoutId);
  };

  const handleClear = () => {
    setQuery("");
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onSearch("");
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
        <FiSearch className="text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 ml-2 px-2 py-1 outline-none bg-transparent text-slate-100 placeholder:text-slate-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            <FiX />
          </button>
        )}
      </div>
    </div>
  );
}
