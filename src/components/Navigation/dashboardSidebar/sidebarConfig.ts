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
  featureBasedNavigationItems: (locale: string) => NavItem[];
}

export const sidebarConfig: SidebarConfig = {
  // Base navigation items (for all users)
  baseNavigationItems: (locale: string) => [
    { 
      name: 'sidebar.dashboard', 
      href: `/${locale}/admin/dashboard`, 
      icon: HomeIcon 
    },
    { 
      name: 'sidebar.notifications', 
      href: `/${locale}/admin/dashboard/notifications`, 
      icon: BellIcon,
      permissions: ['notifications:read'],
      badge: {
        key: 'unread',
        value: 0 // This will be updated dynamically
      }
    },
    { 
      name: 'sidebar.benefits', 
      href: `/${locale}/admin/dashboard/benefits`, 
      icon: UserIcon 
    },
    { 
      name: 'sidebar.help', 
      href: `/${locale}/admin/dashboard/help`, 
      icon: HelpCircleIcon 
    },
    { 
      name: 'sidebar.settings', 
      href: `/${locale}/admin/dashboard/settings`, 
      icon: SettingsIcon 
    },
  ],

  // Admin-specific navigation items
  adminNavigationItems: (locale: string) => [
    { 
      name: 'sidebar.adminDashboard', 
      href: `/${locale}/admin`, 
      icon: BarChartIcon, 
      permissions: ['admin:view']
    },
    { 
      name: 'sidebar.createNotifications', 
      href: `/${locale}/admin/notifications`, 
      icon: MessageSquareIcon,
      permissions: ['notifications:create']
    },
    { 
      name: 'sidebar.userManagement', 
      href: `/${locale}/admin/users`, 
      icon: UsersIcon, 
      permissions: ['users:read']
    },
    {
      name: 'sidebar.externalLinks',
      href: `/${locale}/admin/external-links`,
      icon: LinkIcon,
      permissions: ['admin:view']
    },
    { 
      name: 'sidebar.bookNow', 
      href: `/${locale}/bookings`, 
      icon: CalendarIcon,
      disabled: true,
      locked: true
    },
  ],



  // Feature-based navigation items (based on tenant features)
  featureBasedNavigationItems: (locale: string) => [
    // CMS Engine - Always available as it's the core
    {
      name: 'sidebar.cms',
      href: `/${locale}/cms`,
      icon: LayoutDashboardIcon,
      features: ['CMS_ENGINE'],
      permissions: ['cms:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.cmsPages',
          href: `/${locale}/cms/pages`,
          icon: FileTextIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsMedia',
          href: `/${locale}/cms/media`,
          icon: ImageIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsMenus',
          href: `/${locale}/cms/menus`,
          icon: MenuIcon,
          features: ['CMS_ENGINE'],
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsSettings',
          href: `/${locale}/cms/settings`,
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
      href: `/${locale}/cms/blog`,
      icon: BookOpenIcon,
      features: ['BLOG_MODULE'],
      permissions: ['blog:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.blogPosts',
          href: `/${locale}/cms/blog/posts`,
          icon: PenToolIcon,
          features: ['BLOG_MODULE'],
          permissions: ['blog:write'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.blogCategories',
          href: `/${locale}/cms/blog/categories`,
          icon: ClipboardListIcon,
          features: ['BLOG_MODULE'],
          permissions: ['blog:manage'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.blogSettings',
          href: `/${locale}/cms/blog/settings`,
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
      href: `/${locale}/cms/forms`,
      icon: FormInputIcon,
      features: ['FORMS_MODULE'],
      permissions: ['forms:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.formBuilder',
          href: `/${locale}/cms/forms/builder`,
          icon: PenToolIcon,
          features: ['FORMS_MODULE'],
          permissions: ['forms:create'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.formSubmissions',
          href: `/${locale}/cms/forms/submissions`,
          icon: ClipboardListIcon,
          features: ['FORMS_MODULE'],
          permissions: ['forms:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.formSettings',
          href: `/${locale}/cms/forms/settings`,
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
      href: `/${locale}/ecommerce`,
      icon: ShoppingCartIcon,
      features: ['ECOMMERCE_ENGINE'],
      permissions: ['ecommerce:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.products',
          href: `/${locale}/ecommerce/products`,
          icon: PackageIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['products:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.orders',
          href: `/${locale}/ecommerce/orders`,
          icon: ClipboardListIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['orders:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.customers',
          href: `/${locale}/ecommerce/customers`,
          icon: UsersIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['customers:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.payments',
          href: `/${locale}/ecommerce/payments`,
          icon: CreditCardIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['payments:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.shipping',
          href: `/${locale}/ecommerce/shipping`,
          icon: TruckIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['shipping:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.reviews',
          href: `/${locale}/ecommerce/reviews`,
          icon: StarIcon,
          features: ['ECOMMERCE_ENGINE'],
          permissions: ['reviews:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.ecommerceSettings',
          href: `/${locale}/ecommerce/settings`,
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
      href: `/${locale}/bookings`,
      icon: CalendarIcon,
      features: ['BOOKING_ENGINE'],
      permissions: ['bookings:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.calendar',
          href: `/${locale}/bookings/calendar`,
          icon: CalendarIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['bookings:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.services',
          href: `/${locale}/bookings/services`,
          icon: ClipboardListIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['services:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.staff',
          href: `/${locale}/bookings/staff`,
          icon: UsersIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['staff:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.locations',
          href: `/${locale}/bookings/locations`,
          icon: HomeIcon,
          features: ['BOOKING_ENGINE'],
          permissions: ['locations:read'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.bookingSettings',
          href: `/${locale}/bookings/settings`,
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

// Role hierarchy for sorting
export const roleOrder = {
  'ADMIN': 1,
  'MANAGER': 2,
  'EMPLOYEE': 3, 
  'USER': 4
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

export const sortRoles = (roles: { id: string; name: string; description?: string }[]) => {
  return [...roles].sort((a, b) => {
    const orderA = roleOrder[a.name as keyof typeof roleOrder] || 999;
    const orderB = roleOrder[b.name as keyof typeof roleOrder] || 999;
    return orderA - orderB;
  });
};

export default sidebarConfig; 