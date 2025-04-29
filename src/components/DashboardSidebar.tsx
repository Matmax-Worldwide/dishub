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
  BriefcaseIcon,
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
  LineChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';

// GraphQL queries y mutations
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

const GET_UNREAD_NOTIFICATIONS_COUNT = gql`
  query GetUnreadNotificationsCount {
    unreadNotificationsCount
  }
`;

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: string[];
  badge?: {
    key: string;
    value: number;
  }
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { locale } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  
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

  // Get unread notifications count
  const { data: notificationsData } = useQuery(GET_UNREAD_NOTIFICATIONS_COUNT, {
    client,
    fetchPolicy: 'network-only',
    pollInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = notificationsData?.unreadNotificationsCount || 0;

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

  // Check if user is an admin
  const isAdmin = data?.me?.role === 'ADMIN';
  const isManager = data?.me?.role === 'MANAGER';

  // Generate base navigation items (for all users)
  const baseNavigationItems: NavItem[] = [
    { name: 'Dashboard', href: `/${locale}/dashboard`, icon: HomeIcon },
    { 
      name: 'Notifications', 
      href: `/${locale}/dashboard/notifications`, 
      icon: BellIcon,
      badge: {
        key: 'unread',
        value: unreadCount
      }
    },
    { name: 'Book now', href: `/${locale}/dashboard/bookings`, icon: CalendarIcon },
    { name: 'Beneficios', href: `/${locale}/dashboard/benefits`, icon: UserIcon },
    { name: 'Settings', href: `/${locale}/dashboard/settings`, icon: SettingsIcon },
    { name: 'Help', href: `/${locale}/dashboard/help`, icon: HelpCircleIcon },
  ];

  // Admin-specific navigation items
  const adminNavigationItems: NavItem[] = [
    { 
      name: 'Admin Dashboard', 
      href: `/${locale}/admin`, 
      icon: BarChartIcon, 
      roles: ['ADMIN'] 
    },
    { 
      name: 'User Management', 
      href: `/${locale}/admin/users`, 
      icon: UsersIcon, 
      roles: ['ADMIN'] 
    },
    { 
      name: 'Create Notifications', 
      href: `/${locale}/admin/notifications`, 
      icon: MessageSquareIcon,
      roles: ['ADMIN']
    },

    {
      name: 'Role Management',
      href: `/${locale}/admin/roles`,
      icon: ShieldIcon,
      roles: ['ADMIN']
    }
  ];

  // Manager-specific navigation items
  const managerNavigationItems: NavItem[] = [
    {
      name: 'Staff Management',
      href: `/${locale}/manager/staff`,
      icon: UsersIcon,
      roles: ['MANAGER', 'ADMIN']
    },
    {
      name: 'Team Reports',
      href: `/${locale}/manager/reports`,
      icon: LineChartIcon,
      roles: ['MANAGER', 'ADMIN']
    },
    {
      name: 'Approve Requests',
      href: `/${locale}/manager/approvals`,
      icon: ClipboardListIcon,
      roles: ['MANAGER', 'ADMIN']
    }
  ];

  // Combine navigation items based on user role
  let navigationItems = [...baseNavigationItems];
  
  if (isAdmin) {
    navigationItems = [...baseNavigationItems, ...adminNavigationItems];
  } else if (isManager) {
    navigationItems = [...baseNavigationItems, ...managerNavigationItems];
  }

  const externalLinks: NavItem[] = [
    {
      name: 'E-Voque Benefits',
      href: 'https://pe.e-voquebenefit.com/',
      icon: UserIcon,
    },
    {
      name: 'E-Voque Jobs',
      href: 'https://jobs.e-voque.com/#services-area',
      icon: BriefcaseIcon,
    },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = `/${locale}/login`;
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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 h-screen">
        <div className="flex flex-col bg-white border-r h-screen">
          {/* Sidebar header */}
          <div className="flex items-center border-b px-4">
            <Link href={`/${locale}`} className="flex items-center">
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
          
          {/* Nav items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-3 space-y-1">
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
                {navigationItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      pathname === item.href 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {renderBadge(item)}
                  </Link>
                ))}
              </div>

              {isAdmin && (
                <div className="mt-6 pt-3 border-t">
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
                      onClick={() => window.location.href = `/${locale}/admin/users`}
                    >
                      <UserPlusIcon className="h-3 w-3" />
                      New User
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center justify-center gap-2"
                      onClick={() => window.location.href = `/${locale}/admin/notifications`}
                    >
                      <BellIcon className="h-3 w-3" />
                      Message
                    </Button>
                  </div>
                </div>
              )}
              
              {isManager && (
                <div className="mt-6 pt-3 border-t">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    Manager Tools
                  </h3>
                  <div className="px-3 py-2 text-sm text-gray-500">
                    <p>Manage your team effectively.</p>
                  </div>
                </div>
              )}
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
                <span className="text-xs text-gray-500">{data?.me?.role}</span>
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
              <Link href={`/${locale}`} className="flex items-center" onClick={() => setIsOpen(false)}>
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
                  {navigationItems.map((item) => (
                    <Link 
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === item.href 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {renderBadge(item)}
                    </Link>
                  ))}
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-3 border-t">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      Admin Tools
                    </h3>
                    <div className="px-3 py-2 text-sm text-gray-500">
                      <p>Full administrative access.</p>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2 px-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                          setIsOpen(false);
                          window.location.href = `/${locale}/admin/users`;
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
                          setIsOpen(false);
                          window.location.href = `/${locale}/admin/notifications`;
                        }}
                      >
                        <BellIcon className="h-3 w-3" />
                        Message
                      </Button>
                    </div>
                  </div>
                )}
                
                {isManager && (
                  <div className="mt-6 pt-3 border-t">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      Manager Tools
                    </h3>
                    <div className="px-3 py-2 text-sm text-gray-500">
                      <p>Manage your team effectively.</p>
                    </div>
                  </div>
                )}
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
                  <span className="text-xs text-gray-500">{data?.me?.role}</span>
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