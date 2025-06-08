import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  SettingsIcon,
  BellIcon,
  UsersIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  BarChartIcon,
  UserPlusIcon,
  LineChartIcon,
  ShieldIcon,
  ShoppingCartIcon,
  FileTextIcon,
  PenToolIcon,
  LayoutDashboardIcon,
  ImageIcon,
  BookOpenIcon,
  FormInputIcon,
  PackageIcon,
  CreditCardIcon,
  TruckIcon,
  StarIcon,
  MenuIcon,
  ScaleIcon,
  BuildingIcon,
  DollarSignIcon
} from 'lucide-react';

export interface TenantNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: TenantNavItem[];
  roles?: string[];
  permissions?: string[];
  features?: string[]; // Required tenant features
  badge?: {
    key: string;
    value: number;
  };
  disabled?: boolean;
  locked?: boolean;
  accessType?: string;
  allowedRoles?: string[];
}

export interface TenantSidebarConfig {
  tenantAdministrationItems: (locale: string, tenantSlug?: string) => TenantNavItem[];
  tenantEngineItems: (locale: string, tenantSlug?: string) => TenantNavItem[];
  tenantReportsItems: (locale: string, tenantSlug?: string) => TenantNavItem[];
}

export const tenantSidebarConfig: TenantSidebarConfig = {
  // Tenant Administration Items - Pure administrative functions
  tenantAdministrationItems: (locale: string, tenantSlug?: string) => {
    const basePath = tenantSlug ? `/${locale}/${tenantSlug}/dashboard` : `/${locale}/admin`;
    
    return [
      // 📊 Dashboard Overview
      { 
        name: 'sidebar.dashboard', 
        href: basePath, 
        icon: LayoutDashboardIcon,
        permissions: ['admin:view']
      },
      
      // 🧩 1. Module Management
      {
        name: 'sidebar.moduleManagement',
        href: `${basePath}/modules`,
        icon: PackageIcon,
        permissions: ['modules:manage'],
        children: [
          {
            name: 'sidebar.activeModules',
            href: `${basePath}/modules/active`,
            icon: BarChartIcon,
            permissions: ['modules:read']
          },
          {
            name: 'sidebar.requestModules',
            href: `${basePath}/modules/request`,
            icon: UserPlusIcon,
            permissions: ['modules:request']
          },
          {
            name: 'sidebar.moduleConfiguration',
            href: `${basePath}/modules/config`,
            icon: SettingsIcon,
            permissions: ['modules:configure']
          }
        ]
      },

      // 👥 2. User Management
      {
        name: 'sidebar.userManagement',
        href: `${basePath}/users`,
        icon: UsersIcon,
        permissions: ['users:read'],
        children: [
          {
            name: 'sidebar.usersList',
            href: `${basePath}/users/list`,
            icon: UserIcon,
            permissions: ['users:read']
          },
          {
            name: 'sidebar.rolesPermissions',
            href: `${basePath}/users/roles`,
            icon: ShieldIcon,
            permissions: ['roles:manage']
          },
          {
            name: 'sidebar.activityLogs',
            href: `${basePath}/users/activity`,
            icon: ClipboardListIcon,
            permissions: ['audit:read']
          }
        ]
      },

      // 🏢 3. Company Management
      {
        name: 'sidebar.companyManagement',
        href: `${basePath}/company`,
        icon: HomeIcon,
        permissions: ['company:manage'],
        children: [
          {
            name: 'sidebar.companyProfile',
            href: `${basePath}/company/profile`,
            icon: HomeIcon,
            permissions: ['company:edit']
          },
          {
            name: 'sidebar.brandingDesign',
            href: `${basePath}/company/branding`,
            icon: PenToolIcon,
            permissions: ['branding:manage']
          },
          {
            name: 'sidebar.billing',
            href: `${basePath}/company/billing`,
            icon: CreditCardIcon,
            permissions: ['billing:read']
          }
        ]
      },

      // 📢 4. Notifications & Communication
      {
        name: 'sidebar.communications',
        href: `${basePath}/communications`,
        icon: MessageSquareIcon,
        permissions: ['communications:manage'],
        children: [
          {
            name: 'sidebar.notifications',
            href: `${basePath}/notifications`,
            icon: BellIcon,
            permissions: ['notifications:read'],
            badge: {
              key: 'unread',
              value: 0
            }
          },
          {
            name: 'sidebar.createNotifications',
            href: `${basePath}/notifications/create`,
            icon: MessageSquareIcon,
            permissions: ['notifications:create']
          },
          {
            name: 'sidebar.messageTemplates',
            href: `${basePath}/communications/templates`,
            icon: FileTextIcon,
            permissions: ['templates:manage']
          }
        ]
      }
    ];
  },

  // Tenant Engine Items - Business engines and modules
  tenantEngineItems: (locale: string, tenantSlug?: string) => {
    const basePath = tenantSlug ? `/${locale}/${tenantSlug}` : `/${locale}/admin`;
    
    return [
      // 📄 CMS Engine - Always available
      {
        name: 'sidebar.contentManagement',
        href: `${basePath}/cms`,
        icon: FileTextIcon,
        permissions: ['cms:access'],
        children: [
          {
            name: 'sidebar.pages',
            href: `${basePath}/cms/pages`,
            icon: FileTextIcon,
            permissions: ['pages:manage']
          },
          {
            name: 'sidebar.media',
            href: `${basePath}/cms/media`,
            icon: ImageIcon,
            permissions: ['media:manage']
          },
          {
            name: 'sidebar.templates',
            href: `${basePath}/cms/templates`,
            icon: LayoutDashboardIcon,
            permissions: ['templates:manage']
          },
          {
            name: 'sidebar.multilingual',
            href: `${basePath}/cms/languages`,
            icon: SettingsIcon,
            permissions: ['languages:manage']
          },
          {
            name: 'sidebar.blog',
            href: `${basePath}/cms/blog`,
            icon: BookOpenIcon,
            permissions: ['blog:manage']
          },
          {
            name: 'sidebar.forms',
            href: `${basePath}/cms/forms`,
            icon: FormInputIcon,
            permissions: ['forms:manage']
          },
          {
            name: 'sidebar.menus',
            href: `${basePath}/cms/menus`,
            icon: MenuIcon,
            permissions: ['menus:manage']
          },
          {
            name: 'sidebar.settings',
            href: `${basePath}/cms/settings`,
            icon: SettingsIcon,
            permissions: ['cms:settings']
          }
        ]
      },

      // 📅 Booking Engine
      {
        name: 'sidebar.bookingEngine',
        href: `${basePath}/bookings`,
        icon: CalendarIcon,
        permissions: ['booking:access'],
        features: ['BOOKING_ENGINE'], // Required feature
        children: [
          {
            name: 'sidebar.calendar',
            href: `${basePath}/bookings/calendar`,
            icon: CalendarIcon,
            permissions: ['booking:read']
          },
          {
            name: 'sidebar.bookingsList',
            href: `${basePath}/bookings/list`,
            icon: ClipboardListIcon,
            permissions: ['booking:read']
          },
          {
            name: 'sidebar.services',
            href: `${basePath}/bookings/services`,
            icon: ClipboardListIcon,
            permissions: ['services:read']
          },
          {
            name: 'sidebar.categories',
            href: `${basePath}/bookings/categories`,
            icon: PackageIcon,
            permissions: ['categories:read']
          },
          {
            name: 'sidebar.staff',
            href: `${basePath}/bookings/staff`,
            icon: UsersIcon,
            permissions: ['staff:read']
          },
          {
            name: 'sidebar.locations',
            href: `${basePath}/bookings/locations`,
            icon: HomeIcon,
            permissions: ['locations:read']
          },
          {
            name: 'sidebar.rules',
            href: `${basePath}/bookings/rules`,
            icon: ShieldIcon,
            permissions: ['rules:read']
          },
          {
            name: 'sidebar.bookingSettings',
            href: `${basePath}/bookings/settings`,
            icon: SettingsIcon,
            permissions: ['bookings:manage']
          }
        ]
      },

      // 🛒 E-commerce Engine
      {
        name: 'sidebar.ecommerceEngine',
        href: `${basePath}/commerce`,
        icon: ShoppingCartIcon,
        permissions: ['ecommerce:access'],
        features: ['ECOMMERCE_ENGINE'], // Required feature
        children: [
          {
            name: 'sidebar.products',
            href: `${basePath}/commerce/products`,
            icon: PackageIcon,
            permissions: ['products:read']
          },
          {
            name: 'sidebar.categories',
            href: `${basePath}/commerce/categories`,
            icon: PackageIcon,
            permissions: ['categories:read']
          },
          {
            name: 'sidebar.inventory',
            href: `${basePath}/commerce/inventory`,
            icon: PackageIcon,
            permissions: ['inventory:read']
          },
          {
            name: 'sidebar.orders',
            href: `${basePath}/commerce/orders`,
            icon: ClipboardListIcon,
            permissions: ['orders:read']
          },
          {
            name: 'sidebar.customers',
            href: `${basePath}/commerce/customers`,
            icon: UsersIcon,
            permissions: ['customers:read']
          },
          {
            name: 'sidebar.payments',
            href: `${basePath}/commerce/payments`,
            icon: CreditCardIcon,
            permissions: ['payments:read']
          },
          {
            name: 'sidebar.shipping',
            href: `${basePath}/commerce/shipping`,
            icon: TruckIcon,
            permissions: ['shipping:read']
          },
          {
            name: 'sidebar.taxes',
            href: `${basePath}/commerce/taxes`,
            icon: CreditCardIcon,
            permissions: ['taxes:read']
          },
          {
            name: 'sidebar.analytics',
            href: `${basePath}/commerce/analytics`,
            icon: BarChartIcon,
            permissions: ['analytics:read']
          },
          {
            name: 'sidebar.reviews',
            href: `${basePath}/commerce/reviews`,
            icon: StarIcon,
            permissions: ['reviews:read']
          },
          {
            name: 'sidebar.ecommerceSettings',
            href: `${basePath}/commerce/settings`,
            icon: SettingsIcon,
            permissions: ['ecommerce:manage']
          }
        ]
      },

      // 👥 HRMS Engine
      {
        name: 'sidebar.hrmsEngine',
        href: `${basePath}/hrms`,
        icon: UsersIcon,
        permissions: ['hrms:access'],
        features: ['HRMS_MODULE'], // Required feature
        children: [
          {
            name: 'sidebar.employees',
            href: `${basePath}/hrms/employees`,
            icon: UserIcon,
            permissions: ['employees:read']
          },
          {
            name: 'sidebar.departments',
            href: `${basePath}/hrms/departments`,
            icon: HomeIcon,
            permissions: ['departments:read']
          },
          {
            name: 'sidebar.payroll',
            href: `${basePath}/hrms/payroll`,
            icon: CreditCardIcon,
            permissions: ['payroll:read']
          },
          {
            name: 'sidebar.attendance',
            href: `${basePath}/hrms/attendance`,
            icon: ClipboardListIcon,
            permissions: ['attendance:read']
          },
          {
            name: 'sidebar.performance',
            href: `${basePath}/hrms/performance`,
            icon: BarChartIcon,
            permissions: ['performance:read']
          },
          {
            name: 'sidebar.hrmsSettings',
            href: `${basePath}/hrms/settings`,
            icon: SettingsIcon,
            permissions: ['hrms:manage']
          }
        ]
      },

      // ⚖️ Legal Engine
      {
        name: 'sidebar.legalEngine',
        href: `${basePath}/dashboard/legal`,
        icon: ScaleIcon,
        permissions: ['legal:access'],
        features: ['LEGAL_ENGINE'], // Required feature
        children: [
          {
            name: 'sidebar.incorporations',
            href: `${basePath}/dashboard/legal/incorporations`,
            icon: BuildingIcon,
            permissions: ['legal:incorporations:read']
          },
          {
            name: 'sidebar.legalCalendar',
            href: `${basePath}/dashboard/legal/calendar`,
            icon: CalendarIcon,
            permissions: ['legal:calendar:read']
          },
          {
            name: 'sidebar.legalClients',
            href: `${basePath}/dashboard/legal/clients`,
            icon: UsersIcon,
            permissions: ['legal:clients:read']
          },
          {
            name: 'sidebar.legalDocuments',
            href: `${basePath}/dashboard/legal/documents`,
            icon: FileTextIcon,
            permissions: ['legal:documents:read']
          },
          {
            name: 'sidebar.legalBilling',
            href: `${basePath}/dashboard/legal/billing`,
            icon: DollarSignIcon,
            permissions: ['legal:billing:read']
          },
          {
            name: 'sidebar.legalReports',
            href: `${basePath}/dashboard/legal/reports`,
            icon: BarChartIcon,
            permissions: ['legal:reports:read']
          },
          {
            name: 'sidebar.legalBookingConfig',
            href: `${basePath}/dashboard/legal/booking-config`,
            icon: SettingsIcon,
            permissions: ['legal:settings:manage']
          },
          {
            name: 'sidebar.legalSettings',
            href: `${basePath}/dashboard/legal/settings`,
            icon: SettingsIcon,
            permissions: ['legal:settings:manage']
          }
        ]
      }
    ];
  },

  // Tenant Reports Items - Analytics and reporting
  tenantReportsItems: (locale: string, tenantSlug?: string) => {
    const basePath = tenantSlug ? `/${locale}/${tenantSlug}/dashboard` : `/${locale}/admin`;
    
    return [
      // 📊 Reports & Insights
      {
        name: 'sidebar.reportsInsights',
        href: `${basePath}/reports`,
        icon: BarChartIcon,
        permissions: ['reports:read'],
        children: [
          {
            name: 'sidebar.kpiDashboard',
            href: `${basePath}/reports/kpis`,
            icon: LineChartIcon,
            permissions: ['kpis:read']
          },
          {
            name: 'sidebar.exportData',
            href: `${basePath}/reports/export`,
            icon: ClipboardListIcon,
            permissions: ['data:export']
          },
          {
            name: 'sidebar.activityHistory',
            href: `${basePath}/reports/activity`,
            icon: BarChartIcon,
            permissions: ['activity:read']
          },
          {
            name: 'sidebar.userAnalytics',
            href: `${basePath}/reports/users`,
            icon: UsersIcon,
            permissions: ['analytics:users']
          },
          {
            name: 'sidebar.performanceMetrics',
            href: `${basePath}/reports/performance`,
            icon: LineChartIcon,
            permissions: ['analytics:performance']
          }
        ]
      }
    ];
  }
};

// Helper function to filter navigation items based on tenant features
export const filterTenantNavigationByFeatures = (
  items: TenantNavItem[], 
  tenantFeatures: string[]
): TenantNavItem[] => {
  return items.filter(item => {
    // If item has no feature requirements, include it
    if (!item.features || item.features.length === 0) {
      return true;
    }
    
    // Check if tenant has all required features
    const hasRequiredFeatures = item.features.every(feature => 
      tenantFeatures.includes(feature)
    );
    
    return hasRequiredFeatures;
  }).map(item => ({
    ...item,
    children: item.children ? filterTenantNavigationByFeatures(item.children, tenantFeatures) : undefined
  }));
};

// Helper function to get icon component by name (for external links)
export const getTenantIconComponent = (iconName: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    HomeIcon,
    UserIcon,
    CalendarIcon,
    SettingsIcon,
    BellIcon,
    UsersIcon,
    MessageSquareIcon,
    ClipboardListIcon,
    BarChartIcon,
    UserPlusIcon,
    LineChartIcon,
    ShieldIcon,
    ShoppingCartIcon,
    FileTextIcon,
    PenToolIcon,
    LayoutDashboardIcon,
    ImageIcon,
    BookOpenIcon,
    FormInputIcon,
    PackageIcon,
    CreditCardIcon,
    TruckIcon,
    StarIcon,
    MenuIcon,
    ScaleIcon,
    BuildingIcon,
    DollarSignIcon
  };
  
  return iconMap[iconName] || HomeIcon;
}; 