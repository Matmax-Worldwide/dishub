'use client';

import { useEffect, useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  SettingsIcon,
  HelpCircleIcon,
  BellIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  UsersIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  BarChartIcon,
  ShieldIcon,
  UserPlusIcon,
  LineChartIcon,
  LockIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { useAuth } from '@/hooks/useAuth';

// GraphQL queries y mutations
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      firstName
      lastName
      role {
        id
        name
        description
      }
    }
  }
`;

const GET_UNREAD_NOTIFICATIONS_COUNT = gql`
  query GetUnreadNotificationsCount {
    unreadNotificationsCount
  }
`;

const GET_ACTIVE_EXTERNAL_LINKS = gql`
  query GetActiveExternalLinks {
    activeExternalLinks {
      id
      name
      url
      icon
      description
      order
    }
  }
`;

interface NavItem {
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
}

interface ExternalLinkType {
  id: string;
  name: string;
  url: string;
  icon: string;
  description?: string;
  order: number;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user: authUser } = useAuth();
  
  // Cargar datos del perfil
  const { data } = useQuery(GET_USER_PROFILE, {
    client,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    context: {
      headers: {
        // This ensures the authorization header is added correctly
        credentials: 'include',
      }
    },
    onCompleted: (data) => {
      console.log('Profile data loaded:', data?.me);
    },
  });

  // Check if user is an admin (using both sources of data)
  const isAdmin = data?.me?.role?.name === 'ADMIN' || authUser?.role?.name === 'ADMIN';
  const isManager = data?.me?.role?.name === 'MANAGER' || authUser?.role?.name === 'MANAGER';

  // Cargar los datos de notificaciones no leídas
  const { data: notificationsData } = useQuery(GET_UNREAD_NOTIFICATIONS_COUNT, {
    client,
    fetchPolicy: 'cache-and-network',
  });

  // Actualizar el contador de notificaciones cuando cambien los datos
  useEffect(() => {
    if (notificationsData?.unreadNotificationsCount !== undefined) {
      setUnreadCount(notificationsData.unreadNotificationsCount);
    }
  }, [notificationsData]);

  // Get external links
  const { data: externalLinksData } = useQuery(GET_ACTIVE_EXTERNAL_LINKS, {
    client,
    onError: (error) => {
      console.error('Error fetching external links:', error);
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(`${window.location.origin}/logo.png`);
      
      // Close sidebar on mobile when route changes
      setIsOpen(false);
      
      // Handle resize event
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setIsOpen(false);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [pathname]);

  // Generate base navigation items (for all users)
  const baseNavigationItems: NavItem[] = [
    { name: 'Dashboard', href: `/${params.locale}/dashboard`, icon: HomeIcon },
    { 
      name: 'Notifications', 
      href: `/${params.locale}/dashboard/notifications`, 
      icon: BellIcon,
      permissions: ['notifications:read'],
      badge: {
        key: 'unread',
        value: unreadCount
      }
    },
    { 
      name: 'Book now', 
      href: `/${params.locale}/dashboard/bookings`, 
      icon: CalendarIcon,
      disabled: true,
      locked: true
    },
    { name: 'Beneficios', href: `/${params.locale}/dashboard/benefits`, icon: UserIcon },
    { name: 'Help', href: `/${params.locale}/dashboard/help`, icon: HelpCircleIcon },
    { name: 'Settings', href: `/${params.locale}/dashboard/settings`, icon: SettingsIcon },
  ];

  // Admin-specific navigation items
  const adminNavigationItems: NavItem[] = [
    { 
      name: 'Admin Dashboard', 
      href: `/${params.locale}/admin`, 
      icon: BarChartIcon, 
      permissions: ['admin:view']
    },
    { 
      name: 'Create Notifications', 
      href: `/${params.locale}/admin/notifications`, 
      icon: MessageSquareIcon,
      permissions: ['notifications:create']
    },
    {
      name: 'External Links',
      href: `/${params.locale}/admin/external-links`,
      icon: LinkIcon,
      permissions: ['admin:view']
    },
    { 
      name: 'User Management', 
      href: `/${params.locale}/admin/users`, 
      icon: UsersIcon, 
      permissions: ['users:read']
    },
    {
      name: 'Role Management',
      href: `/${params.locale}/admin/roles`,
      icon: ShieldIcon,
      permissions: ['roles:read']
    },
    {
      name: 'CMS',
      href: `/${params.locale}/admin/cms`,
      icon: ClipboardListIcon,
      permissions: ['cms:access'],
      children: [
        {
          name: 'Pages',
          href: `/${params.locale}/admin/cms/pages`,
          icon: LineChartIcon,
          permissions: ['cms:access']
        },
        {
          name: 'Media Library',
          href: `/${params.locale}/admin/cms/media`,
          icon: LinkIcon,
          permissions: ['cms:access']
        },
        {
          name: 'Menus',
          href: `/${params.locale}/admin/cms/menus`,
          icon: MenuIcon,
          permissions: ['cms:access']
        },
        {
          name: 'Settings',
          href: `/${params.locale}/admin/cms/settings`,
          icon: SettingsIcon,
          permissions: ['cms:access']
        }
      ]
    }
  ];

  // Manager-specific navigation items
  const managerNavigationItems: NavItem[] = [
    {
      name: 'Staff Management',
      href: `/${params.locale}/manager/staff`,
      icon: UsersIcon,
      permissions: ['staff:view', 'staff:manage']
    },
    {
      name: 'Team Reports',
      href: `/${params.locale}/manager/reports`,
      icon: LineChartIcon,
      permissions: ['reports:view']
    },
    {
      name: 'Approve Requests',
      href: `/${params.locale}/manager/approvals`,
      icon: ClipboardListIcon,
      permissions: ['approvals:manage']
    }
  ];

  // Convertir los enlaces externos del API a objetos NavItem
  const getIconComponent = (iconName: string): React.ElementType => {
    const icons: { [key: string]: React.ElementType } = {
      HomeIcon,
      UserIcon,
      CalendarIcon,
      SettingsIcon,
      HelpCircleIcon,
      BellIcon,
      LogOutIcon,
      UsersIcon,
      MessageSquareIcon,
      ClipboardListIcon,
      BarChartIcon,
      ShieldIcon,
      UserPlusIcon,
      LineChartIcon,
      LockIcon,
      LinkIcon
    };
    
    return icons[iconName] || UserIcon; // Default to UserIcon if not found
  };

  const externalLinks: NavItem[] = (externalLinksData?.activeExternalLinks || []).map((link: ExternalLinkType) => ({
    name: link.name,
    href: link.url,
    icon: getIconComponent(link.icon),
  })) || [
    {
      name: 'E-Voque Benefits',
      href: 'https://pe.e-voquebenefit.com/',
      icon: UserIcon,
    }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = `/${params.locale}/login`;
  };

  // Render notification badge if there are unread notifications
  const renderBadge = (item: NavItem) => {
    if (item.badge && item.badge.value > 0) {
      return (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {item.badge.value > 99 ? '99+' : item.badge.value}
        </span>
      );
    }
    return null;
  };

  // Render navigation items
  const renderNavigationItems = () => {
    return (
      <>
        {/* Admin items */}
        {isAdmin && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Administración
              </h3>
            </div>
            {adminNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
            
            {/* User section for admins */}
            <div className="mt-4 border-t pt-4">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4" />
                  <span>Usuario</span>
                </div>
                {userMenuOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              
              {userMenuOpen && (
                <div className="pl-4 mt-1 space-y-1">
                  {baseNavigationItems.map(item => (
                    <Link 
                      key={item.href}
                      href={item.disabled ? "#" : item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === item.href 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
                    >
                      {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                      <span>{item.name}</span>
                      {renderBadge(item)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Manager items */}
        {isManager && !isAdmin && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Gestión
              </h3>
            </div>
            {managerNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
            {/* Base items for managers */}
            <div className="mt-4 border-t pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                Dashboard
              </h3>
            </div>
            {baseNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
          </>
        )}
        
        {/* Regular User Items */}
        {!isAdmin && !isManager && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Dashboard
              </h3>
            </div>
            {baseNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 h-screen">
        <div className="flex flex-col bg-white border-r h-screen">
          {/* Sidebar header */}
          <div className="flex items-center border-b px-4">
            <Link href={`/${params.locale}`} className="flex items-center">
              <Image 
                src={logoUrl} 
                alt="E-voque Logo" 
                width={12} 
                height={12} 
                className="h-14 w-16" 
              />
            </Link>
            {isAdmin && (
              <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-md">
                Admin
              </span>
            )}
            {isManager && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                Manager
              </span>
            )}
          </div>

          {isAdmin && (
                <div className="mt-2 p-3">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    Admin Tools
                  </h3>
                  <div className="px-3 py-2 text-sm text-gray-500">
                    <p>You have full administrative access to manage the platform and its users.</p>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 px-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center justify-center gap-2"
                      onClick={() => window.location.href = `/${params.locale}/admin/users`}
                    >
                      <UserPlusIcon className="h-3 w-3" />
                      New User
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center justify-center gap-2"
                      onClick={() => window.location.href = `/${params.locale}/admin/notifications`}
                    >
                      <BellIcon className="h-3 w-3" />
                      Message
                    </Button>
                  </div>
                </div>
              )}
          
          {/* Nav items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-3 space-y-1">
              <div className="border-t pt-3">
                {renderNavigationItems()}
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                  External Links
                </h3>
                {externalLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </a>
                ))}
              </div>
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="" alt="User" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{data?.me?.firstName} {data?.me?.lastName}</span>
                <span className="text-xs text-gray-500">{data?.me?.role?.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                <LogOutIcon className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/50">
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-lg">
            {/* Mobile sidebar header with close button */}
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link href={`/${params.locale}`} className="flex items-center" onClick={() => setIsOpen(false)}>
                <Image 
                  src={logoUrl} 
                  alt="E-voque Logo" 
                  width={24} 
                  height={24} 
                  className="h-12 w-12" 
                />
              </Link>
              {isAdmin && (
                <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-md">
                  Admin
                </span>
              )}
              {isManager && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                  Manager
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile nav items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-3 space-y-1">
                {isAdmin && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      Admin Tools
                    </h3>
                    <div className="grid grid-cols-2 gap-2 px-3 mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                          window.location.href = `/${params.locale}/admin/users`;
                          setIsOpen(false);
                        }}
                      >
                        <UserPlusIcon className="h-3 w-3" />
                        New User
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                          window.location.href = `/${params.locale}/admin/notifications`;
                          setIsOpen(false);
                        }}
                      >
                        <BellIcon className="h-3 w-3" />
                        Message
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    External Links
                  </h3>
                  {externalLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </a>
                  ))}
                </div>
                
                <div className="border-t pt-3">
                  {renderNavigationItems()}
                </div>
              </nav>
            </div>
            
            {/* Mobile sidebar footer */}
            <div className="border-t p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>UN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{data?.me?.firstName} {data?.me?.lastName}</span>
                  <span className="text-xs text-gray-500">{data?.me?.role?.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                  <LogOutIcon className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile menu toggle button */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
} 