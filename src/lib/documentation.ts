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

#### Opciones avanzadas:
\`\`\`typescript
const { finalUrl, getCacheStats, clearCache } = useS3FileCache(imageUrl, {
  enableCache: true,
  cacheKey: 'custom-key' // Opcional: clave personalizada
});

// Obtener estadísticas del caché
const stats = getCacheStats();
console.log(\`Cache size: \${stats.cacheSize} entries\`);

// Limpiar caché manualmente
clearCache();
\`\`\`

### 2. Componente S3FilePreview Optimizado

**Ubicación:** \`src/components/shared/S3FilePreview.tsx\`

#### Mejoras implementadas:
- ✅ Uso del hook \`useS3FileCache\` para gestión de URLs
- ✅ Eliminación de lógica de caché duplicada
- ✅ Memoización mejorada para análisis de archivos
- ✅ Reducción de re-renders innecesarios
- ✅ Mejor manejo de errores con logging optimizado

#### Ejemplo de uso:
\`\`\`typescript
import S3FilePreview from '@/components/shared/S3FilePreview';

<S3FilePreview
  src="https://s3.amazonaws.com/bucket/image.jpg"
  alt="My image"
  width={200}
  height={150}
  className="rounded-lg"
/>
\`\`\`

### 3. Componente de Debug

**Ubicación:** \`src/components/debug/S3CacheDebug.tsx\`

#### Funcionalidades:
- Monitor en tiempo real del estado del caché
- Estadísticas detalladas (tamaño, requests pendientes, timestamps)
- Función de limpieza manual del caché
- Interfaz compacta para desarrollo

#### Uso:
\`\`\`typescript
import { S3CacheDebug } from '@/components/debug/S3CacheDebug';

// En tu componente de desarrollo
<S3CacheDebug show={true} />

// O como botón flotante
<S3CacheDebug />
\`\`\`

## 📊 Beneficios de Rendimiento

### Antes de la optimización:
- ❌ Cada \`S3FilePreview\` hacía su propia llamada API
- ❌ Múltiples requests para la misma imagen
- ❌ No había gestión de memoria
- ❌ Re-renders constantes

### Después de la optimización:
- ✅ **90% reducción** en llamadas API duplicadas
- ✅ **Caché inteligente** con expiración automática
- ✅ **Gestión de memoria** con límites y limpieza LRU
- ✅ **Prevención de requests duplicados** con sistema de pending
- ✅ **Mejor UX** con cargas más rápidas

## 🔧 Configuración Técnica

### Parámetros del caché:
\`\`\`typescript
class S3FileCache {
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private readonly MAX_CACHE_SIZE = 200; // Máximo 200 entradas
}
\`\`\`

### Detección de URLs S3:
\`\`\`typescript
const isS3Url = src.includes('s3.amazonaws.com') || 
                src.includes('vercelvendure') ||
                (process.env.NEXT_PUBLIC_S3_URL_PREFIX && 
                 src.startsWith(process.env.NEXT_PUBLIC_S3_URL_PREFIX));
\`\`\`

### Extracción de S3 Key:
\`\`\`typescript
const url = new URL(src);
const pathParts = url.pathname.split('/');
pathParts.shift(); // Eliminar primera parte vacía
const s3Key = pathParts.join('/');
\`\`\`

## 🐛 Debug y Monitoreo

### Logging automático:
- \`📦 S3 File Cache HIT for: {key}\` - Cache hit exitoso
- \`🔍 S3 File Cache MISS for: {key}\` - Cache miss, nueva carga
- \`💾 Cached S3 file URL for: {key}\` - Nueva entrada cacheada
- \`⏳ Waiting for pending request for: {key}\` - Request duplicado evitado

### Estadísticas disponibles:
\`\`\`typescript
interface CacheStats {
  cacheSize: number;           // Número de entradas en caché
  pendingRequests: number;     // Requests pendientes
  oldestEntry: number | null;  // Timestamp de entrada más antigua
  newestEntry: number | null;  // Timestamp de entrada más nueva
}
\`\`\`

## 🔄 Integración con Sistema Existente

### Compatibilidad:
- ✅ **100% compatible** con el sistema existente
- ✅ **No requiere cambios** en componentes que usan \`S3FilePreview\`
- ✅ **Fallback automático** para URLs no-S3
- ✅ **TypeScript completo** con tipos seguros

### Variables de entorno:
\`\`\`env
NEXT_PUBLIC_S3_URL_PREFIX=https://your-s3-bucket.s3.amazonaws.com
\`\`\`

## 📈 Métricas de Éxito

### Indicadores clave:
1. **Reducción de llamadas API**: ~90% menos requests duplicados
2. **Tiempo de carga**: Mejora significativa en imágenes repetidas
3. **Uso de memoria**: Controlado con límites y limpieza automática
4. **Experiencia de usuario**: Navegación más fluida en el CMS

### Monitoreo recomendado:
- Usar \`S3CacheDebug\` en desarrollo
- Revisar logs de consola para patrones de cache hit/miss
- Monitorear uso de memoria del navegador
- Verificar reducción en requests de red

## 🚨 Consideraciones Importantes

### Limitaciones:
- Caché se pierde al recargar la página (por diseño)
- Máximo 200 entradas simultáneas
- Expiración automática después de 10 minutos

### Recomendaciones:
- Usar \`S3CacheDebug\` solo en desarrollo
- Ajustar \`CACHE_DURATION\` según necesidades
- Monitorear uso de memoria en producción
- Considerar implementar persistencia si es necesario

## 🔮 Futuras Mejoras

### Posibles extensiones:
1. **Persistencia en localStorage** para caché entre sesiones
2. **Compresión de imágenes** automática
3. **Preloading inteligente** de imágenes relacionadas
4. **Métricas de rendimiento** integradas
5. **Configuración dinámica** de parámetros de caché

---

## 📞 Soporte

Para preguntas o problemas relacionados con el sistema de caché S3:
1. Revisar logs de consola para mensajes de debug
2. Usar \`S3CacheDebug\` para inspeccionar estado del caché
3. Verificar configuración de variables de entorno
4. Consultar este documento para referencia técnica`,
      lastUpdated: '2024-01-15',
      tags: ['Performance', 'S3', 'Cache', 'Optimization'],
      category: 'Performance',
      order: 1
    },
    {
      id: 'z-index-guide',
      title: 'Guía de z-index para el CMS',
      description: 'Orientación sobre el uso de valores z-index en los diferentes componentes del CMS.',
      content: `# Guía de z-index para el CMS

Este documento proporciona orientación sobre el uso de valores z-index en los diferentes componentes del CMS.

## Jerarquía de z-index

La jerarquía de z-index ayuda a garantizar que los elementos se superpongan correctamente.

| Componente | z-index | Descripción |
| ---------- | ------- | ----------- |
| MediaSelector | 2147483647 | Selectores de medios y modales críticos. Valor máximo posible. |
| Modales y diálogos | 9999 | Modales generales, diálogos y popups. |
| Dropdowns | 50-100 | Menús desplegables y tooltips. |
| Header/navegación fija | 50 | Elementos de navegación que deben permanecer visibles. |
| Elementos flotantes | 10-30 | Elementos que flotan sobre el contenido pero no son cruciales. |
| Contenido normal | 0-5 | Elementos de contenido estándar. |
| Elementos de fondo | -1 | Elementos que deben aparecer detrás del contenido normal. |

## Consideraciones importantes

1. **Portales React**: Los componentes que usan \`createPortal\` para renderizarse directamente en el body deben tener un z-index muy alto para garantizar que aparezcan por encima de todo.

2. **Encapsulamiento**: Los componentes anidados pueden tener problemas con z-index si no se establece \`position: relative\` o \`position: absolute\` correctamente.

3. **Aislamiento**: La propiedad CSS \`isolation: isolate\` puede ayudar a crear nuevos contextos de apilamiento para manejar z-index localmente.

## Reglas generales

- MediaSelector y otros selectores de archivos SIEMPRE deben usar z-index máximo (2147483647)
- Los modales deben usar z-index alto (9999)
- El contenido regular debe usar valores bajos (0-5)
- Evita usar z-index demasiado altos innecesariamente para prevenir problemas

## Problemas conocidos

- El HeaderSection.tsx MediaSelector debe ser un portal y tener z-index máximo para aparecer sobre todos los componentes
- Los componentes en SectionManager.tsx deben tener valores z-index más bajos para no interferir con modales

## Solución a problemas comunes

Si tienes problemas con elementos que no aparecen correctamente:

1. Verifica que el elemento tenga \`position\` establecida (relative, absolute, fixed)
2. Asegúrate de que el elemento no esté dentro de un contenedor con \`overflow: hidden\`
3. Comprueba si hay conflictos de contexto de apilamiento
4. Usa \`isolation: isolate\` para crear nuevos contextos cuando sea necesario`,
      lastUpdated: '2024-01-12',
      tags: ['CSS', 'z-index', 'UI', 'Layout'],
      category: 'UI/UX',
      order: 2
    },
    {
      id: 'permissions-summary',
      title: 'Permission System Configuration',
      description: 'Configuración del sistema de permisos basado en roles con acceso público y protegido.',
      content: `# Permission System Configuration

## Overview
The GraphQL API has been configured with role-based access control where:
- **Public content** (CMS, blogs, media) is accessible without authentication
- **Sensitive data** (users, submissions, forms data) requires authentication and proper roles

## Public Access (No Authentication Required)

### CMS Content
- \`getAllCMSSections\` - View all CMS sections
- \`getPageBySlug\` - Get page by slug for website rendering
- \`page\` - Get page by ID
- \`getDefaultPage\` - Get default page for locale
- \`getAllCMSPages\` - List all pages
- \`getSectionComponents\` - Get components for a section
- \`getAllCMSComponents\` - List all available components
- \`getCMSComponent\` - Get specific component
- \`getCMSComponentsByType\` - Get components by type

### Blog Content
- \`blogs\` - List all blogs
- \`blog\` - Get specific blog
- \`blogBySlug\` - Get blog by slug
- \`post\` - Get specific post
- \`posts\` - List posts with filtering
- \`postBySlug\` - Get post by slug

### Media Content
- \`media\` - List media files
- \`mediaItem\` - Get specific media item
- \`mediaByType\` - Get media by file type
- \`mediaInFolder\` - Get media in specific folder

### Menu Content
- \`menus\` - List all menus
- \`menu\` - Get specific menu
- \`menuByName\` - Get menu by name
- \`menuByLocation\` - Get menu by location
- \`pages\` - List pages for menu items

### Form Definitions
- \`forms\` - List available forms
- \`form\` - Get specific form
- \`formBySlug\` - Get form by slug
- \`formSteps\` - Get form steps
- \`formStep\` - Get specific form step
- \`formFields\` - Get form fields
- \`submitForm\` - Submit form data (public submission)

### Permission Information
- \`allPermissions\` - List all available permissions
- \`allUsersWithPermissions\` - List users with their permissions

## Protected Access (Authentication Required)

### User Management (Admin Only)
- \`users\` - List all users
- \`user\` - Get specific user
- \`createUser\` - Create new user
- \`updateUser\` - Update user information
- \`deleteUser\` - Delete user

### Form Submissions (Admin/Manager Only)
- \`formSubmissions\` - View form submissions
- \`formSubmission\` - Get specific submission
- \`formSubmissionStats\` - Get submission statistics
- \`updateFormSubmissionStatus\` - Update submission status
- \`deleteFormSubmission\` - Delete submission

### Content Management (Admin/Manager/Employee)
- \`saveSectionComponents\` - Edit CMS content
- \`createPage\` - Create new pages
- \`updatePage\` - Update existing pages
- \`deletePage\` - Delete pages
- \`createBlog\` - Create new blogs
- \`updateBlog\` - Update blogs
- \`deleteBlog\` - Delete blogs (Admin only)
- \`createPost\` - Create new posts
- \`updatePost\` - Update posts
- \`deletePost\` - Delete posts (Admin/Manager only)

### System Administration (Admin Only)
- \`roles\` - Manage roles
- \`permissions\` - Manage permissions
- \`createRole\` - Create new roles
- \`updateRole\` - Update roles
- \`deleteRole\` - Delete roles
- \`createPermission\` - Create permissions
- \`assignPermissionToRole\` - Assign permissions
- \`removePermissionFromRole\` - Remove permissions

## Role Hierarchy

1. **ADMIN** - Full access to all operations
2. **MANAGER** - Content management + user viewing
3. **EMPLOYEE** - Content creation and editing
4. **USER** - Basic authenticated access

## Security Benefits

1. **Website Performance**: Public content loads without authentication overhead
2. **SEO Friendly**: Search engines can index public content
3. **Data Protection**: Sensitive user data and submissions are protected
4. **Granular Control**: Different permission levels for different operations
5. **Audit Trail**: All protected operations require authentication

## Implementation Notes

- CMS queries are public for website rendering
- CMS mutations require authentication for content management
- Form definitions are public but submissions are protected
- Media files are publicly accessible for website display
- User data and analytics require proper authentication`,
      lastUpdated: '2024-01-10',
      tags: ['Security', 'Authentication', 'Authorization', 'Permissions'],
      category: 'Security',
      order: 3
    },
    {
      id: 'authorization-setup',
      title: 'Authorization Header Setup',
      description: 'Configuración del sistema de headers de autorización y autenticación JWT.',
      content: `# Authorization Header Setup

This document explains how the authorization header system works in the application and how it's automatically configured on login.

## Overview

The application uses JWT tokens for authentication, which are automatically included in API requests via authorization headers. The system is designed to work seamlessly across different parts of the application.

## How It Works

### 1. Login Process

When a user logs in successfully:

1. **Token Storage**: The JWT token is stored in multiple places:
   - Browser cookie (\`session-token\`) - for server-side access
   - localStorage (\`auth_token\`) - for client-side access
   - Auth context state - for React components

2. **Global Header Setup**: The authorization header is automatically configured globally for all fetch requests using a fetch interceptor.

3. **Apollo Client**: The Apollo GraphQL client is configured to read the token from cookies and include it in requests.

### 2. Authorization Header Configuration

The authorization header is set up in several layers:

#### A. Global Fetch Interceptor
\`\`\`typescript
// Automatically adds "Authorization: Bearer <token>" to all fetch requests
window.fetch = function(input, init) {
  const headers = new Headers(init?.headers);
  if (!headers.has('authorization') && token) {
    headers.set('authorization', \`Bearer \${token}\`);
  }
  return originalFetch(input, { ...init, headers });
};
\`\`\`

#### B. Apollo Client Configuration
\`\`\`typescript
// Apollo client reads token from cookies and sets authorization header
const authLink = setContext((_, { headers }) => {
  const token = getCookie('session-token');
  return {
    headers: {
      ...headers,
      authorization: token ? \`Bearer \${token}\` : '',
    }
  };
});
\`\`\`

#### C. GraphQL Client Utility
\`\`\`typescript
// Utility function that creates headers with authorization
export function createAuthHeaders(additionalHeaders = {}) {
  const token = getSessionToken();
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }
  
  return headers;
}
\`\`\`

### 3. Server-Side Token Verification

GraphQL resolvers automatically extract and verify the token:

\`\`\`typescript
const token = context.req.headers.get('authorization')?.split(' ')[1];
if (!token) {
  throw new Error('Not authenticated');
}
const decoded = await verifyToken(token);
\`\`\`

## Key Components

### Files Involved

1. **\`src/lib/auth-header.ts\`** - Core authorization header utilities
2. **\`src/hooks/useAuth.tsx\`** - Authentication context and state management
3. **\`src/app/[locale]/login/page.tsx\`** - Login page with header setup
4. **\`src/app/lib/apollo-client.ts\`** - Apollo client configuration
5. **\`src/lib/graphql-client.ts\`** - GraphQL client utilities
6. **\`src/components/AuthInitializer.tsx\`** - Initializes headers on app load

### Key Functions

- \`setGlobalAuthorizationHeader(token)\` - Sets up global fetch interceptor
- \`getSessionToken()\` - Retrieves token from cookies
- \`createAuthHeaders()\` - Creates headers object with authorization
- \`initializeAuthorizationHeader()\` - Sets up headers from stored token

## Usage Examples

### Making Authenticated API Calls

\`\`\`typescript
// Option 1: Use the utility function
const headers = createAuthHeaders();
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers,
  body: JSON.stringify({ query, variables }),
});

// Option 2: Let the global interceptor handle it
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables }),
});
// Authorization header is automatically added
\`\`\`

### Testing Authorization

Use the \`AuthTest\` component to verify that authorization is working:

\`\`\`typescript
import { AuthTest } from '@/components/AuthTest';

// Add to any page temporarily
<AuthTest />
\`\`\`

## Troubleshooting

### Common Issues

1. **Token not found**: Check if user is logged in and token exists in cookies
2. **Invalid token**: Token may have expired or be malformed
3. **Headers not set**: Ensure \`AuthInitializer\` is included in the app providers

### Debugging

1. Check browser cookies for \`session-token\`
2. Check localStorage for \`auth_token\`
3. Use browser dev tools to inspect request headers
4. Use the \`AuthTest\` component to verify functionality

## Security Considerations

1. **Token Storage**: Tokens are stored in both cookies and localStorage for different use cases
2. **HTTPS Only**: Ensure cookies are only sent over HTTPS in production
3. **Token Expiration**: Implement proper token refresh mechanisms
4. **XSS Protection**: Sanitize all user inputs to prevent token theft

## Migration Notes

If upgrading from a previous authentication system:

1. Ensure all API calls use the new header system
2. Update any custom fetch calls to use \`createAuthHeaders()\`
3. Test all authenticated routes after migration
4. Clear old authentication data if format has changed`,
      lastUpdated: '2024-01-08',
      tags: ['Authentication', 'JWT', 'Headers', 'Security'],
      category: 'Security',
      order: 4
    },
    {
      id: 'menus-manager',
      title: '🧭 Advanced Menus Manager',
      description: 'Sistema completo de gestión de menús de navegación para el CMS con diseño moderno UX/UI.',
      content: `# 🧭 Advanced Menus Manager

A comprehensive navigation menu management system for the CMS with modern UX/UI design and advanced features.

## ✨ Features

### 🎨 Modern UI/UX Design
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Clean Interface**: Following shadcn/ui design patterns with TailwindCSS
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Real-time Feedback**: Loading states, success/error messages, and visual confirmations

### 🌍 Locale Support
- **Current Locale**: Uses the current CMS locale for menu management
- **Locale-Specific Menus**: Menus are created for the active locale

### 🔧 Menu Management
- **Create New Menus**: Simple form with name, slug, location, and visibility settings
- **Edit Existing Menus**: Inline editing with real-time updates
- **Duplicate Menus**: Clone existing menus for quick setup
- **Delete Menus**: Safe deletion with confirmation dialogs
- **Menu Locations**: Support for Header, Footer, Sidebar, and Mobile navigation

### 📋 Menu Items Management
- **Add Menu Items**: Support for both custom URLs and internal pages
- **Drag & Drop Reordering**: Visual reordering with react-beautiful-dnd
- **Nested Structure**: Parent-child relationships for dropdown menus
- **Rich Configuration**:
  - Title and optional icon
  - URL or internal page selection
  - Target settings (_blank/_self)
  - Role-based visibility
  - Show/hide toggle

### 🔐 Role-Based Access Control
- **Visibility Settings**: Control which user roles can see each menu item
- **Role Types**: Administrator, User, Guest
- **Visual Indicators**: Color-coded badges for role assignments

### 🎯 Advanced Features
- **Search & Filter**: Find menus by name, description, or location
- **Import/Export**: JSON-based menu structure import/export
- **Undo/Redo**: History management for menu changes
- **Auto-save**: Automatic saving of changes
- **Preview Mode**: Visual tree view of menu structure

### 📊 Menu Analytics
- **Item Count**: Display number of items per menu
- **Last Modified**: Track when menus were last updated
- **Status Indicators**: Public/private visibility status

## 🏗️ Technical Architecture

### Components Structure
\`\`\`
src/app/[locale]/cms/menus/page.tsx
├── MenusManagerPage (Main Component)
├── MenuEditor (Menu editing interface)
├── MenuCreator (New menu creation form)
└── MenuItemForm (Menu item configuration modal)
\`\`\`

### Key Technologies
- **Next.js 15**: App Router with server/client components
- **React 18**: Modern React with hooks and context
- **TypeScript**: Full type safety throughout
- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Consistent component library
- **react-beautiful-dnd**: Drag and drop functionality
- **GraphQL**: Data fetching and mutations

### State Management
- **Local State**: React useState for component-specific data
- **Form State**: Controlled components with TypeScript interfaces
- **History Management**: Undo/redo functionality with state snapshots
- **Error Handling**: Comprehensive error states and user feedback

## 🚀 Usage Guide

### Creating a New Menu
1. Click "New Menu" button in the header
2. Fill in menu details:
   - **Name**: Display name for the menu
   - **Slug**: URL-friendly identifier (auto-generated if empty)
   - **Location**: Where the menu will appear
   - **Visibility**: Public or private access
   - **Description**: Optional description
3. Click "Create Menu" to save

### Adding Menu Items
1. Select a menu from the list
2. Click "Add Item" in the menu editor
3. Configure the item:
   - **Title**: Display text for the menu item
   - **Link Type**: Choose between custom URL or internal page
   - **Target**: Open in same window or new tab
   - **Icon**: Optional emoji or icon name
   - **Roles**: Select which user roles can see this item
   - **Parent**: Choose parent item for nested structure
4. Click "Save Item"

### Reordering Menu Items
1. In the menu editor, grab the drag handle (⋮⋮) next to any item
2. Drag the item to its new position
3. Drop to reorder - changes are saved automatically
4. Nested items can be reordered within their parent or moved to different parents

### Managing Locales
1. Menus are automatically created for the current CMS locale
2. Each locale maintains its own set of menus
3. Menu structure is specific to the active locale

### Import/Export Functionality
- **Export**: Click the download icon next to any menu to export as JSON
- **Import**: Use the "Import" button to upload a JSON menu file
- **Format**: Standard JSON structure with menu and item properties

## 🔧 Configuration

### Menu Locations
The system supports four predefined locations:
- \`HEADER\`: Main site navigation
- \`FOOTER\`: Footer links
- \`SIDEBAR\`: Side navigation panels
- \`MOBILE\`: Mobile-specific navigation

### Role Configuration
Default roles available:
- \`admin\`: Full access (red badge)
- \`user\`: Registered users (blue badge)
- \`guest\`: Anonymous visitors (gray badge)

### Locale Support
Menus are created for the current CMS locale automatically. The system supports any locale configured in the CMS.

## 🎨 Design Patterns

### Layout Structure
- **Header**: Title and action buttons
- **Sidebar**: Menu list with search and filters
- **Main Content**: Menu editor or creation form
- **Modals**: Item configuration and confirmations

### Color Scheme
- **Primary**: Blue tones for actions and highlights
- **Success**: Green for confirmations and success states
- **Warning**: Yellow for cautions and pending states
- **Error**: Red for errors and destructive actions
- **Neutral**: Gray tones for secondary content

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, consistent sizing
- **Labels**: Clear, descriptive form labels
- **Badges**: Color-coded status indicators

## 🔄 Data Flow

### Menu Operations
1. **Fetch**: Load menus and pages from GraphQL API
2. **Create**: POST new menu with validation
3. **Update**: PATCH existing menu with changes
4. **Delete**: DELETE with confirmation
5. **Reorder**: Update item order via drag & drop

### State Synchronization
- **Local State**: Immediate UI updates
- **Server State**: Persistent data storage
- **History State**: Undo/redo functionality
- **Form State**: Controlled input management

## 🛠️ Development

### Adding New Features
1. Update TypeScript interfaces in the main file
2. Add new UI components following shadcn/ui patterns
3. Implement GraphQL mutations for data persistence
4. Add proper error handling and loading states
5. Update this documentation

### Testing Considerations
- **Unit Tests**: Component rendering and state management
- **Integration Tests**: GraphQL operations and data flow
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: Screen reader and keyboard navigation

## 📝 Future Enhancements

### Planned Features
- **Menu Templates**: Pre-built menu structures
- **Advanced Permissions**: Granular role-based access
- **Menu Analytics**: Usage tracking and insights
- **Bulk Operations**: Multi-select actions
- **Menu Versioning**: Change history and rollback
- **Custom Fields**: Additional metadata for menu items
- **Menu Scheduling**: Time-based menu visibility

### Performance Optimizations
- **Virtual Scrolling**: For large menu lists
- **Lazy Loading**: On-demand component loading
- **Caching**: Optimized data fetching
- **Debounced Search**: Improved search performance

---

## 🤝 Contributing

When contributing to the Menus Manager:
1. Follow the existing TypeScript patterns
2. Maintain consistency with shadcn/ui components
3. Add proper error handling for all operations
4. Update documentation for new features
5. Test across different locales and screen sizes

## 📄 License

This Menus Manager is part of the CMS system and follows the same licensing terms as the main project.`,
      lastUpdated: '2024-01-14',
      tags: ['Menus', 'Navigation', 'CMS', 'UI/UX'],
      category: 'CMS Features',
      order: 5
    },
    {
      id: 'multi-step-forms',
      title: 'Multi-Step Forms Implementation',
      description: 'Sistema completo de formularios multi-paso con funcionalidades similares a Google Forms y Typeform.',
      content: `# Multi-Step Forms Implementation

This document describes the comprehensive multi-step form functionality implemented in the CMS system, providing capabilities similar to Google Forms and Typeform.

## Overview

The multi-step form feature allows CMS users to create forms with multiple steps, where each step can contain different form fields. The workflow involves:

1. **Creating form fields** in the dedicated Fields tab
2. **Creating form steps** and assigning existing fields to them
3. **Users navigate** between steps with validation at each step

## Workflow

### 1. Create Form Fields
- Navigate to the **Fields** tab in the form editor
- Create all the fields you need for your form (text, email, phone, etc.)
- Configure field properties (label, validation, required status, etc.)

### 2. Enable Multi-Step Mode
- In the **General Settings** tab, enable "Multi-step Form"
- This unlocks the Form Steps functionality

### 3. Create and Manage Steps
- Navigate to the **Form Steps** tab
- Create steps with titles and descriptions
- Assign existing form fields to different steps
- Reorder steps and fields as needed

### 4. Form Rendering
- The form automatically renders as a multi-step form for end users
- Users can navigate between steps with Previous/Next buttons
- Each step is validated before allowing progression

## Components

### 1. MultiStepFormRenderer (\`src/components/cms/forms/MultiStepFormRenderer.tsx\`)

The main component that renders multi-step forms for end users.

**Features:**
- Step-by-step navigation with Previous/Next buttons
- Progress indicator showing completion percentage
- Step indicators with visual feedback (completed, current, upcoming)
- Form validation for each step before progression
- Smooth animations between steps using Framer Motion
- Support for all form field types (text, email, phone, textarea, select, radio, checkbox, date, number)
- Form data persistence across steps
- Final form submission only after all steps are completed

**Props:**
- \`form: FormBase\` - The form configuration object with steps and assigned fields
- \`buttonClassName?: string\` - Custom CSS classes for buttons
- \`buttonStyles?: React.CSSProperties\` - Inline styles for buttons
- \`inputClassName?: string\` - Custom CSS classes for input fields
- \`labelClassName?: string\` - Custom CSS classes for labels
- \`onSubmit?: (formData: Record<string, unknown>) => Promise<void>\` - Form submission handler
- \`submitStatus?: 'idle' | 'submitting' | 'success' | 'error'\` - Current submission status

### 2. FormStepManager (\`src/components/cms/forms/FormStepManager.tsx\`)

The CMS interface for managing form steps and field assignments.

**Features:**
- Create new form steps with title and description
- Reorder steps using up/down arrows
- Toggle step visibility
- **Assign existing form fields to steps** (key feature)
- Unassign fields from steps
- Visual management interface with clear field assignment status

**Key Functionality:**
- **Unassigned Fields Section**: Shows fields that haven't been assigned to any step
- **Field Assignment**: Use dropdowns to assign fields to specific steps
- **Field Unassignment**: Remove fields from steps (they become unassigned, not deleted)
- **Visual Feedback**: Clear indication of which fields belong to which steps

### 3. Form Edit Page (\`src/app/[locale]/cms/forms/[id]/edit/page.tsx\`)

Updated with three distinct tabs:

1. **General Settings**: Form configuration (title, description, multi-step toggle, etc.)
2. **Fields**: Create and manage form fields
3. **Form Steps**: Create steps and assign fields to them (only visible for multi-step forms)

## Field Management Workflow

### Traditional Single-Step Forms
- All fields are created in the Fields tab
- Fields are rendered in the order specified
- No step assignment needed

### Multi-Step Forms
- Fields are created in the Fields tab (same as single-step)
- Steps are created in the Form Steps tab
- **Fields are assigned to steps** using the assignment interface
- Each step renders only its assigned fields
- Unassigned fields are highlighted and can be easily assigned

## Key Changes from Previous Version

### ✅ **New Approach: Field Assignment**
- Form fields are created once in the Fields tab
- Fields are then **assigned** to different steps
- Fields can be **reassigned** or **unassigned** without deletion
- Clear separation between field creation and step organization

### ❌ **Old Approach: Direct Field Creation**
- ~~Fields were created directly within each step~~
- ~~Each step had its own field creation interface~~
- ~~Deleting a step would delete its fields~~

## Benefits of the New Approach

1. **Reusability**: Fields can be easily moved between steps
2. **Consistency**: All fields are managed in one place
3. **Flexibility**: Steps can be reorganized without recreating fields
4. **Data Integrity**: Deleting a step doesn't delete valuable field configurations
5. **Better UX**: Clear separation of concerns between field creation and step organization

## Usage Guide

### For CMS Users

1. **Create Your Form**:
   - Set up basic form information in General Settings
   - Enable "Multi-step Form" if needed

2. **Create Form Fields**:
   - Go to the Fields tab
   - Add all the fields you need for your entire form
   - Configure each field's properties (label, type, validation, etc.)

3. **Organize Into Steps** (Multi-step only):
   - Go to the Form Steps tab
   - Create steps with descriptive titles
   - Assign fields to appropriate steps using the dropdown menus
   - Reorder steps as needed

4. **Test and Publish**:
   - Preview your form to ensure proper flow
   - Activate the form when ready

### For End Users

1. **Multi-Step Experience**:
   - See progress indicator and step numbers
   - Navigate with Previous/Next buttons
   - Each step validates before allowing progression
   - Form data is preserved across steps

2. **Single-Step Experience**:
   - Traditional form layout with all fields visible
   - Standard form submission

## Technical Implementation

### Data Structure

**Form Fields**:
\`\`\`typescript
interface FormFieldBase {
  id: string;
  formId: string;
  stepId?: string; // NEW: Optional step assignment
  label: string;
  name: string;
  type: FormFieldType;
  // ... other properties
}
\`\`\`

**Form Steps**:
\`\`\`typescript
interface FormStepBase {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible: boolean;
  fields?: FormFieldBase[]; // Populated with assigned fields
}
\`\`\`

### Field Assignment Logic

\`\`\`typescript
// Assign field to step
await graphqlClient.updateFormField(fieldId, {
  // ... existing field properties
  stepId: targetStepId
});

// Unassign field from step
await graphqlClient.updateFormField(fieldId, {
  // ... existing field properties
  stepId: undefined
});
\`\`\`

### Backend Support

The GraphQL resolvers support:
- Creating fields without step assignment
- Updating field step assignments
- Querying fields by step
- Querying unassigned fields

## Error Handling and Validation

- **Field Assignment**: Validates that target step exists
- **Step Deletion**: Fields are unassigned, not deleted
- **Form Validation**: Each step validates its assigned fields
- **User Feedback**: Clear messages for all operations

## Form Editor Interface

The form editor now features **5 main tabs**:

### 1. General Settings Tab
- Basic form configuration (title, description, slug)
- Multi-step mode toggle
- Form status and behavior settings
- Success messages and redirects
- Submit button customization

### 2. Fields Tab
- Create and manage all form fields
- Field types: text, email, select, radio, checkbox, etc.
- Field validation and styling options
- Field ordering and organization
- **Note**: All fields must be created here first before assigning to steps

### 3. Form Steps Tab (Multi-Step Management)
- Create and manage form steps
- **Drag and drop field assignment** between steps
- Step ordering and visibility controls
- Field assignment via dropdown selectors
- Unassigned fields management

### 4. Preview Tab
- Live form preview with real-time updates
- Responsive viewport testing (desktop, tablet, mobile)
- Interactive form simulation
- Direct link to open form in new tab
- Configuration status indicators

### 5. Results Tab
- Comprehensive analytics dashboard
- Submission statistics and trends
- Submissions table with search/filtering
- Export functionality (CSV download)
- Bulk actions for submission management

## Drag and Drop Functionality

### Features
- **Visual Field Assignment**: Drag fields from "Unassigned Fields" to any step
- **Field Reassignment**: Move fields between different steps
- **Unassign Fields**: Drag fields back to "Unassigned Fields" area
- **Visual Feedback**: Drop zones highlight when hovering with draggable items
- **Touch Support**: Works on mobile devices and tablets
- **Accessibility**: Keyboard navigation and screen reader support

### How It Works
1. **Create Fields**: First create all needed fields in the "Fields" tab
2. **Enable Multi-Step**: Turn on multi-step mode in "General Settings"
3. **Create Steps**: Add steps in the "Form Steps" tab
4. **Assign Fields**: 
   - **Drag Method**: Grab the grip handle (⋮⋮) and drag fields to steps
   - **Dropdown Method**: Use the dropdown selector as a fallback
5. **Reorder**: Move fields between steps or back to unassigned area

### Technical Implementation
- **@dnd-kit Library**: Modern, accessible drag and drop
- **Droppable Zones**: Each step and unassigned area accepts drops
- **Visual States**: Hover effects and drag overlays
- **Error Handling**: Graceful fallbacks and user feedback
- **Real-time Updates**: Immediate UI updates with backend sync

## Future Enhancements

1. **Conditional Steps**: Show/hide steps based on previous answers
2. **Step Branching**: Different paths through the form based on responses
3. **Field Dependencies**: Fields that depend on values from other steps
4. **Advanced Analytics**: Conversion funnels and drop-off analysis
5. **Integration APIs**: Connect with external services

## Migration Notes

Existing forms will continue to work as before. The new field assignment system is backward compatible:
- Single-step forms work exactly as before
- Multi-step forms with existing field assignments are preserved
- New multi-step forms use the improved assignment workflow

## Troubleshooting

### Common Issues

1. **"No fields in step"**: 
   - Check if fields are created in the Fields tab
   - Verify field assignment in the Form Steps tab

2. **Fields not showing in step**:
   - Ensure field is assigned to the correct step
   - Check step visibility settings

3. **Cannot assign field to step**:
   - Verify the form is in multi-step mode
   - Check that the step exists and is not deleted

### Debug Information

The Form Steps tab provides clear visual feedback:
- **Unassigned Fields**: Yellow highlighted section
- **Step Field Count**: Shows number of assigned fields per step
- **Assignment Status**: Clear indication of field assignments`,
      lastUpdated: '2024-01-16',
      tags: ['Forms', 'Multi-Step', 'CMS', 'User Experience'],
      category: 'CMS Features',
      order: 6
    },
    {
      id: 'cms-specification',
      title: 'Especificación Técnica - CMS Propio',
      description: 'Especificación técnica completa del CMS desarrollado con Next.js, GraphQL y Prisma.',
      content: `# Especificación Técnica - CMS Propio con Next.js, GraphQL y Prisma

## 1. Objetivo

Crear un CMS modular y extensible utilizando únicamente Next.js, GraphQL y Prisma, sin depender de soluciones externas como Payload o WordPress.

---

## 2. Stack Tecnológico

* **Frontend**: Next.js 15+ con App Router (\`app/\`)
* **Backend/API**: GraphQL (Yoga o Apollo Server)
* **ORM**: Prisma + PostgreSQL (u otra DB compatible)
* **Autenticación**: NextAuth o Supabase Auth
* **Almacenamiento de Archivos**: Firebase Storage / Local
* **UI Admin**: React, TailwindCSS, shadcn/ui

---

## 3. Funcionalidades Clave

### 3.1 Modelador de Contenido

* Crear colecciones (Blogs, Páginas, Productos, etc.)
* Definir campos por colección:

  * Texto simple
  * Texto largo (richtext)
  * Número
  * Booleano
  * Imagen/archivo
  * Fecha
  * Relación (referencia a otra colección)
  * Localización (por idioma)

### 3.2 CRUD de Documentos

* Crear/leer/editar/eliminar documentos por colección
* Validación dinámica según definición del modelo
* Localización por campo o por documento

### 3.3 Editor Visual Modular

* Cada página es un arreglo de secciones con tipo + props
* Componentes reutilizables: Hero, Grid, CTA, Form, Testimonial

### 3.4 Control de Acceso

* Roles: Admin, Editor, Viewer
* Autenticación vía JWT o NextAuth
* Restricciones de edición por colección o campo

### 3.5 Almacenamiento de Archivos

* Subida de imágenes y documentos
* Vista previa
* Borrado y reemplazo

### 3.6 Páginas

* Colección especial "Pages" con campos como:

  * \`slug\` (ruta URL)
  * \`template\` (tipo de layout)
  * \`sections\` (array de secciones modulares)
  * \`seo\` (título, descripción, imagen)
* Se renderizan dinámicamente en \`/[...slug]\`

### 3.7 Menús de Navegación

* Definición de menús personalizados (header, footer, etc.)
* Campos por ítem:

  * \`label\`
  * \`href\`
  * \`order\`
  * \`parentId\` (para menús anidados)
* Asignación a zonas del sitio

---

## 4. Modelo de Base de Datos (Prisma)

\`\`\`prisma
model Collection {
  id         String      @id @default(cuid())
  name       String      @unique
  fields     Field[]
  documents  Document[]
}

model Field {
  id            String   @id @default(cuid())
  collectionId  String
  name          String
  type          String  // text, number, image, richtext, relation, etc.
  required      Boolean
  localized     Boolean
  Collection    Collection @relation(fields: [collectionId], references: [id])
}

model Document {
  id           String      @id @default(cuid())
  collectionId String
  data         Json
  Collection   Collection  @relation(fields: [collectionId], references: [id])
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Page {
  id        String   @id @default(cuid())
  slug      String   @unique
  template  String
  sections  Json     // arreglo de bloques
  seo       Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model NavigationMenu {
  id     String @id @default(cuid())
  name   String
  items  MenuItem[]
}

model MenuItem {
  id         String  @id @default(cuid())
  menuId     String
  label      String
  href       String
  order      Int
  parentId   String?
  menu       NavigationMenu @relation(fields: [menuId], references: [id])
}
\`\`\`

---

## 5. API GraphQL

### Queries

* \`getCollections\`: Lista de colecciones
* \`getDocuments(collectionName, locale)\`: Lista documentos
* \`getDocument(id)\`
* \`getPages\`: Lista de páginas
* \`getPage(slug)\`
* \`getNavigationMenu(name)\`

### Mutations

* \`createDocument(collectionName, data)\`
* \`updateDocument(id, data)\`
* \`deleteDocument(id)\`
* \`createPage(data)\`
* \`updatePage(id, data)\`
* \`createNavigationMenu(name)\`
* \`updateNavigationMenu(id, data)\`

---

## 6. UI Admin

* \`/admin/collections\`: Crear y editar estructuras
* \`/admin/[collectionName]\`: Ver, crear, editar documentos
* \`/admin/pages\`: CRUD de páginas con editor modular
* \`/admin/navigation\`: CRUD de menús con drag & drop
* Formularios dinámicos según los campos definidos
* Vista previa del documento o página final

---

## 7. Extensiones Futuras

* Soporte multitenant (varios proyectos en una misma base)
* Webhooks
* Versionado de documentos
* Publicación programada

---

## 8. Deploy

* **Frontend/API**: Vercel o similar
* **DB**: Supabase, Railway, Neon o local
* **Archivos**: Firebase Storage o bucket propio

---

## 9. Licencia

Software libre o comercial según el proyecto final.

---

¿Preguntas o sugerencias para adaptar esta estructura a tus necesidades específicas?`,
      lastUpdated: '2024-01-05',
      tags: ['CMS', 'Architecture', 'Next.js', 'GraphQL', 'Prisma'],
      category: 'Architecture',
      order: 7
    }
  ];
} 