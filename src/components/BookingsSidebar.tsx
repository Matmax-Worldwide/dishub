'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/cms/UnsavedChangesAlert';
import { 
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  UserCheck,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Clock,
  BarChart3,
  CreditCard
} from 'lucide-react';

import {
  Sidebar, 
  SidebarProvider, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarCollapseButton,
  useSidebar
} from '@/components/ui/sidebar';

interface BookingsSidebarProps {
  dictionary?: {
    bookings?: {
      dashboard: string;
      calendar: string;
      bookings: string;
      locations: string;
      services: string;
      staff: string;
      categories: string;
      rules: string;
      reports: string;
      settings: string;
      payments: string;
    };
  };
  locale: string;
}

// Custom component for the collapsible button with dynamic icon
function CollapsibleButton({ className = "" }) {
  const { collapsed } = useSidebar();
  
  return (
    <SidebarCollapseButton 
      icon={
        collapsed 
          ? <PanelLeftOpen className="h-4 w-4 sidebar-collapse-icon" /> 
          : <PanelLeftClose className="h-4 w-4 sidebar-collapse-icon" />
      }
      className={className}
    />
  );
}

export default function BookingsSidebar({ dictionary, locale }: BookingsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Unsaved changes context
  const {
    hasUnsavedChanges,
    onSave,
    isSaving,
    setIsSaving,
    pendingNavigation,
    setPendingNavigation,
    showUnsavedAlert,
    setShowUnsavedAlert,
  } = useUnsavedChanges();
  
  // Default navigation items if dictionary is not provided
  const nav = dictionary?.bookings || {
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    bookings: 'Bookings',
    locations: 'Locations',
    services: 'Services',
    staff: 'Staff',
    categories: 'Categories',
    rules: 'Rules',
    reports: 'Reports',
    settings: 'Settings',
    payments: 'Payments',
  };

  const mainNavigationItems = [
    {
      name: nav.dashboard,
      href: `/${locale}/bookings`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: nav.calendar,
      href: `/${locale}/bookings/calendar`,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      name: nav.bookings,
      href: `/${locale}/bookings/list`,
      icon: <BookOpen className="h-4 w-4" />
    },
  ];

  const managementItems = [
    {
      name: nav.locations,
      href: `/${locale}/bookings/locations`,
      icon: <MapPin className="h-4 w-4" />
    },
    {
      name: nav.services,
      href: `/${locale}/bookings/services`,
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      name: nav.staff,
      href: `/${locale}/bookings/staff`,
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      name: nav.categories,
      href: `/${locale}/bookings/categories`,
      icon: <Users className="h-4 w-4" />
    },
    {
      name: nav.rules,
      href: `/${locale}/bookings/rules`,
      icon: <Clock className="h-4 w-4" />
    },
  ];

  const analyticsItems = [
    {
      name: nav.reports,
      href: `/${locale}/bookings/reports`,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      name: nav.payments,
      href: `/${locale}/bookings/payments`,
      icon: <CreditCard className="h-4 w-4" />
    },
  ];
  
  const settingsNavItem = {
    name: nav.settings,
    href: `/${locale}/bookings/settings`,
    icon: <Settings className="h-4 w-4" />
  };

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/bookings`) {
      return pathname === `/${locale}/bookings` || pathname === `/${locale}/bookings/`;
    }
    
    // For other links, check if pathname starts with the link path
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Handle navigation with unsaved changes check
  const handleNavigation = (href: string, e: React.MouseEvent) => {
    // Check if we have unsaved changes and we're navigating away from current page
    if (hasUnsavedChanges && pathname !== href) {
      e.preventDefault();
      setPendingNavigation(href);
      setShowUnsavedAlert(true);
      return;
    }
  };

  // Handle unsaved changes alert actions
  const handleSaveAndContinue = async (): Promise<boolean> => {
    if (!onSave) return false;
    
    setIsSaving(true);
    try {
      const success = await onSave();
      if (success && pendingNavigation) {
        setShowUnsavedAlert(false);
        router.push(pendingNavigation);
        setPendingNavigation(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (pendingNavigation) {
      setShowUnsavedAlert(false);
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedAlert(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <UnsavedChangesAlert
        isVisible={showUnsavedAlert}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
        isSaving={isSaving}
      />
      <SidebarProvider defaultCollapsed={false}>
        <Sidebar className="flex flex-col h-full relative">
          <SidebarHeader className="flex items-center justify-between p-3 pb-2">
            <div className="flex items-center space-x-2">
              <Link href={`/${locale}/bookings`} className="flex items-center">
                <div className="relative h-8 w-8 mr-2">
                  <Image 
                    src="/images/logo.png" 
                    alt="E-Voque Bookings" 
                    fill
                    sizes="32px"
                    priority
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <span className="text-lg font-semibold text-foreground sidebar-title">Bookings</span>
              </Link>
              
              {/* Switch to CMS button */}
              <Link 
                href={`/${locale}/cms`}
                className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                title="Switch to CMS"
              >
                CMS
              </Link>
            </div>
            
            <div className="flex items-center">
              <CollapsibleButton className="sidebar-header-collapse-button" />
            </div>
          </SidebarHeader>
          
          {/* Button that will be positioned in the middle of the sidebar when collapsed */}
          <div className="sidebar-header-collapse-container">
            <CollapsibleButton />
          </div>
          
          <SidebarContent>
            <SidebarGroup title="Main">
              {mainNavigationItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className="block"
                  onClick={(e) => handleNavigation(item.href, e)}
                >
                  <SidebarItem 
                    icon={item.icon}
                    active={isActiveLink(item.href)}
                  >
                    {item.name}
                  </SidebarItem>
                </Link>
              ))}
            </SidebarGroup>
            
            <SidebarGroup title="Management">
              {managementItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block"
                  onClick={(e) => handleNavigation(item.href, e)}
                >
                  <SidebarItem
                    icon={item.icon}
                    active={isActiveLink(item.href)}
                  >
                    {item.name}
                  </SidebarItem>
                </Link>
              ))}
            </SidebarGroup>
            
            <SidebarGroup title="Analytics">
              {analyticsItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block"
                  onClick={(e) => handleNavigation(item.href, e)}
                >
                  <SidebarItem
                    icon={item.icon}
                    active={isActiveLink(item.href)}
                  >
                    {item.name}
                  </SidebarItem>
                </Link>
              ))}
            </SidebarGroup>
            
            <SidebarGroup title="Configuration">
              <Link
                key={settingsNavItem.name}
                href={settingsNavItem.href}
                className="block"
                onClick={(e) => handleNavigation(settingsNavItem.href, e)}
              >
                <SidebarItem
                  icon={settingsNavItem.icon}
                  active={isActiveLink(settingsNavItem.href)}
                >
                  {settingsNavItem.name}
                </SidebarItem>
              </Link>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <Link 
              href={`/${locale}/dashboard`} 
              className="block w-full"
              onClick={(e) => handleNavigation(`/${locale}/dashboard`, e)}
            >
              <SidebarItem 
                icon={<LogOut className="h-4 w-4" />}
                className="text-muted-foreground hover:text-foreground"
              >
                Return to Dashboard
              </SidebarItem>
            </Link>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </>
  );
} 