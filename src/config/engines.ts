// src/config/engines.ts
// Configuración centralizada para todos los engines del sistema

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
    id: 'CMS_ENGINE',
    name: 'CMS Engine',
    description: 'Core content management system',
    icon: '📝',
    pricing: 0,
    category: 'Engine',
    routes: {
      main: '/dashboard/(engines)/cms',
      children: [
        { name: 'pages', path: '/pages', icon: '📄' },
        { name: 'media', path: '/media', icon: '🖼️' },
        { name: 'templates', path: '/templates', icon: '🎨' },
        { name: 'settings', path: '/settings', icon: '⚙️' },
      ]
    },
    translations: {
      en: {
        'sidebar.cmsEngine': 'CMS Engine',
        'sidebar.pages': 'Pages',
        'sidebar.media': 'Media',
        'sidebar.templates': 'Templates',
        'sidebar.cmsSettings': 'CMS Settings',
      },
      es: {
        'sidebar.cmsEngine': 'Motor CMS',
        'sidebar.pages': 'Páginas',
        'sidebar.media': 'Medios',
        'sidebar.templates': 'Plantillas',
        'sidebar.cmsSettings': 'Configuración CMS',
      },
      de: {
        'sidebar.cmsEngine': 'CMS-Engine',
        'sidebar.pages': 'Seiten',
        'sidebar.media': 'Medien',
        'sidebar.templates': 'Vorlagen',
        'sidebar.cmsSettings': 'CMS-Einstellungen',
      }
    }
  },
  {
    id: 'BOOKING_ENGINE',
    name: 'Booking Engine',
    description: 'Appointment and booking system',
    icon: '📅',
    pricing: 25,
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    routes: {
      main: '/dashboard/(engines)/booking',
      children: [
        { name: 'calendar', path: '/calendar', icon: '📅' },
        { name: 'services', path: '/services', icon: '🛎️' },
        { name: 'staff', path: '/staff', icon: '👥' },
        { name: 'bookings', path: '/bookings', icon: '📋' },
        { name: 'clients', path: '/clients', icon: '👤' },
        { name: 'reports', path: '/reports', icon: '📊' },
        { name: 'settings', path: '/settings', icon: '⚙️' },
      ]
    },
    translations: {
      en: {
        'sidebar.bookingEngine': 'Booking Engine',
        'sidebar.calendar': 'Calendar',
        'sidebar.services': 'Services',
        'sidebar.staff': 'Staff',
        'sidebar.bookings': 'Bookings',
        'sidebar.clients': 'Clients',
        'sidebar.reports': 'Reports',
        'sidebar.bookingSettings': 'Booking Settings',
      },
      es: {
        'sidebar.bookingEngine': 'Motor de Reservas',
        'sidebar.calendar': 'Calendario',
        'sidebar.services': 'Servicios',
        'sidebar.staff': 'Personal',
        'sidebar.bookings': 'Reservas',
        'sidebar.clients': 'Clientes',
        'sidebar.reports': 'Reportes',
        'sidebar.bookingSettings': 'Configuración de Reservas',
      },
      de: {
        'sidebar.bookingEngine': 'Buchungs-Engine',
        'sidebar.calendar': 'Kalender',
        'sidebar.services': 'Dienstleistungen',
        'sidebar.staff': 'Personal',
        'sidebar.bookings': 'Buchungen',
        'sidebar.clients': 'Kunden',
        'sidebar.reports': 'Berichte',
        'sidebar.bookingSettings': 'Buchungseinstellungen',
      }
    }
  },
  {
    id: 'ECOMMERCE_ENGINE',
    name: 'E-commerce Engine',
    description: 'Online store and payments',
    icon: '🛒',
    pricing: 35,
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    routes: {
      main: '/dashboard/(engines)/ecommerce',
      children: [
        { name: 'products', path: '/products', icon: '📦' },
        { name: 'orders', path: '/orders', icon: '🛍️' },
        { name: 'customers', path: '/customers', icon: '👥' },
        { name: 'inventory', path: '/inventory', icon: '📊' },
        { name: 'payments', path: '/payments', icon: '💳' },
        { name: 'shipping', path: '/shipping', icon: '🚚' },
        { name: 'analytics', path: '/analytics', icon: '📈' },
        { name: 'settings', path: '/settings', icon: '⚙️' },
      ]
    },
    translations: {
      en: {
        'sidebar.ecommerceEngine': 'E-commerce Engine',
        'sidebar.products': 'Products',
        'sidebar.orders': 'Orders',
        'sidebar.customers': 'Customers',
        'sidebar.inventory': 'Inventory',
        'sidebar.payments': 'Payments',
        'sidebar.shipping': 'Shipping',
        'sidebar.analytics': 'Analytics',
        'sidebar.ecommerceSettings': 'E-commerce Settings',
      },
      es: {
        'sidebar.ecommerceEngine': 'Motor E-commerce',
        'sidebar.products': 'Productos',
        'sidebar.orders': 'Pedidos',
        'sidebar.customers': 'Clientes',
        'sidebar.inventory': 'Inventario',
        'sidebar.payments': 'Pagos',
        'sidebar.shipping': 'Envíos',
        'sidebar.analytics': 'Analíticas',
        'sidebar.ecommerceSettings': 'Configuración E-commerce',
      },
      de: {
        'sidebar.ecommerceEngine': 'E-Commerce-Engine',
        'sidebar.products': 'Produkte',
        'sidebar.orders': 'Bestellungen',
        'sidebar.customers': 'Kunden',
        'sidebar.inventory': 'Inventar',
        'sidebar.payments': 'Zahlungen',
        'sidebar.shipping': 'Versand',
        'sidebar.analytics': 'Analytik',
        'sidebar.ecommerceSettings': 'E-Commerce-Einstellungen',
      }
    }
  },
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
];

// Módulos (no engines principales)
export const MODULES_CONFIG: EngineConfig[] = [
  {
    id: 'BLOG_MODULE',
    name: 'Blog Module',
    description: 'Blog and article management',
    icon: '📰',
    pricing: 10,
    category: 'Module',
    dependencies: ['CMS_ENGINE'],
    routes: {
      main: '/dashboard/(modules)/blog',
      children: [
        { name: 'posts', path: '/posts', icon: '📝' },
        { name: 'categories', path: '/categories', icon: '📂' },
        { name: 'tags', path: '/tags', icon: '🏷️' },
        { name: 'comments', path: '/comments', icon: '💬' },
        { name: 'settings', path: '/settings', icon: '⚙️' },
      ]
    },
    translations: {
      en: {
        'sidebar.blogModule': 'Blog Module',
        'sidebar.posts': 'Posts',
        'sidebar.categories': 'Categories',
        'sidebar.tags': 'Tags',
        'sidebar.comments': 'Comments',
        'sidebar.blogSettings': 'Blog Settings',
      },
      es: {
        'sidebar.blogModule': 'Módulo Blog',
        'sidebar.posts': 'Publicaciones',
        'sidebar.categories': 'Categorías',
        'sidebar.tags': 'Etiquetas',
        'sidebar.comments': 'Comentarios',
        'sidebar.blogSettings': 'Configuración Blog',
      },
      de: {
        'sidebar.blogModule': 'Blog-Modul',
        'sidebar.posts': 'Beiträge',
        'sidebar.categories': 'Kategorien',
        'sidebar.tags': 'Tags',
        'sidebar.comments': 'Kommentare',
        'sidebar.blogSettings': 'Blog-Einstellungen',
      }
    }
  },
  {
    id: 'FORMS_MODULE',
    name: 'Forms Module',
    description: 'Form builder and submissions',
    icon: '📋',
    pricing: 15,
    category: 'Module',
    dependencies: ['CMS_ENGINE'],
    routes: {
      main: '/dashboard/(modules)/forms',
      children: [
        { name: 'builder', path: '/builder', icon: '🔧' },
        { name: 'submissions', path: '/submissions', icon: '📥' },
        { name: 'analytics', path: '/analytics', icon: '📊' },
        { name: 'settings', path: '/settings', icon: '⚙️' },
      ]
    },
    translations: {
      en: {
        'sidebar.formsModule': 'Forms Module',
        'sidebar.formBuilder': 'Form Builder',
        'sidebar.submissions': 'Submissions',
        'sidebar.formAnalytics': 'Form Analytics',
        'sidebar.formSettings': 'Form Settings',
      },
      es: {
        'sidebar.formsModule': 'Módulo Formularios',
        'sidebar.formBuilder': 'Constructor de Formularios',
        'sidebar.submissions': 'Envíos',
        'sidebar.formAnalytics': 'Analíticas de Formularios',
        'sidebar.formSettings': 'Configuración Formularios',
      },
      de: {
        'sidebar.formsModule': 'Formular-Modul',
        'sidebar.formBuilder': 'Formular-Builder',
        'sidebar.submissions': 'Einreichungen',
        'sidebar.formAnalytics': 'Formular-Analytik',
        'sidebar.formSettings': 'Formular-Einstellungen',
      }
    }
  }
];

// Combinar todos los engines y módulos
export const ALL_FEATURES_CONFIG = [...ENGINES_CONFIG, ...MODULES_CONFIG];

// Funciones helper
export const getEngineById = (id: string): EngineConfig | undefined => 
  ALL_FEATURES_CONFIG.find(engine => engine.id === id);

export const getAllEngineFeatures = () => 
  ALL_FEATURES_CONFIG.map(engine => ({
    id: engine.id,
    label: engine.name,
    description: engine.description,
    category: engine.category,
    dependencies: engine.dependencies
  }));

export const getEnginesByCategory = (category: 'Engine' | 'Module') =>
  ALL_FEATURES_CONFIG.filter(engine => engine.category === category);

export const getEngineNavigation = (locale: string, tenantSlug: string) => 
  ENGINES_CONFIG.map(engine => ({
    name: `sidebar.${engine.id.toLowerCase().replace('_', '')}`,
    href: `/${locale}/${tenantSlug}${engine.routes.main}`,
    icon: engine.icon,
    features: [engine.id],
    children: engine.routes.children?.map(child => ({
      name: `sidebar.${child.name}`,
      href: `/${locale}/${tenantSlug}${engine.routes.main}${child.path}`,
      icon: child.icon
    }))
  }));

export const getModuleNavigation = (locale: string, tenantSlug: string) => 
  MODULES_CONFIG.map(module => ({
    name: `sidebar.${module.id.toLowerCase().replace('_', '')}`,
    href: `/${locale}/${tenantSlug}${module.routes.main}`,
    icon: module.icon,
    features: [module.id],
    children: module.routes.children?.map(child => ({
      name: `sidebar.${child.name}`,
      href: `/${locale}/${tenantSlug}${module.routes.main}${child.path}`,
      icon: child.icon
    }))
  }));

export const getEngineTranslations = (locale: 'en' | 'es' | 'de') => {
  const translations: Record<string, string> = {};
  ALL_FEATURES_CONFIG.forEach(engine => {
    Object.assign(translations, engine.translations[locale]);
  });
  return translations;
};

export const calculateTotalPricing = (features: string[]): number => {
  return features.reduce((total, featureId) => {
    const engine = getEngineById(featureId);
    return total + (engine?.pricing || 0);
  }, 0);
};

export const validateDependencies = (features: string[]): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  features.forEach(featureId => {
    const engine = getEngineById(featureId);
    if (engine?.dependencies) {
      engine.dependencies.forEach(depId => {
        if (!features.includes(depId)) {
          missing.push(depId);
        }
      });
    }
  });
  
  return {
    valid: missing.length === 0,
    missing: [...new Set(missing)]
  };
};

export const getRequiredFeatures = (): string[] => {
  return ALL_FEATURES_CONFIG
    .filter(engine => engine.id === 'CMS_ENGINE') // CMS_ENGINE es requerido
    .map(engine => engine.id);
};

export const addFeatureWithDependencies = (currentFeatures: string[], featureId: string): string[] => {
  const engine = getEngineById(featureId);
  const newFeatures = [...currentFeatures];
  
  // Agregar dependencias primero
  if (engine?.dependencies) {
    engine.dependencies.forEach(depId => {
      if (!newFeatures.includes(depId)) {
        newFeatures.push(depId);
      }
    });
  }
  
  // Agregar el feature principal
  if (!newFeatures.includes(featureId)) {
    newFeatures.push(featureId);
  }
  
  return newFeatures;
};

export const removeFeatureWithDependents = (
  currentFeatures: string[], 
  featureId: string
): { newFeatures: string[]; removedDependents: string[] } => {
  const dependentFeatures = ALL_FEATURES_CONFIG.filter(f => 
    f.dependencies?.includes(featureId) && currentFeatures.includes(f.id)
  );
  
  if (dependentFeatures.length > 0) {
    // No se puede remover si otros features dependen de él
    return { 
      newFeatures: currentFeatures, 
      removedDependents: dependentFeatures.map(f => f.name) 
    };
  }
  
  // Seguro para remover
  return { 
    newFeatures: currentFeatures.filter(id => id !== featureId), 
    removedDependents: [] 
  };
}; 