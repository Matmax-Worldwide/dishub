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
  ShieldIcon
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: string[];
  permissions?: string[];
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
  toolsNavigationItems: (locale: string) => NavItem[];
}

export const sidebarConfig: SidebarConfig = {
  // Base navigation items (for all users)
  baseNavigationItems: (locale: string) => [
    { 
      name: 'sidebar.dashboard', 
      href: `/${locale}/evoque/dashboard`, 
      icon: HomeIcon 
    },
    { 
      name: 'sidebar.notifications', 
      href: `/${locale}/evoque/dashboard/notifications`, 
      icon: BellIcon,
      permissions: ['notifications:read'],
      badge: {
        key: 'unread',
        value: 0 // This will be updated dynamically
      }
    },
    { 
      name: 'sidebar.benefits', 
      href: `/${locale}/evoque/evoque/dashboard/benefits`, 
      icon: UserIcon 
    },
    { 
      name: 'sidebar.help', 
      href: `/${locale}/evoque/evoque/dashboard/help`, 
      icon: HelpCircleIcon 
    },
    { 
      name: 'sidebar.settings', 
      href: `/${locale}/evoque/evoque/dashboard/settings`, 
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

  // Tools navigation items (for admins and managers)
  toolsNavigationItems: (locale: string) => [
    {
      name: 'sidebar.cms',
      href: `/${locale}/cms`,
      icon: ClipboardListIcon,
      permissions: ['cms:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: 'sidebar.cmsPages',
          href: `/${locale}/cms/pages`,
          icon: LineChartIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsMedia',
          href: `/${locale}/cms/media`,
          icon: LinkIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsMenus',
          href: `/${locale}/cms/menus`,
          icon: MenuIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: 'sidebar.cmsSettings',
          href: `/${locale}/cms/settings`,
          icon: SettingsIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        }
      ]
    },
    {
      name: 'sidebar.commerce',
      href: `/${locale}/commerce`,
      icon: BarChartIcon,
      permissions: ['commerce:access'],
      roles: ['ADMIN', 'MANAGER']
    },
    {
      name: 'sidebar.bookings',
      href: `/${locale}/bookings`,
      icon: CalendarIcon,
      permissions: ['bookings:access'],
      roles: ['ADMIN', 'MANAGER']
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
  ShieldIcon
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

// Helper function to sort roles
export const sortRoles = (roles: { id: string; name: string; description?: string }[]) => {
  return [...roles].sort((a, b) => {
    const orderA = roleOrder[a.name as keyof typeof roleOrder] || 999;
    const orderB = roleOrder[b.name as keyof typeof roleOrder] || 999;
    return orderA - orderB;
  });
};

export default sidebarConfig; 