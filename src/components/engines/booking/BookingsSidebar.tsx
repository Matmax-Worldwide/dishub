'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/engines/cms/UnsavedChangesAlert';
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { 
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  UserCheck,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Clock,
  ChevronDown
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

export default function BookingsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t, locale } = useI18n();
  const { tenantSlug } = useParams();
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

  const mainNavigationItems = [
    {
      name: t('bookings.dashboard') || 'Dashboard',
      href: `/${locale}/${tenantSlug}/bookings`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: t('bookings.calendar') || 'Calendar',
      href: `/${locale}/${tenantSlug}/bookings/calendar`,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      name: t('bookings.bookings') || 'Bookings',
      href: `/${locale}/${tenantSlug}/bookings/list`,
      icon: <BookOpen className="h-4 w-4" />
    },
  ];

  const managementItems = [
    {
      name: t('bookings.services') || 'Services',
      href: `/${locale}/${tenantSlug}/bookings/services`,
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      name: t('bookings.categories') || 'Categories',
      href: `/${locale}/${tenantSlug}/bookings/categories`,
      icon: <Users className="h-4 w-4" />
    },
    {
      name: t('bookings.locations') || 'Locations',
      href: `/${locale}/${tenantSlug}/bookings/locations`,
      icon: <MapPin className="h-4 w-4" />
    },
    {
      name: t('bookings.staff') || 'Staff',
      href: `/${locale}/${tenantSlug}/bookings/staff`,
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      name: t('bookings.rules') || 'Rules',
      href: `/${locale}/${tenantSlug}/bookings/rules`,
      icon: <Clock className="h-4 w-4" />
    },
  ];

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/${tenantSlug}/bookings`) {
      return pathname === `/${locale}/${tenantSlug}/bookings` || pathname === `/${locale}/${tenantSlug}/bookings/`;
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
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative h-8 w-8 mr-2">
                <Image 
                  src="/images/logo.png" 
                  alt="E-Voque" 
                  fill
                  sizes="32px"
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Dropdown Switcher */}
              <div className="relative flex-1">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-full text-lg font-semibold text-foreground sidebar-title hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
                >
                  <span>{t('bookings.title') || 'Bookings'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <Link
                      href={`/${locale}/${tenantSlug}/cms`}
                      className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>{t('cms.title') || 'CMS'}</span>
                    </Link>
                    <Link
                      href={`/${locale}/${tenantSlug}/commerce`}
                      className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>{t('commerce.title') || 'E-COMMERCE'}</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              <CollapsibleButton className="sidebar-header-collapse-button" />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup title={t('bookings.main') || 'Main'}>
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
            
            <SidebarGroup title={t('bookings.management') || 'Management'}>
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
          </SidebarContent>
          
          <SidebarFooter>
            <Link 
              href={`/${locale}/${tenantSlug}/dashboard`} 
              className="block w-full"
              onClick={(e) => handleNavigation(`/${locale}/${tenantSlug}/dashboard`, e)}
            >
              <SidebarItem 
                icon={<LogOut className="h-4 w-4" />}
                className="text-muted-foreground hover:text-foreground"
              >
                {t('common.returnToDashboard') || 'Return to Dashboard'}
              </SidebarItem>
            </Link>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </>
  );
} 