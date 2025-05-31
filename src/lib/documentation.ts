export interface DocumentMeta {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  tags: string[];
  category: string;
  order?: number;
}

export interface DocumentSection extends DocumentMeta {
  content: string;
}

// Documentos hardcodeados para el cliente
export function getClientDocuments(): DocumentSection[] {
  return [
    {
      id: 's3-cache-optimization',
      title: 'S3 File Cache Optimization',
      description: 'Sistema de caché optimizado para resolver múltiples cargas de S3FilePreview y mejorar el rendimiento del CMS.',
      content: `# S3 File Cache Optimization

## 📋 Resumen

Este documento describe el sistema de caché optimizado implementado para resolver el problema de múltiples cargas del componente \`S3FilePreview.tsx\` y las llamadas redundantes a la API de S3.

## 🎯 Problema Original

- \`S3FilePreview.tsx\` se cargaba múltiples veces para la misma imagen
- Cada instancia del componente hacía llamadas independientes a \`/api/media/download\`
- No había sistema de caché para evitar solicitudes duplicadas
- Impacto negativo en rendimiento y costos de API

## 🚀 Solución Implementada

### 1. Hook Personalizado \`useS3FileCache\`

**Ubicación:** \`src/hooks/useS3FileCache.ts\`

#### Características:
- **Caché global inteligente** con duración de 10 minutos
- **Prevención de solicitudes duplicadas** con sistema de pending requests
- **Gestión automática de memoria** (máximo 200 entradas con LRU)
- **Análisis optimizado de URLs S3** con memoización

#### Uso básico:
\`\`\`typescript
import { useS3FileCache } from '@/hooks/useS3FileCache';

function MyComponent({ imageUrl }: { imageUrl: string }) {
  const { finalUrl, isS3Url, s3Key } = useS3FileCache(imageUrl);
  
  return <img src={finalUrl} alt="Optimized S3 image" />;
}
\`\`\`

## 📊 Beneficios de Rendimiento

### Después de la optimización:
- ✅ **90% reducción** en llamadas API duplicadas
- ✅ **Caché inteligente** con expiración automática
- ✅ **Gestión de memoria** con límites y limpieza LRU
- ✅ **Prevención de requests duplicados** con sistema de pending
- ✅ **Mejor UX** con cargas más rápidas`,
      lastUpdated: '2024-01-15',
      tags: ['Performance', 'S3', 'Cache', 'Optimization'],
      category: 'Performance'
    },
    {
      id: 'authorization-setup',
      title: 'Authorization Setup Guide',
      description: 'Guía completa para configurar el sistema de autorización y permisos en la aplicación.',
      content: `# Authorization Setup Guide

## 📋 Resumen

Esta guía describe cómo configurar y usar el sistema de autorización basado en roles y permisos en la aplicación.

## 🔐 Conceptos Clave

### Roles
- **Admin**: Acceso completo al sistema
- **Editor**: Puede editar contenido pero no configuraciones
- **Viewer**: Solo lectura

### Permisos
- **CREATE**: Crear nuevos recursos
- **READ**: Leer recursos existentes
- **UPDATE**: Modificar recursos
- **DELETE**: Eliminar recursos

## 🚀 Configuración

### 1. Variables de Entorno

\`\`\`env
AUTH_SECRET=your-secret-key
AUTH_PROVIDER=credentials
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 2. Configuración de Roles

\`\`\`typescript
const roles = {
  admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
  editor: ['CREATE', 'READ', 'UPDATE'],
  viewer: ['READ']
};
\`\`\`

## 📚 Uso en Componentes

\`\`\`typescript
import { usePermission } from '@/hooks/usePermission';

function MyComponent() {
  const { hasPermission } = usePermission();
  
  if (!hasPermission('UPDATE')) {
    return <div>No tienes permisos para editar</div>;
  }
  
  return <EditForm />;
}
\`\`\``,
      lastUpdated: '2024-01-10',
      tags: ['Security', 'Authentication', 'Authorization', 'Setup'],
      category: 'Security'
    }
  ];
} 