'use client';

import { useEffect, useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  SettingsIcon,
  HelpCircleIcon,
  BriefcaseIcon,
  BarChartIcon,
  BellIcon,
  ClipboardListIcon,
  LogOutIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { locale } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  
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

  // Generate navigation items
  const navigationItems: NavItem[] = [
    { name: 'Dashboard', href: `/${locale}/dashboard`, icon: HomeIcon },
    { name: 'Profile', href: `/${locale}/dashboard/profile`, icon: UserIcon },
    { name: 'Tasks', href: `/${locale}/dashboard/tasks`, icon: ClipboardListIcon },
    { name: 'Schedule', href: `/${locale}/dashboard/schedule`, icon: CalendarIcon },
    { name: 'Time Tracking', href: `/${locale}/dashboard/time`, icon: ClockIcon },
    { name: 'Documents', href: `/${locale}/dashboard/documents`, icon: FileTextIcon },
    { name: 'Performance', href: `/${locale}/dashboard/performance`, icon: BarChartIcon },
    { name: 'Notifications', href: `/${locale}/dashboard/notifications`, icon: BellIcon },
    { name: 'Settings', href: `/${locale}/dashboard/settings`, icon: SettingsIcon },
    { name: 'Help', href: `/${locale}/dashboard/help`, icon: HelpCircleIcon },
  ];

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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col bg-white border-r">
          {/* Sidebar header */}
          <div className="flex items-center border-b px-4">
            <Link href={`/${locale}`} className="flex items-center">
              <Image 
                src={logoUrl} 
                alt="E-voque Logo" 
                width={12} 
                height={12} 
                className="" 
              />
            </Link>
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
                  </Link>
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
                <span className="text-sm font-medium">User Name</span>
                <span className="text-xs text-gray-500">Interpreter</span>
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
                    </Link>
                  ))}
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
                  <span className="text-sm font-medium">User Name</span>
                  <span className="text-xs text-gray-500">Interpreter</span>
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