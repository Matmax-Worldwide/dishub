'use client';

import React from 'react';
import Link from 'next/link';
// import Image from 'next/image';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/engines/cms/UnsavedChangesAlert';
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DropdownSwitcher, { DropdownItem } from '@/components/sidebar/header/DropdownSwitcher';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { getEngineNavigation } from '@/data/engineNavigation';
import { 
  FileText,
  Calendar,
  Store,
  Scale,
  Users,
  Globe,
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

interface EngineSidebarProps {
  currentEngine: string;
}

export default function EngineSidebar({ currentEngine }: EngineSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const { tenantSlug } = useParams();
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

  // Get navigation data for all engines
  const allEngineNavigation = getEngineNavigation(locale, tenantSlug as string);
  const currentEngineNav = allEngineNavigation[currentEngine];

  if (!currentEngineNav) {
    console.error(`Engine navigation not found for: ${currentEngine}`);
    return null;
  }

  // Build dropdown items for engine switcher based on available features
  const engineDropdownItems: DropdownItem[] = [];

  // Add engines based on feature availability (excluding dashboard and current engine)
  if (hasFeature('CMS_ENGINE') && currentEngine !== 'cms') {
    engineDropdownItems.push({
      href: `/${locale}/${tenantSlug}/cms`,
      icon: <FileText className="h-4 w-4" />,
      label: t('cms.title') || 'CMS'
    });
  }

  if (hasFeature('BOOKING_ENGINE') && currentEngine !== 'bookings') {
    engineDropdownItems.push({
      href: `/${locale}/${tenantSlug}/bookings`,
      icon: <Calendar className="h-4 w-4" />,
      label: t('bookings.title') || 'Bookings'
    });
  }

  if (hasFeature('ECOMMERCE_ENGINE') && currentEngine !== 'commerce') {
    engineDropdownItems.push({
      href: `/${locale}/${tenantSlug}/commerce`,
      icon: <Store className="h-4 w-4" />,
      label: t('commerce.title') || 'ShopiSafe'
    });
  }

  if (hasFeature('LEGAL_ENGINE') && currentEngine !== 'legal') {
    engineDropdownItems.push({
      href: `/${locale}/${tenantSlug}/legal`,
      icon: <Scale className="h-4 w-4" />,
      label: t('legal.engine') || 'Legal'
    });
  }

  if (hasFeature('HRMS_ENGINE') && currentEngine !== 'hrms') {
    engineDropdownItems.push({
      href: `/${locale}/${tenantSlug}/hrms`,
      icon: <Users className="h-4 w-4" />,
      label: t('hrms.title') || 'HRMS'
    });
  }

  if (hasFeature('INTERPRETATION_ENGINE') && currentEngine !== 'interpretation') {
    engineDropdownItems.push({
      href: `/${locale}/${tenantSlug}/interpretation`,
      icon: <Globe className="h-4 w-4" />,
      label: t('interpretation.title') || 'Interpretation'
    });
  }

  // Debug logging
  console.log('=== ENGINE SIDEBAR DEBUG ===');
  console.log('Current engine:', currentEngine);
  console.log('CMS_ENGINE:', hasFeature('CMS_ENGINE'));
  console.log('LEGAL_ENGINE:', hasFeature('LEGAL_ENGINE'));
  console.log('INTERPRETATION_ENGINE:', hasFeature('INTERPRETATION_ENGINE'));
  console.log('Dropdown items count:', engineDropdownItems.length);
  console.log('============================');

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/${tenantSlug}/${currentEngine}`) {
      return pathname === `/${locale}/${tenantSlug}/${currentEngine}` || pathname === `/${locale}/${tenantSlug}/${currentEngine}/`;
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

  const EngineIcon = currentEngineNav.engineIcon;

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
          <SidebarHeader className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center space-x-2 flex-1">
              {/* Dropdown Switcher */}
              <DropdownSwitcher
                buttonContent={{
                  icon: <EngineIcon className="h-4 w-4 text-blue-600" />,
                  label: currentEngineNav.engineName
                }}
                items={engineDropdownItems}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="sidebar" />
              <CollapsibleButton className="sidebar-header-collapse-button" />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {/* Render navigation sections */}
            {currentEngineNav.sections.map((section) => (
              <SidebarGroup 
                key={section.section} 
                title={section.title}
              >
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link 
                      key={item.id} 
                      href={item.href} 
                      className="block"
                      onClick={(e) => handleNavigation(item.href, e)}
                    >
                      <SidebarItem 
                        icon={<IconComponent className="h-4 w-4" />}
                        active={isActiveLink(item.href)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.badgeColor === 'red' 
                                ? 'bg-red-100 text-red-800' 
                                : item.badgeColor === 'green'
                                ? 'bg-green-100 text-green-800'
                                : item.badgeColor === 'yellow'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </SidebarItem>
                    </Link>
                  );
                })}
              </SidebarGroup>
            ))}
          </SidebarContent>
          
          <SidebarFooter className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <Link 
                href={`/${locale}/${tenantSlug}/dashboard`} 
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
                onClick={(e) => handleNavigation(`/${locale}/${tenantSlug}/dashboard`, e)}
              >
                <LogOut className="h-4 w-4" />
                <span className="sidebar-text">
                  {t('common.returnToDashboard') || 'Return to Dashboard'}
                </span>
              </Link>
            </div>
            <div className="flex justify-center mt-3">
              <LanguageSwitcher />
            </div>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </>
  );
} 