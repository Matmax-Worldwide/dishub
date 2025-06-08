# 🏗️ Engines Documentation - Dishub Platform

## 📋 Visión General

Los **Engines** son módulos especializados que proporcionan funcionalidades completas y autónomas dentro de la plataforma Dishub. Cada engine está diseñado para manejar un aspecto específico del negocio y puede ser activado/desactivado según las necesidades del tenant.

## 📁 Estructura de Carpetas

```
src/app/[locale]/manage/[tenantSlug]/
├── cms/           # Content Management System Engine
├── bookings/      # Booking Engine
├── commerce/      # E-commerce Engine
└── hrms/          # Human Asset Management System Engine
```

## 🎯 Engines Disponibles

### 1. 📝 CMS Engine (`cms/`)
**Feature Flag:** `CMS_ENGINE` (Obligatorio)
**Descripción:** Sistema de gestión de contenido completo

**Módulos incluidos:**
- **Pages** - Gestión de páginas estáticas
- **Media** - Biblioteca de archivos multimedia
- **Blog** - Sistema de blog y artículos
- **Forms** - Constructor de formularios
- **Menus** - Gestión de menús de navegación
- **Settings** - Configuración del CMS
- **Templates** - Plantillas personalizables
- **Languages** - Gestión multiidioma

**Rutas principales:**
```
/[locale]/manage/[tenantSlug]/cms
├── /pages
├── /media
├── /blog
├── /forms
├── /menus
├── /settings
├── /templates
└── /languages
```

### 2. 📅 Booking Engine (`bookings/`)
**Feature Flag:** `BOOKING_ENGINE`
**Descripción:** Sistema completo de gestión de citas y reservas

**Módulos incluidos:**
- **Calendar** - Vista de calendario interactivo
- **List** - Lista de reservas y citas
- **Services** - Gestión de servicios ofrecidos
- **Categories** - Categorías de servicios
- **Staff** - Gestión de personal
- **Locations** - Ubicaciones disponibles
- **Rules** - Reglas de disponibilidad y negocio

**Rutas principales:**
```
/[locale]/manage/[tenantSlug]/bookings
├── /calendar
├── /list
├── /services
├── /categories
├── /staff
├── /locations
└── /rules
```

### 3. 🛒 Commerce Engine (`commerce/`)
**Feature Flag:** `ECOMMERCE_ENGINE`
**Descripción:** Plataforma completa de comercio electrónico

**Módulos incluidos:**
- **Products** - Catálogo de productos
- **Categories** - Categorización de productos
- **Inventory** - Control de inventario
- **Orders** - Gestión de pedidos
- **Customers** - Base de datos de clientes
- **Payments** - Procesamiento de pagos
- **Shipping** - Gestión de envíos
- **Taxes** - Configuración de impuestos
- **Analytics** - Análisis de ventas
- **Settings** - Configuración del e-commerce

**Rutas principales:**
```
/[locale]/manage/[tenantSlug]/commerce
├── /products
├── /categories
├── /inventory
├── /orders
├── /customers
├── /payments
├── /shipping
├── /taxes
├── /analytics
└── /settings
```

### 4. 👥 HRMS Engine (`hrms/`)
**Feature Flag:** `HRMS_MODULE`
**Descripción:** Sistema de gestión de recursos humanos

**Módulos incluidos:**
- **Employees** - Gestión de empleados
- **Departments** - Organización departamental
- **Payroll** - Procesamiento de nóminas
- **Attendance** - Control de asistencia
- **Evaluations** - Evaluación de desempeño
- **Reports** - Reportes de RRHH
- **Settings** - Configuración del HRMS

**Rutas principales:**
```
/[locale]/manage/[tenantSlug]/hrms
├── /employees
├── /departments
├── /payroll
├── /attendance
├── /evaluations
├── /reports
└── /settings
```

## 🔧 Configuración Técnica

### Feature Flags

Los engines se controlan mediante feature flags en la configuración del tenant:

```typescript
const AVAILABLE_FEATURES = [
  { id: 'CMS_ENGINE', name: 'CMS Engine', required: true },
  { id: 'BLOG_MODULE', name: 'Blog Module' },
  { id: 'FORMS_MODULE', name: 'Forms Module' },
  { id: 'BOOKING_ENGINE', name: 'Booking Engine' },
  { id: 'ECOMMERCE_ENGINE', name: 'E-commerce Engine' },
  { id: 'HRMS_MODULE', name: 'HRMS Module' }
];
```

### Permisos

Cada engine tiene su conjunto de permisos específicos:

```typescript
// CMS Engine
['cms:access', 'pages:manage', 'media:manage', 'blog:manage']

// Booking Engine
['booking:access', 'booking:read', 'services:read', 'staff:read']

// Commerce Engine
['ecommerce:access', 'products:read', 'orders:read', 'customers:read']

// HRMS Engine
['hrms:access', 'employees:read', 'payroll:read', 'departments:read']
```

### Estructura de Archivos

Cada engine sigue esta estructura estándar:

```
engine/
├── page.tsx           # Página principal del engine
├── layout.tsx         # Layout específico del engine
├── loading.tsx        # Estado de carga
├── error.tsx          # Manejo de errores
└── [modulo]/
    ├── page.tsx
    ├── components/
    └── utils/
```

## 🛡️ Seguridad y Acceso

### Control de Acceso por Roles

Los engines respetan la jerarquía de roles:

1. **SuperAdmin** - Acceso completo a todos los engines
2. **TenantAdmin** - Acceso completo dentro de su tenant
3. **TenantManager** - Acceso limitado según permisos
4. **Employee** - Solo acceso a funcionalidades específicas
5. **User** - Sin acceso a engines (solo enlaces externos)

### Validación de Features

```typescript
// El sistema valida automáticamente si el tenant tiene acceso
const hasFeature = tenantFeatures.includes('BOOKING_ENGINE');
if (!hasFeature) {
  // Engine no disponible para este tenant
  return <AccessDenied />;
}
```

## 🚀 Desarrollo y Extensibilidad

### Crear un Nuevo Engine

1. **Crear la estructura de carpetas:**
   ```bash
   mkdir -p src/app/[locale]/manage/[tenantSlug]/nuevo-engine
   ```

2. **Añadir al sidebarConfig.ts:**
   ```typescript
   {
     name: 'sidebar.nuevoEngine',
     href: `${basePath.replace('/dashboard', '')}/nuevo-engine`,
     icon: IconComponent,
     permissions: ['nuevo:access'],
     features: ['NUEVO_ENGINE']
   }
   ```

3. **Actualizar features disponibles:**
   ```typescript
   const AVAILABLE_FEATURES = [
     // ... existing features
     { id: 'NUEVO_ENGINE', name: 'Nuevo Engine', description: 'Descripción del nuevo engine' }
   ];
   ```

### Mejores Prácticas

1. **Nomenclatura consistente:**
   - Feature flags en UPPER_CASE
   - Rutas en kebab-case
   - Permisos con formato `modulo:accion`

2. **Estructura modular:**
   - Cada engine debe ser independiente
   - Componentes reutilizables en `/components`
   - Utilidades específicas en `/utils`

3. **Manejo de estados:**
   - Loading states consistentes
   - Error boundaries por engine
   - Fallbacks graceful

## 📊 Monitoreo y Analytics

### Métricas por Engine

Cada engine puede reportar métricas específicas:

- **CMS**: Páginas creadas, media uploads, formularios enviados
- **Booking**: Citas programadas, servicios más populares, ocupación
- **Commerce**: Ventas, productos más vendidos, conversión
- **HRMS**: Empleados activos, nóminas procesadas, evaluaciones

### Logs y Auditoría

```typescript
// Ejemplo de log de auditoría
auditLog({
  engine: 'CMS_ENGINE',
  action: 'PAGE_CREATED',
  userId: user.id,
  metadata: { pageId, pageName }
});
```

## 🔄 Migración y Versionado

### Versionado de Engines

Cada engine mantiene su propia versión:

```json
{
  "engines": {
    "cms": "2.1.0",
    "booking": "1.5.0",
    "commerce": "3.0.0",
    "hrms": "1.0.0"
  }
}
```

### Migraciones

Las migraciones se ejecutan por engine:

```bash
npm run migrate:engine -- --engine=cms --version=2.1.0
```

## 📞 Soporte y Mantenimiento

### Contacto Técnico

- **Equipo de Desarrollo:** dev@dishub.com
- **Documentación:** https://docs.dishub.com/engines
- **Issues:** https://github.com/dishub/evoque/issues

### Actualizaciones

Las actualizaciones de engines se manejan de forma independiente, permitiendo:
- Actualizaciones granulares
- Rollbacks específicos por engine
- Testing aislado por funcionalidad

---

**Última actualización:** Diciembre 2024  
**Versión de documentación:** 1.0.0 