'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/engines/cms/UnsavedChangesAlert';
import DropdownSwitcher from '@/components/sidebar/header/DropdownSwitcher';
import { 
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  Tags,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Percent,
  Star,
  DollarSign,
  Receipt,
  Globe,
  Warehouse,
  FileText,
  Calendar,
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

interface CommerceSidebarProps {
  dictionary?: {
    commerce?: {
      dashboard: string;
      shops: string;
      products: string;
      orders: string;
      customers: string;
      inventory: string;
      categories: string;
      pricing: string;
      currencies: string;
      taxes: string;
      shipping: string;
      payments: string;
      discounts: string;
      reviews: string;
      analytics: string;
      settings: string;
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

export default function CommerceSidebar({ dictionary, locale }: CommerceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
  
  // Default navigation items if dictionary is not provided
  const nav = dictionary?.commerce || {
    dashboard: 'Dashboard',
    shops: 'Shops',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    inventory: 'Inventory',
    categories: 'Categories',
    pricing: 'Pricing',
    currencies: 'Currencies',
    taxes: 'Taxes',
    shipping: 'Shipping',
    payments: 'Payments',
    discounts: 'Discounts',
    reviews: 'Reviews',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const mainNavigationItems = [
    {
      name: nav.dashboard,
      href: `/${locale}/${tenantSlug}/commerce`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: nav.shops,
      href: `/${locale}/${tenantSlug}/commerce/shops`,
      icon: <Store className="h-4 w-4" />
    },
    {
      name: nav.orders,
      href: `/${locale}/${tenantSlug}/commerce/orders`,
      icon: <ShoppingCart className="h-4 w-4" />
    },
    {
      name: nav.customers,
      href: `/${locale}/${tenantSlug}/commerce/customers`,
      icon: <Users className="h-4 w-4" />
    },
  ];

  const catalogItems = [
    {
      name: nav.products,
      href: `/${locale}/${tenantSlug}/commerce/products`,
      icon: <Package className="h-4 w-4" />
    },
    {
      name: nav.categories,
      href: `/${locale}/${tenantSlug}/commerce/categories`,
      icon: <Tags className="h-4 w-4" />
    },
    {
      name: nav.inventory,
      href: `/${locale}/${tenantSlug}/commerce/inventory`,
      icon: <Warehouse className="h-4 w-4" />
    },
  ];

  const pricingItems = [
    {
      name: nav.pricing,
      href: `/${locale}/${tenantSlug}/commerce/pricing`,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      name: nav.currencies,
      href: `/${locale}/${tenantSlug}/commerce/currencies`,
      icon: <Globe className="h-4 w-4" />
    },
    {
      name: nav.taxes,
      href: `/${locale}/${tenantSlug}/commerce/taxes`,
      icon: <Receipt className="h-4 w-4" />
    },
    {
      name: nav.discounts,
      href: `/${locale}/${tenantSlug}/commerce/discounts`,
      icon: <Percent className="h-4 w-4" />
    },
  ];

  const operationsItems = [
    {
      name: nav.shipping,
      href: `/${locale}/${tenantSlug}/commerce/shipping`,
      icon: <Truck className="h-4 w-4" />
    },
    {
      name: nav.payments,
      href: `/${locale}/${tenantSlug}/commerce/payments`,
      icon: <CreditCard className="h-4 w-4" />
    },
    {
      name: nav.reviews,
      href: `/${locale}/${tenantSlug}/commerce/reviews`,
      icon: <Star className="h-4 w-4" />
    },
  ];

  const analyticsItems = [
    {
      name: nav.analytics,
      href: `/${locale}/${tenantSlug}/commerce/analytics`,
      icon: <BarChart3 className="h-4 w-4" />
    },
  ];

  const settingsNavItem = {
    name: nav.settings,
    href: `/${locale}/${tenantSlug}/commerce/settings`,
    icon: <Settings className="h-4 w-4" />
  };

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/${tenantSlug}/commerce`) {
      return pathname === `/${locale}/${tenantSlug}/commerce` || pathname === `/${locale}/${tenantSlug}/commerce/`;
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
                <DropdownSwitcher
                  buttonContent={{
                    icon: <Store className="h-4 w-4 text-blue-600" />,
                    label: 'E-COMMERCE'
                  }}
                  items={[
                    {
                      href: `/${locale}/${tenantSlug}/dashboard`,
                      icon: <LayoutDashboard className="h-4 w-4" />,
                      label: 'Dashboard'
                    },
                    {
                      href: `/${locale}/${tenantSlug}/cms`,
                      icon: <FileText className="h-4 w-4" />,
                      label: 'CMS'
                    },
                    {
                      href: `/${locale}/${tenantSlug}/bookings`,
                      icon: <Calendar className="h-4 w-4" />,
                      label: 'Bookings'
                    },
                    {
                      href: `/${locale}/${tenantSlug}/legal`,
                      icon: <BookOpen className="h-4 w-4" />,
                      label: 'Legal'
                    }
                  ]}
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <CollapsibleButton className="sidebar-header-collapse-button" />
            </div>
          </SidebarHeader>
          
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
            
            <SidebarGroup title="Catalog Management">
              {catalogItems.map((item) => (
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
            
            <SidebarGroup title="Pricing & Finance">
              {pricingItems.map((item) => (
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
            
            <SidebarGroup title="Operations">
              {operationsItems.map((item) => (
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
              href={`/${locale}/${tenantSlug}/dashboard`} 
              className="block w-full"
              onClick={(e) => handleNavigation(`/${locale}/${tenantSlug}/dashboard`, e)}
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