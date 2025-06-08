'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LockIcon,
  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { clearTenantCache, clearAllCache } from '@/lib/apollo-cache-utils';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import React from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { 
  getIconComponent, 
  type NavItem 
} from '../dashboardSidebar/sidebarConfig';
import { 
  tenantSidebarConfig,
  filterTenantNavigationByFeatures,
  type TenantNavItem 
} from './tenantSidebarConfig';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

// GraphQL queries
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      firstName
      lastName
      userTenants {
        tenantId
        role
        tenant {
          id
          slug
          name
        }
      }
      role {
        id
        name
        description
      }
    }
  }
`;

const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      id
      slug
      name
      features
    }
  }
`;

const GET_ACTIVE_EXTERNAL_LINKS = gql`
  query GetActiveExternalLinks {
    activeExternalLinks {
      id
      name
      url
      icon
      description
      order
      accessType
      allowedRoles
      allowedUsers
      deniedUsers
      isActive
    }
  }
`;

interface ExternalLinkType {
  id: string;
  name: string;
  url: string;
  icon: string;
  description?: string;
  order: number;
  accessType: string;
  allowedRoles: string[];
  allowedUsers?: string[];
  deniedUsers?: string[];
  isActive?: boolean;
}

export function TenantDashboard() {
  const pathname = usePathname();
  const params = useParams();
  const { t } = useI18n();
  const { features: tenantFeatures } = useFeatureAccess();
  const [isOpen, setIsOpen] = useState(false);
  const { user: authUser } = useAuth();

  // Get tenant slug from params
  const tenantSlug = params.tenantSlug as string;
  
  // Load user profile - removed unnecessary refetch triggers
  const { data } = useQuery(GET_USER_PROFILE, {
    client,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        credentials: 'include',
      }
    },
    onCompleted: (data) => {
      console.log('Profile data loaded:', data?.me);
    },
    onError: (error) => {
      console.log('Profile query error (this is normal during logout):', error.message);
    },
  });

  // Find the current tenant from user's tenant relationships
  const currentUserTenant = useMemo(() => {
    return data?.me?.userTenants?.find(
      (ut: { tenant: { slug: string } }) => ut.tenant.slug === tenantSlug
    );
  }, [data?.me?.userTenants, tenantSlug]);
  
  // Load tenant data - removed unnecessary refetch triggers
  const { data: tenantData } = useQuery(GET_TENANT, {
    client,
    variables: { id: currentUserTenant?.tenantId || '' },
    skip: !currentUserTenant?.tenantId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      console.log('Tenant data loaded:', data?.tenant);
    },
  });

  // Simplified cache clearing - only when tenant slug changes and we have user data
  useEffect(() => {
    if (tenantSlug && data?.me) {
      console.log('Tenant slug changed with user data, clearing tenant cache:', tenantSlug);
      clearTenantCache();
    }
  }, [tenantSlug, data?.me?.id]); // Only depend on user ID, not entire user object

  // Debug logging - reduced frequency
  useEffect(() => {
    if (data?.me || authUser) {
      console.log('=== ROLE DEBUG ===');
      console.log('GraphQL user data:', data?.me);
      console.log('Auth user data:', authUser);
      console.log('Current user tenant:', currentUserTenant);
      console.log('Tenant slug:', tenantSlug);
      console.log('==================');
    }
  }, [data?.me?.id, authUser?.id, currentUserTenant?.tenantId, tenantSlug]); // Only depend on IDs

  // Check user roles
  const isSuperAdmin = data?.me?.role?.name === 'SuperAdmin' || authUser?.role?.name === 'SuperAdmin';
  const isTenantAdmin = currentUserTenant?.role === 'TenantAdmin';
  const isTenantManager = currentUserTenant?.role === 'TenantManager';
  const isEmployee = currentUserTenant?.role === 'Employee';

  // Determine effective role for this tenant
  const effectiveRole = useMemo(() => {
    if (isSuperAdmin) return 'SuperAdmin';
    if (isTenantAdmin) return 'TenantAdmin';
    if (isTenantManager) return 'TenantManager';
    if (isEmployee) return 'Employee';
    return 'User';
  }, [isSuperAdmin, isTenantAdmin, isTenantManager, isEmployee]);

  // Check if user has access to this tenant
  const hasAccessToTenant = useMemo(() => {
    if (!data?.me) return false; // No user data yet
    if (isSuperAdmin) return true; // SuperAdmin has access to all tenants
    return !!currentUserTenant; // Has a relationship with this tenant
  }, [data?.me, isSuperAdmin, currentUserTenant]);

  // Load external links
  const { data: externalLinksData, loading: externalLinksLoading, error: externalLinksError } = useQuery(GET_ACTIVE_EXTERNAL_LINKS, {
    client,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      console.log('External links loaded:', data?.activeExternalLinks);
    },
    onError: (error) => {
      console.error('Error loading external links:', error);
    }
  });

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transform navigation items for tenant context - ONLY ADMINISTRATION
  const transformedTenantNavigationItems: TenantNavItem[] = useMemo(() => {
    const items = tenantSidebarConfig.tenantAdministrationItems(params.locale as string, tenantSlug)
      .map(item => ({
        ...item,
        name: t(item.name),
        children: item.children?.map(child => ({
          ...child,
          name: t(child.name)
        }))
      }));
    
    // Filter items based on tenant features
    const filteredItems = filterTenantNavigationByFeatures(items, tenantFeatures);
    return filteredItems;
  }, [params.locale, t, tenantFeatures, tenantSlug]);

  // Get engine navigation items - ONLY ENGINES
  const engineNavigationItems: TenantNavItem[] = useMemo(() => {
    // Get engines from dedicated tenant engine navigation
    const tenantEngineItems = tenantSidebarConfig.tenantEngineItems(params.locale as string, tenantSlug)
      .map(item => ({
        ...item,
        name: t(item.name),
        children: item.children?.map(child => ({
          ...child,
          name: t(child.name)
        }))
      }));
    
    // Filter items based on tenant features
    const filteredItems = filterTenantNavigationByFeatures(tenantEngineItems, tenantFeatures);
    return filteredItems;
  }, [params.locale, tenantFeatures, t, tenantSlug]);


  // Filter external links based on user role
  const getFilteredExternalLinks = (): NavItem[] => {
    if (externalLinksLoading || externalLinksError || !externalLinksData?.activeExternalLinks) {
      return [];
    }

    try {
      return externalLinksData.activeExternalLinks
        .filter((link: ExternalLinkType) => {
          if (!link || typeof link !== 'object') return false;
          
          // Always show public links
          if (link.accessType === 'PUBLIC') return true;
          
          // For role-based links
          if (link.accessType === 'ROLES' || link.accessType === 'MIXED') {
            const userRoleId = data?.me?.role?.id;
            if (!userRoleId) return false;
            
            const hasRoleAccess = Array.isArray(link.allowedRoles) && link.allowedRoles.includes(userRoleId);
            if (hasRoleAccess) return true;
            if (link.accessType === 'ROLES') return false;
          }
          
          // For user-based links
          if (link.accessType === 'USERS' || link.accessType === 'MIXED') {
            const userId = data?.me?.id;
            return userId && Array.isArray(link.allowedUsers) && link.allowedUsers.includes(userId);
          }
          
          return false;
        })
        .map((link: ExternalLinkType): TenantNavItem => ({
          name: link.name || 'Unnamed Link',
          href: link.url || '#',
          icon: getIconComponent(link.icon || 'LinkIcon'),
          accessType: link.accessType || 'PUBLIC',
          allowedRoles: Array.isArray(link.allowedRoles) ? link.allowedRoles : [],
        }));
    } catch (error) {
      console.error('Error processing external links:', error);
      return [];
    }
  };

  const externalLinks = getFilteredExternalLinks();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      // Clear Apollo Client cache using utility
      await clearAllCache();
      
      // Clear all authentication cookies
      const clearAllAuthCookies = () => {
        const expireDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
        const authCookies = [
          'session-token',
          'auth-token',
          'access-token',
          'refresh-token',
          'user-role',
          'user-id',
          'tenant-id',
          'tenant-slug'
        ];
        
        authCookies.forEach(cookieName => {
          // Multiple deletion attempts to ensure complete removal
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/;`;
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=Strict;`;
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/; Secure;`;
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=Strict; Secure;`;
        });
        
        // Also clear any cookies that might contain user data
        const allCookies = document.cookie.split(';');
        allCookies.forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim();
          if (cookieName.includes('user') || cookieName.includes('auth') || cookieName.includes('session') || cookieName.includes('tenant')) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=/;`;
            document.cookie = `${cookieName}=; expires=${expireDate}; path=/; SameSite=Strict;`;
            document.cookie = `${cookieName}=; expires=${expireDate}; path=/; Secure;`;
          }
        });
        
        console.log('All authentication cookies cleared');
      };
      
      clearAllAuthCookies();
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = `/${params.locale}/login`;
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if cache clearing fails
      window.location.href = `/${params.locale}/login`;
    }
  };

  // Render notification badge
  const renderBadge = (item: TenantNavItem) => {
    if (item.badge && item.badge.value > 0) {
      return (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
          {item.badge.value > 99 ? '99+' : item.badge.value}
        </span>
      );
    }
    return null;
  };

  // Helper function to get tenant display name
  const getTenantDisplayName = (): string => {
    const tenantName = tenantData?.tenant?.name || currentUserTenant?.tenant?.name;
    const tenantSlugDisplay = tenantData?.tenant?.slug || currentUserTenant?.tenant?.slug;
    
    if (!currentUserTenant?.tenantId) {
      return '...'; // Loading state
    }
    
    return tenantName || tenantSlugDisplay || 'T';
  };

  // Helper function to check if a path is active
  const isPathActive = (itemHref: string, currentPath: string): boolean => {
    if (currentPath === itemHref) return true;
    if (currentPath.startsWith(itemHref + '/')) return true;
    
    const pathSegments = currentPath.split('/').filter(Boolean);
    const itemSegments = itemHref.split('/').filter(Boolean);
    
    if (itemSegments.length === 0) return false;
    
    return itemSegments.every((segment, index) => {
      if (index >= pathSegments.length) return false;
      return pathSegments[index] === segment || segment.startsWith('[') && segment.endsWith(']');
    });
  };

  // Helper function to check if any child is active
  const hasActiveChild = (item: TenantNavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => 
      isPathActive(child.href, pathname) || hasActiveChild(child)
    );
  };

  // Component to render navigation items with children support
  const NavigationItem = ({ item, level = 0 }: { item: TenantNavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isPathActive(item.href, pathname);
    const hasActiveChildPath = hasActiveChild(item);
    
    const shouldExpand = hasChildren && (isActive || hasActiveChildPath);
    const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
    const isExpanded = shouldExpand || isManuallyExpanded;
    
    const paddingLeft = level === 0 ? 'px-4' : 'px-6';
    
    return (
      <div key={item.href}>
        {hasChildren ? (
          <button
            onClick={() => setIsManuallyExpanded(!isManuallyExpanded)}
            className={`flex items-center justify-between w-full rounded-lg ${paddingLeft} py-3 text-sm font-medium transition-all duration-200 ${
              isActive || hasActiveChildPath
                ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              {item.locked ? (
                <LockIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <item.icon className={`h-4 w-4 ${isActive || hasActiveChildPath ? 'text-blue-700' : 'text-gray-500'}`} />
              )}
              <span>{item.name}</span>
              {renderBadge(item)}
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <Link 
            href={item.disabled ? "#" : item.href}
            className={`flex items-center gap-3 rounded-lg ${paddingLeft} py-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
          >
            {item.locked ? (
              <LockIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
            )}
            <span>{item.name}</span>
            {renderBadge(item)}
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 ml-2 space-y-1 border-l border-gray-600/30 pl-2">
            {item.children!.map(child => <NavigationItem key={child.href} item={child} level={level + 1} />)}
          </div>
        )}
      </div>
    );
  };

  // Show access denied if user doesn't have access to this tenant (but only after data has loaded)
  if (data?.me && !hasAccessToTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don&apos;t have access to this tenant dashboard.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:inset-y-0 h-screen">
        <div className="flex flex-col bg-white border-r border-gray-200 h-screen">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <Link href={`/${params.locale}/${tenantSlug}/dashboard`} className="flex items-center">
              <h1 
                className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                title={tenantData?.tenant?.name || 'Cargando...'}
              >
                🏢 {getTenantDisplayName()}
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="sidebar" />
              
              {/* Role badge */}
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                effectiveRole === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                effectiveRole === 'TenantAdmin' ? 'bg-purple-100 text-purple-800' :
                effectiveRole === 'TenantManager' ? 'bg-blue-100 text-blue-800' :
                effectiveRole === 'Employee' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {effectiveRole}
              </span>
            </div>
          </div>

          {/* SuperAdmin notice */}
          {isSuperAdmin && (
            <div className="mt-4 p-4 bg-red-50 border-b border-red-100">
              <h3 className="mb-3 text-xs font-semibold uppercase text-red-600 tracking-wider">
                🚀 {t('sidebar.superAdminAccess')}
              </h3>
              <div className="px-3 py-2 text-sm text-red-700 mb-3">
                <p>{t('sidebar.superAdminTenantMessage')}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-200"
                onClick={() => window.location.href = `/${params.locale}/super-admin`}
              >
                <span className="text-sm">🏠 {t('sidebar.backToSuperAdmin')}</span>
              </Button>
            </div>
          )}
          
          {/* Nav items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {/* Tenant Administration */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  🏢 {t('sidebar.tenantAdministration')}
                </h3>
                {transformedTenantNavigationItems.map(item => (
                  <NavigationItem key={item.href} item={item} />
                ))}
              </div>

              {/* Engines Section */}
              {engineNavigationItems.length > 0 && (
                <div className="mb-6 border-t border-gray-200 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase text-blue-600 tracking-wider">
                    ⚙️ {t('sidebar.engines')}
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-700 mb-1 font-medium">{t('sidebar.enginesDescription')}</p>
                    <p className="text-xs text-blue-600">{t('sidebar.enginesSubtext')}</p>
                  </div>
                  {engineNavigationItems.map(item => (
                    <NavigationItem key={item.href} item={item} />
                  ))}
                </div>
              )}

              {/* Reports Section */}
              <div className="mb-6 border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  📊 {t('sidebar.reportsInsights')}
                </h3>
                {tenantSidebarConfig.tenantReportsItems(params.locale as string, tenantSlug)
                  .map(item => ({
                    ...item,
                    name: t(item.name),
                    children: item.children?.map(child => ({
                      ...child,
                      name: t(child.name)
                    }))
                  }))
                  .map(item => (
                    <NavigationItem key={item.href} item={item} />
                  ))
                }
              </div>
              {/* External Links */}
              <div className="mb-6 border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  🔗 {t('sidebar.externalLinksTitle')}
                </h3>
                {externalLinksLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-600 rounded-full border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                ) : externalLinksError ? (
                  <div className="px-4 py-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                    Error loading external links: {externalLinksError.message}
                  </div>
                ) : externalLinks.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                    {t('sidebar.noExternalLinks')}
                  </div>
                ) : (
                  externalLinks.map((item: TenantNavItem) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <item.icon className="h-4 w-4 text-gray-500" />
                      <span>{item.name}</span>
                    </a>
                  ))
                )}
              </div>
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="border border-gray-200">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gray-100 text-gray-700">
                  {data?.me?.firstName?.[0]}{data?.me?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-gray-900">{data?.me?.firstName} {data?.me?.lastName}</span>
                <span className="text-xs text-gray-600">{effectiveRole}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
                onClick={() => handleLogout()}
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="sr-only">{t('sidebar.logout')}</span>
              </Button>
            </div>
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/80">
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl flex flex-col border-r border-gray-200">
            {/* Mobile sidebar header */}
            <div className="flex items-center justify-between h-16 px-4 border-b shrink-0">
              <Link href={`/${params.locale}/${tenantSlug}/dashboard`} className="flex items-center" onClick={() => setIsOpen(false)}>
                <h1 
                  className="text-lg font-bold text-gray-800 hover:text-indigo-600 transition-colors"
                  title={tenantData?.tenant?.name || 'Cargando...'}
                >
                  🏢 {getTenantDisplayName()}
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                <LanguageSwitcher variant="sidebar" />
                
                <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                  effectiveRole === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                  effectiveRole === 'TenantAdmin' ? 'bg-purple-100 text-purple-800' :
                  effectiveRole === 'TenantManager' ? 'bg-blue-100 text-blue-800' :
                  effectiveRole === 'Employee' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {effectiveRole}
                </span>
                
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Mobile nav items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-3 space-y-1">
                {isSuperAdmin && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg">
                    <h3 className="mb-2 text-xs font-medium uppercase text-red-600">
                      🚀 {t('sidebar.superAdminAccess')}
                    </h3>
                    <p className="text-sm text-red-700 mb-3">{t('sidebar.superAdminTenantMessage')}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-200"
                      onClick={() => {
                        window.location.href = `/${params.locale}/super-admin`;
                        setIsOpen(false);
                      }}
                    >
                      <span className="text-sm">🏠 {t('sidebar.backToSuperAdmin')}</span>
                    </Button>
                  </div>
                )}
                
                {/* Tenant Administration */}
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    🏢 {t('sidebar.tenantAdministration')}
                  </h3>
                  {transformedTenantNavigationItems.map((item) => (
                    <NavigationItem key={item.href} item={item} />
                  ))}
                </div>

                {/* Engines Section */}
                {engineNavigationItems.length > 0 && (
                  <div className="mb-4 border-t border-gray-200 pt-3">
                    <h3 className="mb-2 text-xs font-medium uppercase text-blue-500">
                      ⚙️ {t('sidebar.engines')}
                    </h3>
                    <div className="bg-blue-50 rounded-md p-2 mb-3">
                      <p className="text-xs text-blue-700 mb-1 font-medium">{t('sidebar.enginesDescription')}</p>
                      <p className="text-xs text-blue-600">{t('sidebar.enginesSubtext')}</p>
                    </div>
                    {engineNavigationItems.map((item) => (
                      <NavigationItem key={item.href} item={item} />
                    ))}
                  </div>
                )}

                {/* Reports Section */}
                <div className="mb-4 border-t border-gray-200 pt-3">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    📊 {t('sidebar.reportsInsights')}
                  </h3>
                  {tenantSidebarConfig.tenantReportsItems(params.locale as string, tenantSlug)
                    .map(item => ({
                      ...item,
                      name: t(item.name),
                      children: item.children?.map(child => ({
                        ...child,
                        name: t(child.name)
                      }))
                    }))
                    .map(item => (
                      <NavigationItem key={item.href} item={item} />
                    ))
                  }
                </div>
                
                {/* External Links */}
                <div className="mb-6 border-t border-gray-200 pt-3">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    🔗 {t('sidebar.externalLinksTitle')}
                  </h3>
                  {externalLinksLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : externalLinksError ? (
                    <div className="px-3 py-2 text-sm text-red-500">
                      Error loading external links: {externalLinksError.message}
                    </div>
                  ) : externalLinks.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {t('sidebar.noExternalLinks')}
                    </div>
                  ) : (
                    externalLinks.map((item: TenantNavItem) => (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </a>
                    ))
                  )}
                </div>
              </nav>
            </div>
            
            {/* Mobile sidebar footer */}
            <div className="border-t p-3 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>
                    {data?.me?.firstName?.[0]}{data?.me?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{data?.me?.firstName} {data?.me?.lastName}</span>
                  <span className="text-xs text-gray-500">{effectiveRole}</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => handleLogout()}>
                  <LogOutIcon className="h-4 w-4" />
                  <span className="sr-only">{t('sidebar.logout')}</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile menu toggle button */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
} 