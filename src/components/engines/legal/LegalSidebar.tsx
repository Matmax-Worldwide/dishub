'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/engines/cms/UnsavedChangesAlert';
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { 
  LayoutDashboard,
  Scale,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Briefcase,
  Calendar,
  Clock,
  Building,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
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

export default function LegalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t, locale } = useI18n();
  
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
      name: t('legal.dashboard') || 'Dashboard',
      href: `/${locale}/legal`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: t('legal.incorporations') || 'Incorporations',
      href: `/${locale}/legal/incorporations`,
      icon: <Scale className="h-4 w-4" />
    },
    {
      name: t('legal.clients') || 'Clients',
      href: `/${locale}/legal/clients`,
      icon: <Users className="h-4 w-4" />
    },
    {
      name: t('legal.documents') || 'Documents',
      href: `/${locale}/legal/documents`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: t('legal.calendar') || 'Calendar',
      href: `/${locale}/legal/calendar`,
      icon: <Calendar className="h-4 w-4" />
    },
  ];

  const managementItems = [
    {
      name: t('legal.billing') || 'Billing',
      href: `/${locale}/legal/billing`,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      name: t('legal.timeTracking') || 'Time Tracking',
      href: `/${locale}/legal/billing/time-tracking`,
      icon: <Clock className="h-4 w-4" />
    },
    {
      name: t('legal.reports') || 'Reports',
      href: `/${locale}/legal/reports`,
      icon: <BarChart3 className="h-4 w-4" />
    },
  ];

  const settingsItems = [
    {
      name: t('legal.settings') || 'Settings',
      href: `/${locale}/legal/settings`,
      icon: <Settings className="h-4 w-4" />
    },
    {
      name: t('legal.bookingConfiguration') || 'Booking Configuration',
      href: `/${locale}/legal/booking-config`,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      name: t('legal.jurisdictions') || 'Jurisdictions',
      href: `/${locale}/legal/settings/jurisdictions`,
      icon: <Building className="h-4 w-4" />
    },
    {
      name: t('legal.companyTypes') || 'Company Types',
      href: `/${locale}/legal/settings/company-types`,
      icon: <Briefcase className="h-4 w-4" />
    },
  ];

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/legal`) {
      return pathname === `/${locale}/legal` || pathname === `/${locale}/legal/`;
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
                  alt="Legal Engine" 
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
                  className="flex items-center justify-between w-full text-left px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex items-center">
                    <Scale className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="sidebar-text truncate">
                      {t('legal.engine') || 'Legal'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="py-1">
                      <Link
                        href={`/${locale}/dashboard`}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        {t('nav.dashboard') || 'Dashboard'}
                      </Link>
                      <Link
                        href={`/${locale}/cms`}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t('engines.cms') || 'CMS'}
                      </Link>
                      <Link
                        href={`/${locale}/bookings`}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('engines.booking') || 'Booking'}
                      </Link>
                      <Link
                        href={`/${locale}/commerce`}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        {t('engines.commerce') || 'E-commerce'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <CollapsibleButton className="ml-2" />
          </SidebarHeader>

          <SidebarContent className="flex-1 overflow-y-auto">
            {/* Main Navigation */}
            <SidebarGroup title={t('legal.navigation') || 'Legal Management'}>
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

            {/* Management Items */}
            <SidebarGroup title={t('legal.management') || 'Finance & Reports'}>
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

            {/* Settings */}
            <SidebarGroup title={t('legal.configuration') || 'Configuration'}>
              {settingsItems.map((item) => (
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

          <SidebarFooter className="p-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="sidebar-text">
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => {/* TODO: Implement logout */}}
                className="p-1 text-gray-500 hover:text-gray-700 sidebar-collapse-hide"
                title={t('auth.logout') || 'Logout'}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </>
  );
} 