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
  MenuIcon
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
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
  const [open, setOpen] = useState(true);

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

  const [logoUrl, setLogoUrl] = useState("/logo.png");
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(`${window.location.origin}/logo.png`);
    }
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen">
        <Sidebar className="border-r">
          <SidebarHeader className="flex h-16 items-center border-b px-6">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image 
                src={logoUrl} 
                alt="E-voque Logo" 
                width={32} 
                height={32} 
                className="h-auto w-auto" 
              />
              <span className="text-lg font-bold">E-Voque</span>
            </Link>
            <div className="ml-auto">
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      pathname === item.href 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <div className="mt-6 px-3">
              <h3 className="mb-2 text-xs font-medium uppercase text-sidebar-foreground/50">
                External Links
              </h3>
              <SidebarMenu>
                {externalLinks.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </SidebarContent>
          
          <SidebarFooter className="border-t p-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="" alt="User" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">User Name</span>
                <span className="text-xs text-sidebar-foreground/60">Interpreter</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" asChild>
                <Link href={`/${locale}/auth/logout`}>
                  <LogOutIcon className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </Link>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        {/* Mobile menu button */}
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={() => setOpen(!open)}
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </SidebarProvider>
  );
} 