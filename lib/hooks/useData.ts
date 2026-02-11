import useSWR from "swr";
import { mutate } from "swr";

// Fetcher genérico que incluye auth
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: any = new Error("Error al cargar datos");
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// Hook para miembros
export function useMiembros() {
  const { data, error, isLoading } = useSWR("/api/miembros", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minuto
  });

  return {
    miembros: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/miembros"),
    // Mutación optimista - actualiza UI inmediatamente
    optimisticUpdate: (updater: any) => mutate("/api/miembros", updater, false),
    // Agregar sin recargar
    optimisticAdd: (newItem: any) =>
      mutate("/api/miembros", (data: any) => [...(data || []), newItem], false),
    // Actualizar sin recargar
    optimisticEdit: (id: string, updates: any) =>
      mutate(
        "/api/miembros",
        (data: any) =>
          (data || []).map((item: any) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        false,
      ),
    // Eliminar sin recargar
    optimisticDelete: (id: string) =>
      mutate(
        "/api/miembros",
        (data: any) => (data || []).filter((item: any) => item.id !== id),
        false,
      ),
  };
}

// Hook para colectas
export function useColectas() {
  const { data, error, isLoading } = useSWR("/api/colectas", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  return {
    colectas: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/colectas"),
    optimisticUpdate: (updater: any) => mutate("/api/colectas", updater, false),
    optimisticAdd: (newItem: any) =>
      mutate("/api/colectas", (data: any) => [...(data || []), newItem], false),
    optimisticEdit: (id: string, updates: any) =>
      mutate(
        "/api/colectas",
        (data: any) =>
          (data || []).map((item: any) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        false,
      ),
    optimisticDelete: (id: string) =>
      mutate(
        "/api/colectas",
        (data: any) => (data || []).filter((item: any) => item.id !== id),
        false,
      ),
  };
}

// Hook para una colecta específica
export function useColecta(id: string | null) {
  const { data, error, isLoading } = useSWR(id ? `/api/colectas/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  return {
    colecta: data,
    isLoading,
    isError: error,
    mutate: () => id && mutate(`/api/colectas/${id}`),
  };
}

// Hook para usuarios
export function useUsuarios() {
  const { data, error, isLoading } = useSWR("/api/usuarios", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  const optimisticUpdate = (updater: any) => mutate("/api/usuarios", updater, false);
  const optimisticAdd = (newItem: any) =>
    mutate("/api/usuarios", (data: any) => [...(data || []), newItem], false);
  const optimisticEdit = (id: string, updates: any) =>
    mutate(
      "/api/usuarios",
      (data: any) =>
        (data || []).map((item: any) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      false,
    );
  const optimisticDelete = (id: string) =>
    mutate(
      "/api/usuarios",
      (data: any) => (data || []).filter((item: any) => item.id !== id),
      false,
    );

  return {
    usuarios: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/usuarios"),
    optimisticUpdate,
    optimisticAdd,
    optimisticEdit,
    optimisticDelete,
  };
}

// Hook para aportes
export function useAportes() {
  const { data, error, isLoading } = useSWR("/api/colectas/aportes", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  const optimisticUpdate = (updater: any) =>
    mutate("/api/colectas/aportes", updater, false);
  const optimisticAdd = (newItem: any) =>
    mutate("/api/colectas/aportes", (data: any) => [...(data || []), newItem], false);
  const optimisticEdit = (id: string, updates: any) =>
    mutate(
      "/api/colectas/aportes",
      (data: any) =>
        (data || []).map((item: any) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      false,
    );
  const optimisticDelete = (id: string) =>
    mutate(
      "/api/colectas/aportes",
      (data: any) => (data || []).filter((item: any) => item.id !== id),
      false,
    );

  return {
    aportes: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/colectas/aportes"),
    optimisticUpdate,
    optimisticAdd,
    optimisticEdit,
    optimisticDelete,
  };
}

// Hook para gastos
export function useGastos() {
  const { data, error, isLoading } = useSWR("/api/gastos", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  const optimisticUpdate = (updater: any) => mutate("/api/gastos", updater, false);
  const optimisticAdd = (newItem: any) =>
    mutate("/api/gastos", (data: any) => [...(data || []), newItem], false);
  const optimisticEdit = (id: string, updates: any) =>
    mutate(
      "/api/gastos",
      (data: any) =>
        (data || []).map((item: any) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      false,
    );
  const optimisticDelete = (id: string) =>
    mutate(
      "/api/gastos",
      (data: any) => (data || []).filter((item: any) => item.id !== id),
      false,
    );

  return {
    gastos: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/gastos"),
    optimisticUpdate,
    optimisticAdd,
    optimisticEdit,
    optimisticDelete,
  };
}

// Hook para ingresos
export function useIngresos() {
  const { data, error, isLoading } = useSWR("/api/ingresos", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  const optimisticUpdate = (updater: any) => mutate("/api/ingresos", updater, false);
  const optimisticAdd = (newItem: any) =>
    mutate("/api/ingresos", (data: any) => [...(data || []), newItem], false);
  const optimisticEdit = (id: string, updates: any) =>
    mutate(
      "/api/ingresos",
      (data: any) =>
        (data || []).map((item: any) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      false,
    );
  const optimisticDelete = (id: string) =>
    mutate(
      "/api/ingresos",
      (data: any) => (data || []).filter((item: any) => item.id !== id),
      false,
    );

  return {
    ingresos: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/ingresos"),
    optimisticUpdate,
    optimisticAdd,
    optimisticEdit,
    optimisticDelete,
  };
}

// Hook para deudas
export function useDeudas() {
  const { data, error, isLoading } = useSWR("/api/deudas", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  const optimisticUpdate = (updater: any) => mutate("/api/deudas", updater, false);
  const optimisticAdd = (newItem: any) =>
    mutate("/api/deudas", (data: any) => [...(data || []), newItem], false);
  const optimisticEdit = (id: string, updates: any) =>
    mutate(
      "/api/deudas",
      (data: any) =>
        (data || []).map((item: any) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      false,
    );
  const optimisticDelete = (id: string) =>
    mutate(
      "/api/deudas",
      (data: any) => (data || []).filter((item: any) => item.id !== id),
      false,
    );

  return {
    deudas: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/deudas"),
    optimisticUpdate,
    optimisticAdd,
    optimisticEdit,
    optimisticDelete,
  };
}

// Hook para club info (slug)
export function useClub() {
  const { data, error, isLoading } = useSWR("/api/club", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutos (cambia poco)
  });

  return {
    club: data,
    isLoading,
    isError: error,
    mutate: () => mutate("/api/club"),
  };
}

// Función helper para invalidar múltiples cachés a la vez
export function invalidarCaches(...keys: string[]) {
  keys.forEach((key) => mutate(key));
}
