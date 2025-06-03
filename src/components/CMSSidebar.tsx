'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/engines/cms/UnsavedChangesAlert';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/hooks/useI18n';
import { 
  LayoutDashboard,
  FileText,
  Menu, 
  FormInput, 
  Image as ImageIcon, 
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

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

export default function CMSSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t, locale } = useI18n();
  const { hasFeature } = useFeatureAccess();
  
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

  // Base navigation items - CMS Engine is always available
  const baseNavigationItems = [
    {
      name: t('cms.dashboard') || 'Dashboard',
      href: `/${locale}/cms/`,
      icon: <LayoutDashboard className="h-4 w-4" />,
      feature: 'CMS_ENGINE'
    },
    {
      name: t('cms.pages') || 'Pages',
      href: `/${locale}/cms/pages`,
      icon: <FileText className="h-4 w-4" />,
      feature: 'CMS_ENGINE'
    },
    {
      name: t('cms.menus') || 'Menus',
      href: `/${locale}/cms/menus`,
      icon: <Menu className="h-4 w-4" />,
      feature: 'CMS_ENGINE'
    },
    {
      name: t('cms.media') || 'Media',
      href: `/${locale}/cms/media`,
      icon: <ImageIcon className="h-4 w-4" />,
      feature: 'CMS_ENGINE'
    },
  ];

  // Feature-based navigation items
  const featureNavigationItems = [
    {
      name: t('cms.forms') || 'Forms',
      href: `/${locale}/cms/forms`,
      icon: <FormInput className="h-4 w-4" />,
      feature: 'FORMS_MODULE'
    },
    {
      name: t('cms.blog') || 'Blog',
      href: `/${locale}/cms/blog`,
      icon: <BookOpen className="h-4 w-4" />,
      feature: 'BLOG_MODULE'
    },
  ];

  // Filter navigation items based on tenant features
  const navigationItems = [
    ...baseNavigationItems.filter(item => hasFeature(item.feature)),
    ...featureNavigationItems.filter(item => hasFeature(item.feature))
  ];

  // Dropdown items based on features
  const dropdownItems = [
    ...(hasFeature('BOOKING_ENGINE') ? [{
      name: t('bookings.title') || 'Bookings',
      href: `/${locale}/bookings`,
    }] : []),
    ...(hasFeature('ECOMMERCE_ENGINE') ? [{
      name: t('commerce.title') || 'E-COMMERCE',
      href: `/${locale}/ecommerce`,
    }] : []),
  ];

  const settingsNavItem = {
    name: t('cms.settings') || 'Settings',
    href: `/${locale}/cms/settings`,
    icon: <Settings className="h-4 w-4" />,
    feature: 'CMS_ENGINE'
  };

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/cms/`) {
      return pathname === `/${locale}/cms` || pathname === `/${locale}/cms/`;
    }
    
    // For other links, check if pathname starts with the link path
    // and make sure it's either exact or followed by a / or nothing
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
                <span>CMS</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <CollapsibleButton className="sidebar-header-collapse-button" />
          </div>
        </SidebarHeader>
        
        {/* Button that will be positioned in the middle of the sidebar when collapsed */}
        <div className="sidebar-header-collapse-container">
          <CollapsibleButton />
        </div>
        
        <SidebarContent>
          <SidebarGroup title={t('cms.mainNavigation') || 'Main Navigation'}>
            {navigationItems.map((item) => (
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
          <SidebarGroup title={t('cms.configuration') || 'Configuration'}>
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
            href={`/${locale}/evoque/dashboard`} 
            className="block w-full"
            onClick={(e) => handleNavigation(`/${locale}/evoque/dashboard`, e)}
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