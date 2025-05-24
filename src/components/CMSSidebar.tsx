'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/cms/UnsavedChangesAlert';
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
  BookOpen
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

interface CMSSidebarProps {
  dictionary?: {
    cms?: {
      dashboard: string;
      pages: string;
      menus: string;
      forms: string;
      media: string;
      settings: string;
      blog: string;
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

export default function CMSSidebar({ dictionary, locale }: CMSSidebarProps) {
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
  const nav = dictionary?.cms || {
    dashboard: 'Dashboard',
    pages: 'Pages',
    menus: 'Menus',
    forms: 'Forms',
    media: 'Media',
    settings: 'Settings',
    blog: 'Blog'
  };

  const navigationItems = [
    { 
      name: nav.dashboard, 
      href: `/${locale}/cms/`, 
      icon: <LayoutDashboard className="h-4 w-4" /> 
    },
    { 
      name: nav.pages, 
      href: `/${locale}/cms/pages`, 
      icon: <FileText className="h-4 w-4" /> 
    },
    { 
      name: nav.menus, 
      href: `/${locale}/cms/menus`, 
      icon: <Menu className="h-4 w-4" /> 
    },
    { 
      name: nav.forms, 
      href: `/${locale}/cms/forms`, 
      icon: <FormInput className="h-4 w-4" /> 
    },
    { 
      name: nav.blog, 
      href: `/${locale}/cms/blog`, 
      icon: <BookOpen className="h-4 w-4" /> 
    },
    { 
      name: nav.media, 
      href: `/${locale}/cms/media`, 
      icon: <ImageIcon className="h-4 w-4" /> 
    },
    { 
      name: nav.settings, 
      href: `/${locale}/cms/settings`, 
      icon: <Settings className="h-4 w-4" /> 
    },
  ];

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
          <Link href={`/${locale}/cms`} className="flex items-center">
            <div className="relative h-8 w-8 mr-2">
              <Image 
                src="/images/logo.png" 
                alt="E-Voque CMS" 
                fill
                sizes="32px"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span className="text-lg font-semibold text-foreground sidebar-title">CMS</span>
          </Link>
          <div className="flex items-center">
            <CollapsibleButton className="sidebar-header-collapse-button" />
          </div>
        </SidebarHeader>
        
        {/* Button that will be positioned in the middle of the sidebar when collapsed */}
        <div className="sidebar-header-collapse-container">
          <CollapsibleButton />
        </div>
        
        <SidebarContent>
          <SidebarGroup title="Main Navigation">
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