import React from 'react';
import { 
  LayoutDashboard,
  FileText,
  Menu,
  Image as ImageIcon, 
  Settings,
  BookOpen,
  Package,
  ShoppingCart,
  Users,
  Store,
  Tags,
  Truck,
  CreditCard,
  BarChart3,
  Percent,
  Star,
  DollarSign,
  Receipt,
  Globe,
  Warehouse,
  Calendar,
  MapPin,
  Briefcase,
  UserCheck,
  Clock,
  Scale,
  Building2,
  Send,
  Activity,
  AlertTriangle,
  PieChart
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: 'red' | 'blue' | 'green' | 'yellow';
}

export interface NavigationSection {
  section: string;
  title: string;
  items: NavigationItem[];
}

export interface EngineNavigation {
  engineKey: string;
  engineName: string;
  engineIcon: React.ComponentType<{ className?: string }>;
  sections: NavigationSection[];
}

export const getEngineNavigation = (locale: string, tenantSlug: string): Record<string, EngineNavigation> => ({
  cms: {
    engineKey: 'cms',
    engineName: 'CMS',
    engineIcon: FileText,
    sections: [
      {
        section: 'main',
        title: 'Main Navigation',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: `/${locale}/${tenantSlug}/cms`,
            icon: LayoutDashboard
          },
          {
            id: 'pages',
            label: 'Pages',
            href: `/${locale}/${tenantSlug}/cms/pages`,
            icon: FileText
          },
          {
            id: 'menus',
            label: 'Menus',
            href: `/${locale}/${tenantSlug}/cms/menus`,
            icon: Menu
          },
          {
            id: 'media',
            label: 'Media',
            href: `/${locale}/${tenantSlug}/cms/media`,
            icon: ImageIcon
          },
          {
            id: 'forms',
            label: 'Forms',
            href: `/${locale}/${tenantSlug}/cms/forms`,
            icon: FileText
          },
          {
            id: 'blog',
            label: 'Blog',
            href: `/${locale}/${tenantSlug}/cms/blog`,
            icon: BookOpen
          }
        ]
      },
      {
        section: 'configuration',
        title: 'Configuration',
        items: [
          {
            id: 'settings',
            label: 'Settings',
            href: `/${locale}/${tenantSlug}/cms/settings`,
            icon: Settings
          }
        ]
      }
    ]
  },

  bookings: {
    engineKey: 'bookings',
    engineName: 'Bookings',
    engineIcon: Calendar,
    sections: [
      {
        section: 'main',
        title: 'Main',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: `/${locale}/${tenantSlug}/bookings`,
            icon: LayoutDashboard
          },
          {
            id: 'calendar',
            label: 'Calendar',
            href: `/${locale}/${tenantSlug}/bookings/calendar`,
            icon: Calendar
          },
          {
            id: 'bookings',
            label: 'Bookings',
            href: `/${locale}/${tenantSlug}/bookings/list`,
            icon: BookOpen
          }
        ]
      },
      {
        section: 'management',
        title: 'Management',
        items: [
          {
            id: 'services',
            label: 'Services',
            href: `/${locale}/${tenantSlug}/bookings/services`,
            icon: Briefcase
          },
          {
            id: 'categories',
            label: 'Categories',
            href: `/${locale}/${tenantSlug}/bookings/categories`,
            icon: Users
          },
          {
            id: 'locations',
            label: 'Locations',
            href: `/${locale}/${tenantSlug}/bookings/locations`,
            icon: MapPin
          },
          {
            id: 'staff',
            label: 'Staff',
            href: `/${locale}/${tenantSlug}/bookings/staff`,
            icon: UserCheck
          },
          {
            id: 'rules',
            label: 'Rules',
            href: `/${locale}/${tenantSlug}/bookings/rules`,
            icon: Clock
          }
        ]
      }
    ]
  },

  commerce: {
    engineKey: 'commerce',
    engineName: 'E-COMMERCE',
    engineIcon: Store,
    sections: [
      {
        section: 'main',
        title: 'Main',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: `/${locale}/${tenantSlug}/commerce`,
            icon: LayoutDashboard
          },
          {
            id: 'shops',
            label: 'Shops',
            href: `/${locale}/${tenantSlug}/commerce/shops`,
            icon: Store
          },
          {
            id: 'orders',
            label: 'Orders',
            href: `/${locale}/${tenantSlug}/commerce/orders`,
            icon: ShoppingCart
          },
          {
            id: 'customers',
            label: 'Customers',
            href: `/${locale}/${tenantSlug}/commerce/customers`,
            icon: Users
          }
        ]
      },
      {
        section: 'catalog',
        title: 'Catalog Management',
        items: [
          {
            id: 'products',
            label: 'Products',
            href: `/${locale}/${tenantSlug}/commerce/products`,
            icon: Package
          },
          {
            id: 'categories',
            label: 'Categories',
            href: `/${locale}/${tenantSlug}/commerce/categories`,
            icon: Tags
          },
          {
            id: 'inventory',
            label: 'Inventory',
            href: `/${locale}/${tenantSlug}/commerce/inventory`,
            icon: Warehouse
          }
        ]
      },
      {
        section: 'pricing',
        title: 'Pricing & Finance',
        items: [
          {
            id: 'pricing',
            label: 'Pricing',
            href: `/${locale}/${tenantSlug}/commerce/pricing`,
            icon: DollarSign
          },
          {
            id: 'currencies',
            label: 'Currencies',
            href: `/${locale}/${tenantSlug}/commerce/currencies`,
            icon: Globe
          },
          {
            id: 'taxes',
            label: 'Taxes',
            href: `/${locale}/${tenantSlug}/commerce/taxes`,
            icon: Receipt
          },
          {
            id: 'discounts',
            label: 'Discounts',
            href: `/${locale}/${tenantSlug}/commerce/discounts`,
            icon: Percent
          }
        ]
      },
      {
        section: 'operations',
        title: 'Operations',
        items: [
          {
            id: 'shipping',
            label: 'Shipping',
            href: `/${locale}/${tenantSlug}/commerce/shipping`,
            icon: Truck
          },
          {
            id: 'payments',
            label: 'Payments',
            href: `/${locale}/${tenantSlug}/commerce/payments`,
            icon: CreditCard
          },
          {
            id: 'reviews',
            label: 'Reviews',
            href: `/${locale}/${tenantSlug}/commerce/reviews`,
            icon: Star
          }
        ]
      },
      {
        section: 'analytics',
        title: 'Analytics',
        items: [
          {
            id: 'analytics',
            label: 'Analytics',
            href: `/${locale}/${tenantSlug}/commerce/analytics`,
            icon: BarChart3
          }
        ]
      },
      {
        section: 'configuration',
        title: 'Configuration',
        items: [
          {
            id: 'settings',
            label: 'Settings',
            href: `/${locale}/${tenantSlug}/commerce/settings`,
            icon: Settings
          }
        ]
      }
    ]
  },

  legal: {
    engineKey: 'legal',
    engineName: 'Legal',
    engineIcon: Scale,
    sections: [
      {
        section: 'main',
        title: 'Legal Management',
        items: [
          {
            id: 'dashboard',
            label: 'Management Dashboard',
            href: `/${locale}/${tenantSlug}/legal`,
            icon: LayoutDashboard
          },
          {
            id: 'incorporations',
            label: 'All Incorporations',
            href: `/${locale}/${tenantSlug}/legal/incorporations`,
            icon: Building2,
            badge: '24'
          },
          {
            id: 'team',
            label: 'Team Management',
            href: `/${locale}/${tenantSlug}/legal/team`,
            icon: Users,
            badge: '4'
          },
          {
            id: 'delegation',
            label: 'Task Delegation',
            href: `/${locale}/${tenantSlug}/legal/delegation`,
            icon: Send
          },
          {
            id: 'performance',
            label: 'Performance',
            href: `/${locale}/${tenantSlug}/legal/performance`,
            icon: Activity
          },
          {
            id: 'clients',
            label: 'Client Overview',
            href: `/${locale}/${tenantSlug}/legal/clients`,
            icon: Briefcase
          }
        ]
      },
      {
        section: 'monitoring',
        title: 'Monitoring & Analytics',
        items: [
          {
            id: 'alerts',
            label: 'Alerts & Blockers',
            href: `/${locale}/${tenantSlug}/legal/alerts`,
            icon: AlertTriangle,
            badge: '3',
            badgeColor: 'red'
          },
          {
            id: 'reports',
            label: 'Reports',
            href: `/${locale}/${tenantSlug}/legal/reports`,
            icon: BarChart3
          },
          {
            id: 'analytics',
            label: 'Analytics',
            href: `/${locale}/${tenantSlug}/legal/analytics`,
            icon: PieChart
          },
          {
            id: 'calendar',
            label: 'Calendar View',
            href: `/${locale}/${tenantSlug}/legal/calendar`,
            icon: Calendar
          }
        ]
      },
      {
        section: 'administration',
        title: 'Administration',
        items: [
          {
            id: 'billing',
            label: 'Billing & Revenue',
            href: `/${locale}/${tenantSlug}/legal/billing`,
            icon: DollarSign
          },
          {
            id: 'settings',
            label: 'Settings',
            href: `/${locale}/${tenantSlug}/legal/settings`,
            icon: Settings
          }
        ]
      }
    ]
  },

  hrms: {
    engineKey: 'hrms',
    engineName: 'HRMS',
    engineIcon: Users,
    sections: [
      {
        section: 'main',
        title: 'Human Resources',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: `/${locale}/${tenantSlug}/hrms`,
            icon: LayoutDashboard
          },
          {
            id: 'employees',
            label: 'Employees',
            href: `/${locale}/${tenantSlug}/hrms/employees`,
            icon: Users
          },
          {
            id: 'departments',
            label: 'Departments',
            href: `/${locale}/${tenantSlug}/hrms/departments`,
            icon: Building2
          },
          {
            id: 'attendance',
            label: 'Attendance',
            href: `/${locale}/${tenantSlug}/hrms/attendance`,
            icon: Clock
          },
          {
            id: 'payroll',
            label: 'Payroll',
            href: `/${locale}/${tenantSlug}/hrms/payroll`,
            icon: DollarSign
          }
        ]
      },
      {
        section: 'management',
        title: 'Management',
        items: [
          {
            id: 'recruitment',
            label: 'Recruitment',
            href: `/${locale}/${tenantSlug}/hrms/recruitment`,
            icon: UserCheck
          },
          {
            id: 'performance',
            label: 'Performance',
            href: `/${locale}/${tenantSlug}/hrms/performance`,
            icon: Activity
          },
          {
            id: 'training',
            label: 'Training',
            href: `/${locale}/${tenantSlug}/hrms/training`,
            icon: BookOpen
          }
        ]
      },
      {
        section: 'configuration',
        title: 'Configuration',
        items: [
          {
            id: 'settings',
            label: 'Settings',
            href: `/${locale}/${tenantSlug}/hrms/settings`,
            icon: Settings
          }
        ]
      }
    ]
  },

  interpretation: {
    engineKey: 'interpretation',
    engineName: 'Interpretation',
    engineIcon: Globe,
    sections: [
      {
        section: 'main',
        title: 'Interpretation Services',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: `/${locale}/${tenantSlug}/interpretation`,
            icon: LayoutDashboard
          },
          {
            id: 'sessions',
            label: 'Sessions',
            href: `/${locale}/${tenantSlug}/interpretation/sessions`,
            icon: Calendar
          },
          {
            id: 'interpreters',
            label: 'Interpreters',
            href: `/${locale}/${tenantSlug}/interpretation/interpreters`,
            icon: Users
          },
          {
            id: 'languages',
            label: 'Languages',
            href: `/${locale}/${tenantSlug}/interpretation/languages`,
            icon: Globe
          }
        ]
      },
      {
        section: 'management',
        title: 'Management',
        items: [
          {
            id: 'scheduling',
            label: 'Scheduling',
            href: `/${locale}/${tenantSlug}/interpretation/scheduling`,
            icon: Clock
          },
          {
            id: 'clients',
            label: 'Clients',
            href: `/${locale}/${tenantSlug}/interpretation/clients`,
            icon: Briefcase
          }
        ]
      },
      {
        section: 'configuration',
        title: 'Configuration',
        items: [
          {
            id: 'settings',
            label: 'Settings',
            href: `/${locale}/${tenantSlug}/interpretation/settings`,
            icon: Settings
          }
        ]
      }
    ]
  }
}); 