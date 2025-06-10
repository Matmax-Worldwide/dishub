'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/engines/cms/UnsavedChangesAlert';
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DropdownSwitcher, { DropdownItem } from '@/components/sidebar/header/DropdownSwitcher';
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
  LogOut
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
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string || 'admin';
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

  // Dropdown items for engine switcher
  const dropdownItems: DropdownItem[] = [
    {
      href: `/${locale}/${tenantSlug}/dashboard`,
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: t('nav.dashboard') || 'Dashboard'
    },
    {
      href: `/${locale}/${tenantSlug}/cms`,
      icon: <FileText className="h-4 w-4" />,
      label: t('engines.cms') || 'CMS'
    },
    {
      href: `/${locale}/${tenantSlug}/bookings`,
      icon: <Calendar className="h-4 w-4" />,
      label: t('engines.booking') || 'Booking'
    },
    {
      href: `/${locale}/${tenantSlug}/commerce`,
      icon: <Receipt className="h-4 w-4" />,
      label: t('engines.commerce') || 'E-commerce'
    }
  ];

  const mainNavigationItems = [
    {
      name: t('legal.dashboard') || 'Dashboard',
      href: `/${locale}/${tenantSlug}/legal`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: t('legal.incorporations') || 'Incorporations',
      href: `/${locale}/${tenantSlug}/legal/incorporations`,
      icon: <Scale className="h-4 w-4" />
    },
    {
      name: t('legal.clients') || 'Clients',
      href: `/${locale}/${tenantSlug}/legal/clients`,
      icon: <Users className="h-4 w-4" />
    },
    {
      name: t('legal.documents') || 'Documents',
      href: `/${locale}/${tenantSlug}/legal/documents`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: t('legal.calendar') || 'Calendar',
      href: `/${locale}/${tenantSlug}/legal/calendar`,
      icon: <Calendar className="h-4 w-4" />
    },
  ];

  const managementItems = [
    {
      name: t('legal.billing') || 'Billing',
      href: `/${locale}/${tenantSlug}/legal/billing`,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      name: t('legal.timeTracking') || 'Time Tracking',
      href: `/${locale}/${tenantSlug}/legal/billing/time-tracking`,
      icon: <Clock className="h-4 w-4" />
    },
    {
      name: t('legal.reports') || 'Reports',
      href: `/${locale}/${tenantSlug}/legal/reports`,
      icon: <BarChart3 className="h-4 w-4" />
    },
  ];

  const settingsItems = [
    {
      name: t('legal.settings') || 'Settings',
      href: `/${locale}/${tenantSlug}/legal/settings`,
      icon: <Settings className="h-4 w-4" />
    },
    {
      name: t('legal.bookingConfiguration') || 'Booking Configuration',
      href: `/${locale}/${tenantSlug}/legal/booking-config`,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      name: t('legal.jurisdictions') || 'Jurisdictions',
      href: `/${locale}/${tenantSlug}/legal/settings/jurisdictions`,
      icon: <Building className="h-4 w-4" />
    },
    {
      name: t('legal.companyTypes') || 'Company Types',
      href: `/${locale}/${tenantSlug}/legal/settings/company-types`,
      icon: <Briefcase className="h-4 w-4" />
    },
  ];

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/${tenantSlug}/legal`) {
      return pathname === `/${locale}/${tenantSlug}/legal` || pathname === `/${locale}/${tenantSlug}/legal/`;
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
                  src="/nuo_logo_light.webp" 
                  alt="Legal Engine" 
                  fill
                  sizes="32px"
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Dropdown Switcher */}
              <DropdownSwitcher
                buttonContent={{
                  icon: <Scale className="h-4 w-4 text-blue-600" />,
                  label: t('legal.engine') || 'Legal'
                }}
                items={dropdownItems}
              />
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