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
  };
}

// Hook para una colecta específica
export function useColecta(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/colectas/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    },
  );

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

  return {
    usuarios: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/usuarios"),
  };
}

// Hook para aportes
export function useAportes() {
  const { data, error, isLoading } = useSWR("/api/colectas/aportes", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  return {
    aportes: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/colectas/aportes"),
  };
}

// Hook para gastos
export function useGastos() {
  const { data, error, isLoading } = useSWR("/api/gastos", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  return {
    gastos: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/gastos"),
  };
}

// Hook para ingresos
export function useIngresos() {
  const { data, error, isLoading } = useSWR("/api/ingresos", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  return {
    ingresos: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/ingresos"),
  };
}

// Hook para deudas
export function useDeudas() {
  const { data, error, isLoading } = useSWR("/api/deudas", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  return {
    deudas: data || [],
    isLoading,
    isError: error,
    mutate: () => mutate("/api/deudas"),
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
