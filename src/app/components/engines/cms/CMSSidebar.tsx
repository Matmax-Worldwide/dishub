'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/app/components/engines/cms/UnsavedChangesAlert';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import { useI18n } from '@/hooks/useI18n';
import { 
  LayoutDashboard,
  FileText,
  Menu,
  Image as ImageIcon, 
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { FeatureType } from '@/hooks/useFeatureAccess';
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
} from '@/app/components/ui/sidebar';

// Custom component for the collapsible button with dynamic icon
function CollapsibleButton({ className = "" }) {
  const { collapsed } = useSidebar();
  
  return (
    <SidebarCollapseButton 
      icon={
        collapsed 
          ? <PanelLeftOpen className="h-4 w-4 sidebar-collapse-icon text-gray-600 hover:text-gray-800" /> 
          : <PanelLeftClose className="h-4 w-4 sidebar-collapse-icon text-gray-600 hover:text-gray-800" />
      }
      className={`${className} hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200`}
    />
  );
}

export default function CMSSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t, locale } = useI18n();
  
  // Use the actual FeatureProvider context instead of hardcoded function
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

  // Base navigation items (always available with CMS_ENGINE)
  const baseNavigationItems = [
    {
      name: t('cms.dashboard') || 'Dashboard',
      href: `/${locale}/cms/`,
      icon: <LayoutDashboard className="h-4 w-4" />,
      feature: 'CMS_ENGINE' as FeatureType
    },
    {
      name: t('cms.pages') || 'Pages',
      href: `/${locale}/cms/pages`,
      icon: <FileText className="h-4 w-4" />,
      feature: 'CMS_ENGINE' as FeatureType
    },
    {
      name: t('cms.menus') || 'Menus',
      href: `/${locale}/cms/menus`,
      icon: <Menu className="h-4 w-4" />,
      feature: 'CMS_ENGINE' as FeatureType
    },
    {
      name: t('cms.media') || 'Media',
      href: `/${locale}/cms/media`,
      icon: <ImageIcon className="h-4 w-4" />,
      feature: 'CMS_ENGINE' as FeatureType
    },
  ];

  // Feature-based navigation items
  const featureNavigationItems = [
    {
      name: t('forms.title') || 'Forms',
      href: `/${locale}/cms/forms`,
      icon: <FileText className="h-4 w-4" />,
      feature: 'FORMS_MODULE' as FeatureType
    },
    {
      name: t('blog.title') || 'Blog',
      href: `/${locale}/cms/blog`,
      icon: <BookOpen className="h-4 w-4" />,
      feature: 'BLOG_MODULE' as FeatureType
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
    feature: 'CMS_ENGINE' as FeatureType
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
      <Sidebar className="flex flex-col h-full relative bg-white border-r border-gray-200">
        <SidebarHeader className="flex items-center justify-between p-4 pb-3 bg-white border-b border-gray-100">
          <div className="flex items-center space-x-3 flex-1">
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
                className="flex items-center justify-between w-full text-lg font-semibold text-gray-800 sidebar-title hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200"
              >
                <span>CMS</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {dropdownItems.length > 0 ? (
                    dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                        <span className="font-medium">{item.name}</span>
                    </Link>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 italic">
                      {t('cms.noAdditionalModules') || 'No additional modules available'}
                    </div>
                  )}
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
        
        <SidebarContent className="bg-white">
          <SidebarGroup title={t('cms.mainNavigation') || 'Main Navigation'} className="px-3 py-4">
            <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="block"
                onClick={(e) => handleNavigation(item.href, e)}
              >
                <SidebarItem 
                    icon={React.cloneElement(item.icon, { 
                      className: `h-4 w-4 ${isActiveLink(item.href) ? 'text-blue-600' : 'text-gray-500'}`
                    })}
                  active={isActiveLink(item.href)}
                    className={`
                      flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActiveLink(item.href) 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                >
                  {item.name}
                </SidebarItem>
              </Link>
            ))}
            </div>
          </SidebarGroup>
          
          <SidebarGroup title={t('cms.configuration') || 'Configuration'} className="px-3 py-4 border-t border-gray-100">
            <div className="space-y-1">
            <Link
              key={settingsNavItem.name}
              href={settingsNavItem.href}
              className="block"
              onClick={(e) => handleNavigation(settingsNavItem.href, e)}
            >
              <SidebarItem
                  icon={React.cloneElement(settingsNavItem.icon, { 
                    className: `h-4 w-4 ${isActiveLink(settingsNavItem.href) ? 'text-blue-600' : 'text-gray-500'}`
                  })}
                active={isActiveLink(settingsNavItem.href)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActiveLink(settingsNavItem.href) 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
              >
                {settingsNavItem.name}
              </SidebarItem>
            </Link>
            </div>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="bg-white border-t border-gray-100 p-3">
          <Link 
            href={`/${locale}/admin/dashboard`} 
            className="block w-full"
            onClick={(e) => handleNavigation(`/${locale}/admin/dashboard`, e)}
          >
            <SidebarItem 
              icon={<LogOut className="h-4 w-4 text-gray-500" />}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
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