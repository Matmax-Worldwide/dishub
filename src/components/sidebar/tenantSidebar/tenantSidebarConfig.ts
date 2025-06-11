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
  DollarSignIcon,
  MicIcon,
  LanguagesIcon,
  HeadphonesIcon,
  RadioIcon,
  ClockIcon
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
            href: `${basePath}/modules`,
            icon: BarChartIcon,
            permissions: ['modules:read']
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
        permissions: ['cms:access']
      },

      // 📅 Booking Engine
      {
        name: 'sidebar.bookingEngine',
        href: `${basePath}/bookings`,
        icon: CalendarIcon,
        permissions: ['booking:access'],
        features: ['BOOKING_ENGINE'] // Required feature
      },

      // 🛒 E-commerce Engine
      {
        name: 'sidebar.ecommerceEngine',
        href: `${basePath}/commerce`,
        icon: ShoppingCartIcon,
        permissions: ['ecommerce:access'],
        features: ['ECOMMERCE_ENGINE'] // Required feature
      },

      // 👥 HRMS Engine
      {
        name: 'sidebar.hrmsEngine',
        href: `${basePath}/hrms`,
        icon: UsersIcon,
        permissions: ['hrms:access'],
        features: ['HRMS_MODULE'] // Required feature
      },

      // ⚖️ Legal Engine
      {
        name: 'sidebar.legalEngine',
        href: `${basePath}/legal`,
        icon: ScaleIcon,
        permissions: ['legal:access'],
        features: ['LEGAL_ENGINE'] // Required feature
      },

      // 🌐 Interpretation Engine
      {
        name: 'sidebar.interpretationEngine',
        href: `${basePath}/(engines)/interpretation`,
        icon: LanguagesIcon,
        features: ['INTERPRETATION_ENGINE'] // Required feature
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
    DollarSignIcon,
    MicIcon,
    LanguagesIcon,
    HeadphonesIcon,
    RadioIcon,
    ClockIcon
  };
  
  return iconMap[iconName] || HomeIcon;
}; 