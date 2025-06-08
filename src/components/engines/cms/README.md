# CMS Headless Components

Este directorio contiene los componentes headless para el sistema CMS, que separan la lógica de negocio de la presentación para mayor flexibilidad y reutilización.

## Componentes Principales

### `useCMSPage` Hook

Hook personalizado que maneja toda la lógica de carga y gestión de páginas CMS.

#### Características:
- ✅ Precarga automática de todas las páginas
- ✅ Cache inteligente con invalidación
- ✅ Navegación instantánea entre páginas
- ✅ Manejo de errores robusto
- ✅ Soporte para scroll suave en landing pages
- ✅ Optimización de consultas GraphQL

#### Uso básico:
```tsx
import { useCMSPage } from '@/hooks/useCMSPage';

function MyComponent() {
  const {
    pageData,
    sections,
    isLoading,
    error,
    navigateToPage
  } = useCMSPage({
    slug: 'mi-pagina',
    locale: 'es',
    enablePreloading: true
  });

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{pageData?.title}</h1>
      {/* Renderizar secciones */}
    </div>
  );
}
```

#### Opciones disponibles:
```tsx
interface UseCMSPageOptions {
  slug?: string;              // Slug de la página
  locale?: string;            // Idioma de la página
  enablePreloading?: boolean; // Habilitar precarga (default: true)
  enableSmoothScroll?: boolean; // Habilitar scroll suave (default: true)
}
```

#### Datos retornados:
```tsx
interface UseCMSPageReturn {
  // Datos
  pageData: PageData | null;
  sections: SectionData[];
  menus: Menu[];
  
  // Estados de carga
  isLoading: boolean;
  isPreloading: boolean;
  preloadProgress: number;
  error: string | null;
  
  // Navegación
  activeSection: number;
  setActiveSection: (index: number) => void;
  navigateToPage: NavigationFunction;
  
  // Referencias para scroll
  sectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  isScrolling: React.MutableRefObject<boolean>;
  
  // Métodos
  loadCurrentPage: () => Promise<void>;
  preloadAllPages: () => Promise<void>;
}
```

### `CMSPageRenderer` Componente

Componente headless que renderiza páginas CMS usando el hook `useCMSPage`.

#### Características:
- 🎨 UI completamente personalizable
- 🔄 Loaders y errores personalizados
- 📱 Soporte completo para móviles
- ⌨️ Navegación por teclado
- 🎯 Callbacks para eventos importantes
- 🎛️ Control granular de funcionalidades

#### Uso básico:
```tsx
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';

function MyPage() {
  return <CMSPageRenderer />;
}
```

#### Uso avanzado:
```tsx
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';

function MyCustomPage() {
  const handlePageLoad = (pageData) => {
    console.log('Página cargada:', pageData.title);
    // Enviar analytics, actualizar SEO, etc.
  };

  const handleError = (error) => {
    console.error('Error:', error);
    // Enviar a servicio de monitoreo
  };

  const customLoader = (
    <div className="my-custom-loader">
      <span>Cargando mi página...</span>
    </div>
  );

  return (
    <CMSPageRenderer
      slug="mi-pagina"
      locale="es"
      enablePreloading={true}
      enableSmoothScroll={true}
      className="my-custom-class"
      onPageLoad={handlePageLoad}
      onError={handleError}
      customLoader={customLoader}
    />
  );
}
```

#### Props disponibles:
```tsx
interface CMSPageRendererProps {
  slug?: string;                    // Slug específico (opcional)
  locale?: string;                  // Idioma específico (opcional)
  enablePreloading?: boolean;       // Habilitar precarga
  enableSmoothScroll?: boolean;     // Habilitar scroll suave
  className?: string;               // Clases CSS adicionales
  onPageLoad?: (pageData: PageData) => void;     // Callback al cargar
  onError?: (error: string) => void;             // Callback de error
  customLoader?: React.ReactNode;                // Loader personalizado
  customErrorComponent?: React.ReactNode;        // Error personalizado
}
```

## Ejemplos de Uso

### 1. Página Simple
```tsx
// src/app/mi-pagina/page.tsx
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';

export default function MiPagina() {
  return <CMSPageRenderer />;
}
```

### 2. Página con Analytics
```tsx
// src/components/AnalyticsPage.tsx
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';

export default function AnalyticsPage() {
  const handlePageLoad = (pageData) => {
    // Enviar evento a Google Analytics
    gtag('event', 'page_view', {
      page_title: pageData.title,
      page_location: window.location.href
    });
  };

  return (
    <CMSPageRenderer
      onPageLoad={handlePageLoad}
      enablePreloading={true}
    />
  );
}
```

### 3. Página con UI Personalizada
```tsx
// src/components/CustomUIPage.tsx
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';
import { MyCustomLoader, MyCustomError } from './CustomComponents';

export default function CustomUIPage() {
  return (
    <CMSPageRenderer
      customLoader={<MyCustomLoader />}
      customErrorComponent={<MyCustomError />}
      className="my-theme"
    />
  );
}
```

### 4. Uso del Hook Directamente
```tsx
// src/components/ManualCMSPage.tsx
import { useCMSPage } from '@/hooks/useCMSPage';
import { MyCustomSectionRenderer } from './MyComponents';

export default function ManualCMSPage() {
  const { pageData, sections, isLoading, error } = useCMSPage();

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="my-custom-layout">
      <header>
        <h1>{pageData?.title}</h1>
      </header>
      <main>
        {sections.map((section, index) => (
          <MyCustomSectionRenderer 
            key={section.id} 
            section={section} 
            index={index}
          />
        ))}
      </main>
    </div>
  );
}
```

## Funcionalidades Avanzadas

### Cache Global
El sistema mantiene un cache global de páginas para navegación instantánea:
- Cache automático de todas las páginas al cargar la aplicación
- Invalidación inteligente basada en dependencias
- Precarga de videos y recursos pesados

### Scroll Suave (Landing Pages)
Para páginas tipo `LANDING`, se activa automáticamente:
- Scroll por secciones con rueda del mouse
- Navegación por teclado (flechas, Page Up/Down, Home, End)
- Soporte táctil para móviles
- Indicadores visuales de sección activa

### Optimizaciones
- Consultas GraphQL optimizadas y batcheadas
- Precarga inteligente de recursos
- Lazy loading de componentes pesados
- Cache con TTL configurable

## Migración desde la Página Original

Si tienes una página CMS existente, la migración es simple:

**Antes:**
```tsx
// Página con toda la lógica incluida
export default function CMSPage() {
  // 1000+ líneas de lógica...
  return <div>...</div>;
}
```

**Después:**
```tsx
// Página headless y limpia
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';

export default function CMSPage() {
  return <CMSPageRenderer />;
}
```

## Beneficios del Enfoque Headless

1. **Separación de responsabilidades**: Lógica separada de la presentación
2. **Reutilización**: El hook puede usarse en múltiples componentes
3. **Testabilidad**: Más fácil de testear por separado
4. **Flexibilidad**: UI completamente personalizable
5. **Mantenibilidad**: Código más limpio y organizado
6. **Performance**: Optimizaciones centralizadas

## Próximos Pasos

- [ ] Añadir soporte para A/B testing
- [ ] Implementar cache persistente (localStorage/IndexedDB)
- [ ] Añadir métricas de performance
- [ ] Soporte para páginas offline
- [ ] Integración con service workers 