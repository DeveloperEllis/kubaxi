'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ubicacion } from '@/types';
import { getUbicaciones } from '@/lib/services';

interface DataContextType {
  ubicaciones: Ubicacion[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUbicaciones();
      setUbicaciones(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error cargando ubicaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ 
      ubicaciones, 
      loading, 
      error, 
      refetch: fetchData 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
