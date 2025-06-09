'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

/**
 * Componente que maneja el auto-login automáticamente
 * Se debe incluir en layouts de páginas protegidas
 */
export default function AutoLoginHandler() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // El hook useAuth manejará automáticamente los parámetros de URL
    // Este componente solo asegura que el hook se ejecute
    if (!isLoading) {
      console.log('AutoLoginHandler: Auth state resolved. Authenticated:', isAuthenticated);
    }
  }, [isLoading, isAuthenticated]);

  // Este componente no renderiza nada, solo ejecuta el hook useAuth
  return null;
} 