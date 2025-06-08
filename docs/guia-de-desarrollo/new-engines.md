# Guía para Crear Nuevos Engines

Esta guía detalla todos los pasos necesarios para crear un nuevo engine en el sistema, basada en la experiencia de implementar el Legal Engine.

## 📋 Checklist de Archivos a Actualizar

### 1. **Configuración Central de Features**

#### ✅ `src/config/features.ts`
```typescript
{
  id: 'NUEVO_ENGINE',
  label: 'Nuevo Engine',
  description: 'Descripción del nuevo engine',
  category: 'Engine',
}
```

#### ✅ `src/hooks/useFeatureAccess.tsx`
- Agregar al tipo `FeatureType`
- Agregar pricing en `calculateCost()`

### 2. **Páginas de Super Admin**

#### ✅ `src/app/[locale]/super-admin/tenants/edit/[id]/page.tsx`
```typescript
const AVAILABLE_FEATURES = [
  // ... otros features
  { id: 'NUEVO_ENGINE', name: 'Nuevo Engine', description: 'Descripción' },
];
```

#### ✅ `src/app/[locale]/super-admin/tenants/create/page.tsx`
```typescript
const AVAILABLE_FEATURES = [
  // ... otros features
  { id: 'NUEVO_ENGINE', name: 'Nuevo Engine', description: 'Descripción' },
];
```

### 3. **Layouts de Tenant**

#### ✅ `src/app/[locale]/[tenantSlug]/layout.tsx`
```typescript
: ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE', 'BOOKING_ENGINE', 'ECOMMERCE_ENGINE', 'NUEVO_ENGINE'];
```

#### ✅ `src/app/[locale]/[tenantSlug]/dashboard/layout.tsx`
```typescript
: ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE', 'BOOKING_ENGINE', 'ECOMMERCE_ENGINE', 'NUEVO_ENGINE'];
```

### 4. **Configuración de Navegación**

#### ✅ `src/app/components/navigation/tenantDashboard/tenantSidebarConfig.ts`
```typescript
{
  name: 'sidebar.nuevoEngine',
  href: `/${locale}/${tenantSlug}/dashboard/(engines)/nuevo`,
  icon: NuevoIcon,
  features: ['NUEVO_ENGINE'],
  children: [
    {
      name: 'sidebar.nuevoItem1',
      href: `/${locale}/${tenantSlug}/dashboard/(engines)/nuevo/item1`,
      icon: Item1Icon,
    },
    // ... más items
  ]
}
```

### 5. **Configuración de Onboarding**

#### ✅ `src/config/onboarding-features.ts`
```typescript
{
  id: 'NUEVO_ENGINE',
  label: 'Nuevo Engine',
  description: 'Descripción completa del nuevo engine',
  category: 'Engine',
  dependencies: ['CMS_ENGINE'],
  icon: '🔧'
}
```

### 6. **Traducciones**

#### ✅ `src/app/[locale]/locales/en.json`
```json
{
  "sidebar": {
    "nuevoEngine": "Nuevo Engine",
    "nuevoItem1": "Item 1",
    "nuevoItem2": "Item 2"
  }
}
```

#### ✅ `src/app/[locale]/locales/es.json`
```json
{
  "sidebar": {
    "nuevoEngine": "Nuevo Engine",
    "nuevoItem1": "Item 1",
    "nuevoItem2": "Item 2"
  }
}
```

#### ✅ `src/app/[locale]/locales/de.json`
```json
{
  "sidebar": {
    "nuevoEngine": "Neuer Engine",
    "nuevoItem1": "Element 1",
    "nuevoItem2": "Element 2"
  }
}
```

### 7. **Estructura de Carpetas del Engine**

#### ✅ Crear estructura de carpetas:
```
src/app/[locale]/[tenantSlug]/dashboard/(engines)/nuevo/
├── page.tsx                    # Dashboard principal
├── item1/
│   └── page.tsx               # Página del item 1
├── item2/
│   └── page.tsx               # Página del item 2
├── configuracion/
│   └── page.tsx               # Configuración del engine
└── components/
    ├── NuevoComponent.tsx     # Componentes específicos
    └── NuevoForm.tsx          # Formularios específicos
```

### 8. **Componentes Base del Engine**

#### ✅ `src/app/[locale]/[tenantSlug]/dashboard/(engines)/nuevo/page.tsx`
```typescript
'use client';

import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export default function NuevoEnginePage() {
  const { hasFeature } = useFeatureAccess();

  if (!hasFeature('NUEVO_ENGINE')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
          <p className="text-gray-600">Nuevo Engine is not enabled for this tenant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔧 Nuevo Engine</h1>
        <p className="text-gray-600">Gestión del nuevo engine</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard del Nuevo Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenido principal del engine...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🔧 Configuración Centralizada (Propuesta)

Para simplificar el proceso, se propone crear un archivo de configuración centralizada:

### `src/config/engines.ts`
```typescript
export interface EngineConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  pricing: number;
  category: 'Engine' | 'Module';
  dependencies?: string[];
  routes: {
    main: string;
    children?: {
      name: string;
      path: string;
      icon?: string;
    }[];
  };
  translations: {
    en: Record<string, string>;
    es: Record<string, string>;
    de: Record<string, string>;
  };
}

export const ENGINES_CONFIG: EngineConfig[] = [
  {
    id: 'LEGAL_ENGINE',
    name: 'Legal Engine',
    description: 'Company incorporation and legal services',
    icon: '💼',
    pricing: 30,
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    routes: {
      main: '/dashboard/(engines)/legal',
      children: [
        { name: 'incorporations', path: '/incorporations', icon: '🏢' },
        { name: 'calendar', path: '/calendar', icon: '📅' },
        { name: 'clients', path: '/clients', icon: '👥' },
        { name: 'documents', path: '/documents', icon: '📄' },
        { name: 'billing', path: '/billing', icon: '💰' },
        { name: 'reports', path: '/reports', icon: '📊' },
        { name: 'booking-config', path: '/booking-config', icon: '⚙️' },
        { name: 'settings', path: '/settings', icon: '🔧' },
      ]
    },
    translations: {
      en: {
        'sidebar.legalEngine': 'Legal Engine',
        'sidebar.incorporations': 'Incorporations',
        'sidebar.legalCalendar': 'Legal Calendar',
        'sidebar.legalClients': 'Legal Clients',
        'sidebar.legalDocuments': 'Legal Documents',
        'sidebar.legalBilling': 'Legal Billing',
        'sidebar.legalReports': 'Legal Reports',
        'sidebar.bookingConfiguration': 'Booking Configuration',
        'sidebar.legalSettings': 'Legal Settings',
      },
      es: {
        'sidebar.legalEngine': 'Motor Legal',
        'sidebar.incorporations': 'Incorporaciones',
        'sidebar.legalCalendar': 'Calendario Legal',
        'sidebar.legalClients': 'Clientes Legales',
        'sidebar.legalDocuments': 'Documentos Legales',
        'sidebar.legalBilling': 'Facturación Legal',
        'sidebar.legalReports': 'Reportes Legales',
        'sidebar.bookingConfiguration': 'Configuración de Citas',
        'sidebar.legalSettings': 'Configuración Legal',
      },
      de: {
        'sidebar.legalEngine': 'Rechts-Engine',
        'sidebar.incorporations': 'Unternehmensgründungen',
        'sidebar.legalCalendar': 'Rechtskalender',
        'sidebar.legalClients': 'Rechtskunden',
        'sidebar.legalDocuments': 'Rechtsdokumente',
        'sidebar.legalBilling': 'Rechtsabrechnung',
        'sidebar.legalReports': 'Rechtsberichte',
        'sidebar.bookingConfiguration': 'Terminbuchung Konfiguration',
        'sidebar.legalSettings': 'Rechtseinstellungen',
      }
    }
  }
  // ... más engines
];

// Funciones helper
export const getEngineById = (id: string) => 
  ENGINES_CONFIG.find(engine => engine.id === id);

export const getAllEngineFeatures = () => 
  ENGINES_CONFIG.map(engine => ({
    id: engine.id,
    label: engine.name,
    description: engine.description,
    category: engine.category,
    dependencies: engine.dependencies
  }));

export const getEngineNavigation = (locale: string, tenantSlug: string) => 
  ENGINES_CONFIG.map(engine => ({
    name: `sidebar.${engine.id.toLowerCase()}`,
    href: `/${locale}/${tenantSlug}${engine.routes.main}`,
    icon: engine.icon,
    features: [engine.id],
    children: engine.routes.children?.map(child => ({
      name: `sidebar.${child.name}`,
      href: `/${locale}/${tenantSlug}${engine.routes.main}${child.path}`,
      icon: child.icon
    }))
  }));

export const getEngineTranslations = (locale: 'en' | 'es' | 'de') => {
  const translations: Record<string, string> = {};
  ENGINES_CONFIG.forEach(engine => {
    Object.assign(translations, engine.translations[locale]);
  });
  return translations;
};
```

## 🚀 Script de Generación Automática

### `scripts/generate-engine.js`
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateEngine(engineId, engineName, description) {
  const engineConfig = {
    id: engineId,
    name: engineName,
    description: description,
    // ... resto de la configuración
  };

  // 1. Actualizar src/config/engines.ts
  // 2. Generar estructura de carpetas
  // 3. Crear archivos base
  // 4. Actualizar traducciones
  // 5. Actualizar configuraciones

  console.log(`✅ Engine ${engineName} generado exitosamente!`);
}

// Uso: node scripts/generate-engine.js NUEVO_ENGINE "Nuevo Engine" "Descripción"
const [engineId, engineName, description] = process.argv.slice(2);
generateEngine(engineId, engineName, description);
```

## 📝 Pasos para Crear un Nuevo Engine

1. **Ejecutar script de generación** (futuro):
   ```bash
   node scripts/generate-engine.js NUEVO_ENGINE "Nuevo Engine" "Descripción del engine"
   ```

2. **Actualizar manualmente** (actual):
   - Seguir el checklist de archivos
   - Crear estructura de carpetas
   - Implementar componentes específicos
   - Agregar traducciones
   - Probar funcionalidad

3. **Verificar integración**:
   - Super Admin puede habilitar/deshabilitar el engine
   - Navegación aparece cuando está habilitado
   - Traducciones funcionan correctamente
   - Componentes renderizan sin errores

## 🔍 Verificación Final

- [ ] Engine aparece en Super Admin (crear/editar tenant)
- [ ] Navegación se muestra cuando está habilitado
- [ ] Páginas principales funcionan
- [ ] Traducciones están completas
- [ ] Verificación de features funciona
- [ ] Pricing se calcula correctamente
- [ ] Dependencias se respetan

## 📚 Recursos Adicionales

- **Ejemplo completo**: Legal Engine (`src/app/[locale]/[tenantSlug]/dashboard/(engines)/legal/`)
- **Configuración de navegación**: `tenantSidebarConfig.ts`
- **Sistema de features**: `useFeatureAccess.tsx`
- **Configuración central**: `src/config/features.ts`

---

**Nota**: Esta guía se basa en la implementación del Legal Engine y debe actualizarse conforme evolucione el sistema. 