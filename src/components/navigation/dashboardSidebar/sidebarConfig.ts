import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  SettingsIcon,
  HelpCircleIcon,
  BellIcon,
  UsersIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  BarChartIcon,
  UserPlusIcon,
  LineChartIcon,
  LockIcon,
  LinkIcon,
  MenuIcon,
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
  StarIcon
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
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

export interface SidebarConfig {
  baseNavigationItems: (locale: string) => NavItem[];
  adminNavigationItems: (locale: string) => NavItem[];
  tenantAdminNavigationItems: (locale: string, tenantSlug?: string) => NavItem[];
  tenantEngineNavigationItems: (locale: string, tenantSlug?: string) => NavItem[];
  superAdminNavigationItems: (locale: string) => NavItem[];
  featureBasedNavigationItems: (locale: string, tenantSlug: string) => NavItem[];
}

export const sidebarConfig: SidebarConfig = {
  // Base navigation items (for all users)
  baseNavigationItems: (locale: string, tenantSlug?: string) => [
    { 
      name: 'sidebar.dashboard', 
      href: `/${locale}/${tenantSlug}/dashboard`, 
      icon: HomeIcon 
    },
    { 
      name: 'sidebar.notifications', 
      href: `/${locale}/${tenantSlug}/dashboard/notifications`, 
      icon: BellIcon,
      permissions: ['notifications:read'],
      badge: {
        key: 'unread',
        value: 0 // This will be updated dynamically
      }
    },
    { 
      name: 'sidebar.benefits', 
      href: `/${locale}/${tenantSlug}/dashboard/benefits`, 
      icon: UserIcon 
    },
    { 
      name: 'sidebar.help', 
      href: `/${locale}/${tenantSlug}/dashboard/help`, 
      icon: HelpCircleIcon 
    },
    { 
      name: 'sidebar.settings', 
      href: `/${locale}/${tenantSlug}/dashboard/settings`, 
      icon: SettingsIcon 
    },
  ],

  // Admin-specific navigation items
  adminNavigationItems: (locale: string, tenantSlug?: string) => [
    { 
      name: 'sidebar.adminDashboard', 
      href: `/${locale}/${tenantSlug}/dashboard`, 
      icon: BarChartIcon, 
      permissions: ['admin:view']
    },
    { 
      name: 'sidebar.createNotifications', 
      href: `/${locale}/${tenantSlug}/dashboard/notifications`, 
      icon: MessageSquareIcon,
      permissions: ['notifications:create']
    },
    { 
      name: 'sidebar.userManagement', 
      href: `/${locale}/${tenantSlug}/dashboard/users`, 
      icon: UsersIcon, 
      permissions: ['users:read']
    },
    {
      name: 'sidebar.externalLinks',
      href: `/${locale}/${tenantSlug}/dashboard/external-links`,
      icon: LinkIcon,
      permissions: ['admin:view']
    },
    { 
      name: 'sidebar.bookNow', 
      href: `/${locale}/${tenantSlug}/bookings`, 
      icon: CalendarIcon,
      disabled: true,
      locked: true
    },
  ],

  // TenantAdmin navigation items - 6 main sections for tenant administrators
  tenantAdminNavigationItems: (locale: string, tenantSlug?: string) => {
    const basePath = tenantSlug ? `/${locale}/${tenantSlug}/dashboard` : `/${locale}/admin`;
    
    return [
      // 📊 Dashboard Overview
      { 
        name: 'sidebar.dashboard', 
        href: basePath, 
        icon: LayoutDashboardIcon,
        permissions: ['admin:view']
      },
      
      // 🧩 1. Gestión de módulos
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

      // 👥 2. Gestión de usuarios
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

      // 🏢 3. Gestión de la empresa
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

      // 📊 4. Reportes e insights
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
          }
        ]
      }
    ];
  },

  // Tenant Engine navigation items - Business Engines for tenant context
  tenantEngineNavigationItems: (locale: string, tenantSlug?: string) => {
    const basePath = tenantSlug ? `/${locale}/${tenantSlug}` : `/${locale}/admin`;
    
    return [
      // 📊 CMS Engine - Always available
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

      // 🧾 Booking Engine
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
            name: 'sidebar.hrmsSettings',
            href: `${basePath}/hrms/settings`,
            icon: SettingsIcon,
            permissions: ['hrms:manage']
          }
        ]
      }
    ];
  },

  // SuperAdmin navigation items - MCP (Master Control Panel)
  superAdminNavigationItems: (locale: string) => [
    // 📊 Dashboard Overview
    { 
      name: 'sidebar.mcpDashboard', 
      href: `/${locale}/super-admin`, 
      icon: LayoutDashboardIcon,
      permissions: ['superadmin:view']
    },

    // 🏙️ 1. Gestión de Tenants
    {
      name: 'sidebar.tenantManagement',
      href: `/${locale}/super-admin/tenants`,
      icon: HomeIcon,
      permissions: ['tenants:manage'],
      children: [
        {
          name: 'sidebar.allTenants',
          href: `/${locale}/super-admin/tenants/list`,
          icon: HomeIcon,
          permissions: ['tenants:read']
        },
        {
          name: 'sidebar.createTenant',
          href: `/${locale}/super-admin/tenants/create`,
          icon: UserPlusIcon,
          permissions: ['tenants:create']
        },
        {
          name: 'sidebar.tenantHealth',
          href: `/${locale}/super-admin/tenants/health`,
          icon: BarChartIcon,
          permissions: ['tenants:monitor']
        },
        {
          name: 'sidebar.tenantImpersonation',
          href: `/${locale}/super-admin/tenants/impersonate`,
          icon: UserIcon,
          permissions: ['tenants:impersonate']
        }
      ]
    },

    // 🧩 2. Módulos disponibles
    {
      name: 'sidebar.globalModuleManagement',
      href: `/${locale}/super-admin/modules`,
      icon: PackageIcon,
      permissions: ['modules:manage'],
      children: [
        {
          name: 'sidebar.moduleRegistry',
          href: `/${locale}/super-admin/modules/registry`,
          icon: ClipboardListIcon,
          permissions: ['modules:read']
        },
        {
          name: 'sidebar.createModule',
          href: `/${locale}/super-admin/modules/create`,
          icon: UserPlusIcon,
          permissions: ['modules:create']
        },
        {
          name: 'sidebar.moduleVersions',
          href: `/${locale}/super-admin/modules/versions`,
          icon: SettingsIcon,
          permissions: ['modules:versions']
        },
        {
          name: 'sidebar.moduleCompatibility',
          href: `/${locale}/super-admin/modules/compatibility`,
          icon: ShieldIcon,
          permissions: ['modules:compatibility']
        }
      ]
    },

    // 🧑‍💻 3. Solicitudes de Activación / Customización
    {
      name: 'sidebar.activationRequests',
      href: `/${locale}/super-admin/requests`,
      icon: MessageSquareIcon,
      permissions: ['requests:manage'],
      badge: {
        key: 'pendingRequests',
        value: 0
      },
      children: [
        {
          name: 'sidebar.pendingRequests',
          href: `/${locale}/super-admin/requests/pending`,
          icon: ClipboardListIcon,
          permissions: ['requests:read']
        },
        {
          name: 'sidebar.requestHistory',
          href: `/${locale}/super-admin/requests/history`,
          icon: BarChartIcon,
          permissions: ['requests:history']
        },
        {
          name: 'sidebar.customizationRequests',
          href: `/${locale}/super-admin/requests/customization`,
          icon: PenToolIcon,
          permissions: ['requests:customization']
        }
      ]
    },

    // 🧠 4. Automatizaciones del MCP
    {
      name: 'sidebar.mcpAutomation',
      href: `/${locale}/super-admin/automation`,
      icon: SettingsIcon,
      permissions: ['automation:manage'],
      children: [
        {
          name: 'sidebar.tenantTemplates',
          href: `/${locale}/super-admin/automation/templates`,
          icon: LayoutDashboardIcon,
          permissions: ['templates:manage']
        },
        {
          name: 'sidebar.automatedProvisioning',
          href: `/${locale}/super-admin/automation/provisioning`,
          icon: UserPlusIcon,
          permissions: ['provisioning:manage']
        },
        {
          name: 'sidebar.migrationControl',
          href: `/${locale}/super-admin/automation/migrations`,
          icon: ClipboardListIcon,
          permissions: ['migrations:manage']
        },
        {
          name: 'sidebar.infrastructureControl',
          href: `/${locale}/super-admin/automation/infrastructure`,
          icon: ShieldIcon,
          permissions: ['infrastructure:manage']
        }
      ]
    },

    // 📊 5. Analytics y Monitoreo Global
    {
      name: 'sidebar.globalAnalytics',
      href: `/${locale}/super-admin/analytics`,
      icon: BarChartIcon,
      permissions: ['analytics:global'],
      children: [
        {
          name: 'sidebar.tenantMetrics',
          href: `/${locale}/super-admin/analytics/tenants`,
          icon: LineChartIcon,
          permissions: ['analytics:tenants']
        },
        {
          name: 'sidebar.moduleUsage',
          href: `/${locale}/super-admin/analytics/modules`,
          icon: PackageIcon,
          permissions: ['analytics:modules']
        },
        {
          name: 'sidebar.systemErrors',
          href: `/${locale}/super-admin/analytics/errors`,
          icon: ClipboardListIcon,
          permissions: ['errors:monitor']
        },
        {
          name: 'sidebar.performanceMetrics',
          href: `/${locale}/super-admin/analytics/performance`,
          icon: BarChartIcon,
          permissions: ['performance:monitor']
        },
        {
          name: 'sidebar.systemLogs',
          href: `/${locale}/super-admin/analytics/logs`,
          icon: FileTextIcon,
          permissions: ['logs:read']
        }
      ]
    },

    // 📦 6. Gestión de archivos globales
    {
      name: 'sidebar.globalFileManagement',
      href: `/${locale}/super-admin/files`,
      icon: ImageIcon,
      permissions: ['files:global'],
      children: [
        {
          name: 'sidebar.sharedAssets',
          href: `/${locale}/super-admin/files/shared`,
          icon: ImageIcon,
          permissions: ['assets:shared']
        },
        {
          name: 'sidebar.assetVersioning',
          href: `/${locale}/super-admin/files/versions`,
          icon: SettingsIcon,
          permissions: ['assets:versions']
        },
        {
          name: 'sidebar.templateLibrary',
          href: `/${locale}/super-admin/files/templates`,
          icon: LayoutDashboardIcon,
          permissions: ['templates:library']
        },
        {
          name: 'sidebar.componentLibrary',
          href: `/${locale}/super-admin/files/components`,
          icon: PackageIcon,
          permissions: ['components:library']
        }
      ]
    },

    // 🔒 7. Control de acceso
    {
      name: 'sidebar.mcpAccessControl',
      href: `/${locale}/super-admin/access`,
      icon: ShieldIcon,
      permissions: ['access:control'],
      children: [
        {
          name: 'sidebar.mcpUsers',
          href: `/${locale}/super-admin/access/users`,
          icon: UsersIcon,
          permissions: ['mcp:users']
        },
        {
          name: 'sidebar.mcpRoles',
          href: `/${locale}/super-admin/access/roles`,
          icon: ShieldIcon,
          permissions: ['mcp:roles']
        },
        {
          name: 'sidebar.activityAudit',
          href: `/${locale}/super-admin/access/audit`,
          icon: ClipboardListIcon,
          permissions: ['audit:read']
        },
        {
          name: 'sidebar.securityPolicies',
          href: `/${locale}/super-admin/access/security`,
          icon: LockIcon,
          permissions: ['security:policies']
        },
        {
          name: 'sidebar.twoFactorAuth',
          href: `/${locale}/super-admin/access/2fa`,
          icon: ShieldIcon,
          permissions: ['security:2fa']
        }
      ]
    },

    // 🧪 8. Entorno de pruebas / staging
    {
      name: 'sidebar.testingEnvironment',
      href: `/${locale}/super-admin/testing`,
      icon: SettingsIcon,
      permissions: ['testing:manage'],
      children: [
        {
          name: 'sidebar.sandboxTenants',
          href: `/${locale}/super-admin/testing/sandbox`,
          icon: HomeIcon,
          permissions: ['sandbox:manage']
        },
        {
          name: 'sidebar.betaModules',
          href: `/${locale}/super-admin/testing/beta`,
          icon: PackageIcon,
          permissions: ['beta:manage']
        },
        {
          name: 'sidebar.featureTesting',
          href: `/${locale}/super-admin/testing/features`,
          icon: PenToolIcon,
          permissions: ['features:test']
        },
        {
          name: 'sidebar.stagingControl',
          href: `/${locale}/super-admin/testing/staging`,
          icon: SettingsIcon,
          permissions: ['staging:control']
        }
      ]
    }
  ],

  // Feature-based navigation items (based on tenant features)
  featureBasedNavigationItems: (locale: string, tenantSlug: string) => [
    // CMS Engine - Always available as it's the core
    {
      name: 'sidebar.cms',
      href: `/${locale}/${tenantSlug}/cms`,
      icon: LayoutDashboardIcon,
      features: ['CMS_ENGINE'],
      permissions: ['cms:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.cmsPages',
          href: `/${locale}/${tenantSlug}/cms/pages`,
          icon: FileTextIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsMedia',
          href: `/${locale}/${tenantSlug}/cms/media`,
          icon: ImageIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsMenus',
          href: `/${locale}/${tenantSlug}/cms/menus`,
          icon: MenuIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsSettings',
          href: `/${locale}/${tenantSlug}/cms/settings`,
          icon: SettingsIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        }
      ]
    },

    // Blog Module
    {
      name: 'sidebar.blog',
      href: `/${locale}/${tenantSlug}/cms/blog`,
      icon: BookOpenIcon,
      features: ['BLOG_MODULE'],
      permissions: ['blog:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.blogPosts',
          href: `/${locale}/${tenantSlug}/cms/blog/posts`,
          icon: PenToolIcon,
          features: ['BLOG_MODULE'],
          permissions: ['blog:write'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.blogCategories',
          href: `/${locale}/${tenantSlug}/cms/blog/categories`,
          icon: ClipboardListIcon,
          features: ['BLOG_MODULE'],
          permissions: ['blog:manage'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.blogSettings',
          href: `/${locale}/${tenantSlug}/cms/blog/settings`,
          icon: SettingsIcon,
          features: ['BLOG_MODULE'],
          permissions: ['blog:manage'],
          roles: ['ADMIN', 'MANAGER']
        }
      ]
    },

    // Forms Module
    {
      name: 'sidebar.forms',
      href: `/${locale}/${tenantSlug}/cms/forms`,
      icon: FormInputIcon,
      features: ['FORMS_MODULE'],
      permissions: ['forms:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.formBuilder',
          href: `/${locale}/${tenantSlug}/cms/forms/builder`,
          icon: PenToolIcon,
          features: ['FORMS_MODULE'],
          permissions: ['forms:create'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.formSubmissions',
          href: `/${locale}/${tenantSlug}/cms/forms/submissions`,
          icon: ClipboardListIcon,
          features: ['FORMS_MODULE'],
          permissions: ['forms:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.formSettings',
          href: `/${locale}/${tenantSlug}/cms/forms/settings`,
          icon: SettingsIcon,
          features: ['FORMS_MODULE'],
          permissions: ['forms:manage'],
          roles: ['ADMIN', 'MANAGER']
        }
      ]
    },

    // E-commerce Engine
    {
      name: 'sidebar.ecommerce',
      href: `/${locale}/${tenantSlug}/ecommerce`,
      icon: ShoppingCartIcon,
      features: ['ECOMMERCE_ENGINE'],
      permissions: ['ecommerce:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.products',
          href: `/${locale}/${tenantSlug}/ecommerce/products`,
          icon: PackageIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['products:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.orders',
          href: `/${locale}/${tenantSlug}/ecommerce/orders`,
          icon: ClipboardListIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['orders:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.customers',
          href: `/${locale}/${tenantSlug}/ecommerce/customers`,
          icon: UsersIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['customers:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.payments',
          href: `/${locale}/${tenantSlug}/ecommerce/payments`,
          icon: CreditCardIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['payments:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.shipping',
          href: `/${locale}/${tenantSlug}/ecommerce/shipping`,
          icon: TruckIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['shipping:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.reviews',
          href: `/${locale}/${tenantSlug}/ecommerce/reviews`,
          icon: StarIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['reviews:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.ecommerceSettings',
          href: `/${locale}/${tenantSlug}/ecommerce/settings`,
          icon: SettingsIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['ecommerce:manage'],
      roles: ['ADMIN', 'MANAGER']
        }
      ]
    },

    // Booking Engine
    {
      name: 'sidebar.bookings',
      href: `/${locale}/${tenantSlug}/bookings`,
      icon: CalendarIcon,
      features: ['BOOKING_ENGINE'],
      permissions: ['bookings:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.calendar',
          href: `/${locale}/${tenantSlug}/bookings/calendar`,
          icon: CalendarIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['bookings:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.services',
          href: `/${locale}/${tenantSlug}/bookings/services`,
          icon: ClipboardListIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['services:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.staff',
          href: `/${locale}/${tenantSlug}/bookings/staff`,
          icon: UsersIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['staff:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.locations',
          href: `/${locale}/${tenantSlug}/bookings/locations`,
          icon: HomeIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['locations:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.bookingSettings',
          href: `/${locale}/${tenantSlug}/bookings/settings`,
          icon: SettingsIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['bookings:manage'],
      roles: ['ADMIN', 'MANAGER']
        }
      ]
    }
  ]
};

// Icon mapping for external links
export const iconMapping: { [key: string]: React.ElementType } = {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  SettingsIcon,
  HelpCircleIcon,
  BellIcon,
  UsersIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  BarChartIcon,
  UserPlusIcon,
  LineChartIcon,
  LockIcon,
  LinkIcon,
  MenuIcon,
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
  StarIcon
};

// Helper function to get icon component
export const getIconComponent = (iconName: string): React.ElementType => {
  return iconMapping[iconName] || UserIcon; // Default to UserIcon if not found
};


// Helper function to filter navigation items based on tenant features
export const filterNavigationByFeatures = (
  items: NavItem[], 
  tenantFeatures: string[]
): NavItem[] => {
  console.log('filterNavigationByFeatures called with:', { items: items.length, tenantFeatures });
  
  return items.filter(item => {
    console.log(`Checking item: ${item.name}, required features:`, item.features);
    
    // If no features are required, include the item
    if (!item.features || item.features.length === 0) {
      console.log(`Item ${item.name} has no required features, including`);
      return true;
    }
    
    // Check if tenant has all required features
    const hasRequiredFeatures = item.features.every(feature => {
      const hasFeature = tenantFeatures.includes(feature);
      console.log(`Checking feature ${feature}: ${hasFeature}`);
      return hasFeature;
    });
    
    console.log(`Item ${item.name} has required features: ${hasRequiredFeatures}`);
    
    if (!hasRequiredFeatures) {
      return false;
    }
    
    // If item has children, filter them recursively
    if (item.children) {
      const filteredChildren = filterNavigationByFeatures(item.children, tenantFeatures);
      console.log(`Item ${item.name} children after filtering:`, filteredChildren.length);
      // Only include parent if it has children after filtering
      return filteredChildren.length > 0;
    }
    
    return true;
  }).map(item => {
    // Filter children if they exist
    if (item.children) {
      return {
        ...item,
        children: filterNavigationByFeatures(item.children, tenantFeatures)
      };
    }
    return item;
  });
};

export default sidebarConfig; 