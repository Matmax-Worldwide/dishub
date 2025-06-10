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
  Building2,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Send,
  Activity,
  AlertTriangle,
  PieChart
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
      label: t('sidebar.dashboard') || 'Dashboard'
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

  // Navigation items structure with i18n
  const navigationItems = [
    {
      section: 'main',
      title: t('legal.legalManagement') || 'Legal Management',
      items: [
        { 
          id: 'dashboard', 
          label: t('legal.dashboard') || 'Management Dashboard', 
          icon: LayoutDashboard, 
          href: `/${locale}/${tenantSlug}/legal`, 
          badge: null,
          badgeColor: undefined
        },
        { 
          id: 'incorporations', 
          label: t('legal.incorporations') || 'All Incorporations', 
          icon: Building2, 
          href: `/${locale}/${tenantSlug}/legal/incorporations`, 
          badge: '24',
          badgeColor: undefined
        },
        { 
          id: 'team', 
          label: t('legal.team') || 'Team Management', 
          icon: Users, 
          href: `/${locale}/${tenantSlug}/legal/team`, 
          badge: '4',
          badgeColor: undefined
        },
        { 
          id: 'delegation', 
          label: t('legal.delegation') || 'Task Delegation', 
          icon: Send, 
          href: `/${locale}/${tenantSlug}/legal/delegation`, 
          badge: null,
          badgeColor: undefined
        },
        { 
          id: 'performance', 
          label: t('legal.performance') || 'Performance', 
          icon: Activity, 
          href: `/${locale}/${tenantSlug}/legal/performance`, 
          badge: null,
          badgeColor: undefined
        },
        { 
          id: 'clients', 
          label: t('legal.clients') || 'Client Overview', 
          icon: Briefcase, 
          href: `/${locale}/${tenantSlug}/legal/clients`, 
          badge: null,
          badgeColor: undefined
        }
      ]
    },
    {
      section: 'monitoring',
      title: t('legal.management') || 'Monitoring & Analytics',
      items: [
        { 
          id: 'alerts', 
          label: t('legal.alerts') || 'Alerts & Blockers', 
          icon: AlertTriangle, 
          href: `/${locale}/${tenantSlug}/legal/alerts`, 
          badge: '3', 
          badgeColor: 'red' 
        },
        { 
          id: 'reports', 
          label: t('legal.reports') || 'Reports', 
          icon: BarChart3, 
          href: `/${locale}/${tenantSlug}/legal/reports`, 
          badge: null,
          badgeColor: undefined
        },
        { 
          id: 'analytics', 
          label: t('legal.analytics') || 'Analytics', 
          icon: PieChart, 
          href: `/${locale}/${tenantSlug}/legal/analytics`, 
          badge: null,
          badgeColor: undefined
        },
        { 
          id: 'calendar', 
          label: t('legal.calendar') || 'Calendar View', 
          icon: Calendar, 
          href: `/${locale}/${tenantSlug}/legal/calendar`, 
          badge: null,
          badgeColor: undefined
        }
      ]
    },
    {
      section: 'administration',
      title: t('legal.configuration') || 'Administration',
      items: [
        { 
          id: 'billing', 
          label: t('legal.billing') || 'Billing & Revenue', 
          icon: DollarSign, 
          href: `/${locale}/${tenantSlug}/legal/billing`, 
          badge: null,
          badgeColor: undefined
        },
        { 
          id: 'settings', 
          label: t('legal.settings') || 'Settings', 
          icon: Settings, 
          href: `/${locale}/${tenantSlug}/legal/settings`, 
          badge: null,
          badgeColor: undefined
        }
      ]
    }
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
            {/* Render navigation sections */}
            {navigationItems.map((section) => (
              <SidebarGroup 
                key={section.section} 
                title={section.title || (section.section === 'main' ? t('legal.legalManagement') || 'Legal Management' : '')}
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