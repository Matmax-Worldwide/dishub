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
  UserIcon,
  LockIcon,
  BellIcon,
  MessageSquareIcon,
  } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import React from 'react';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import { 
  sidebarConfig, 
  getIconComponent, 
  filterNavigationByFeatures,
  type NavItem 
} from './sidebarConfig';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

// GraphQL queries y mutations
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
    }
  }
`;

const GET_UNREAD_NOTIFICATIONS_COUNT = gql`
  query GetUnreadNotificationsCount {
    unreadNotificationsCount
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { t } = useI18n();
  const { features: tenantFeatures } = useFeatureAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user: authUser } = useAuth();

  
  // Cargar datos del perfil
  const { data } = useQuery(GET_USER_PROFILE, {
    client,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    context: {
      headers: {
        // This ensures the authorization header is added correctly
        credentials: 'include',
      }
    },
    onCompleted: (data) => {
      console.log('Profile data loaded:', data?.me);
    },
  });

  // Get first tenant from user's tenant relationships
  const firstTenant = data?.me?.userTenants?.[0]?.tenant;
  const firstTenantId = data?.me?.userTenants?.[0]?.tenantId;
  
  // Cargar datos del tenant
  const { data: tenantData } = useQuery(GET_TENANT, {
    client,
    variables: { id: firstTenantId },
    skip: !firstTenantId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      console.log('Tenant data loaded:', data?.tenant);
    },
  });

  // Check if user is a super admin (full administrative access)
  const isSuperAdmin = data?.me?.role?.name === 'SuperAdmin' || authUser?.role?.name === 'SuperAdmin';
  const isAdmin = data?.me?.role?.name === 'ADMIN' || authUser?.role?.name === 'ADMIN';
  const isManager = data?.me?.role?.name === 'MANAGER' || authUser?.role?.name === 'MANAGER';



  // Determinar el rol efectivo para mostrar
  const effectiveRole = useMemo(() => {
    const actualRole = data?.me?.role?.name;
    console.log('Actual role:', actualRole);
    console.log(`Using actual user role: ${actualRole}`);
    return actualRole;
  }, [data?.me?.role?.name]);
  
  // Derived states based on effective role
  const showAsAdmin = effectiveRole === 'Admin' || effectiveRole === 'SuperAdmin';
  const showAsTenantAdmin = effectiveRole === 'TenantAdmin';
  const showAsManager = effectiveRole === 'TenantManager' || (!showAsAdmin && !showAsTenantAdmin && isManager);
  const showAsUser = effectiveRole === 'User';
  const showAsEmployee = effectiveRole === 'Employee';
  const shouldShowRegularUserView = !showAsAdmin && !showAsTenantAdmin && !showAsManager && !showAsUser && !showAsEmployee;

  // Detect if we're in tenant dashboard context
  const isInTenantDashboard = useMemo(() => {
    return pathname.includes('/') && pathname.includes('/dashboard');
  }, [pathname]);

  // Get tenant slug from params
  const tenantSlug = useMemo(() => {
    if (params.tenantSlug) {
      return params.tenantSlug as string;
    }
    // Fallback: extract from pathname if available
    const match = pathname.match(/\/([^\/]+)/);
    return match ? match[1] : null;
  }, [params.tenantSlug, pathname]);

  // Function to transform URLs for tenant dashboard context
  const transformUrlForTenantDashboard = (url: string): string => {
    if (!isInTenantDashboard || !tenantSlug) {
      return url;
    }

    // Transform admin routes to tenant dashboard routes
    if (url.includes('/admin/')) {
      return url.replace('/admin/', `/${tenantSlug}/`);
    }

    // Transform CMS routes to tenant dashboard routes (legacy)
    if (url.includes('/cms/')) {
      return url.replace('/cms/', `/${tenantSlug}/cms/`);
    }

    return url;
  };

  // Function to transform navigation items for tenant dashboard context
  const transformNavItemsForTenantDashboard = (items: NavItem[]): NavItem[] => {
    if (!isInTenantDashboard || !tenantSlug) {
      return items;
    }

    return items.map(item => ({
      ...item,
      href: transformUrlForTenantDashboard(item.href),
      children: item.children ? transformNavItemsForTenantDashboard(item.children) : undefined
    }));
  };

  // Cargar los datos de notificaciones no leídas
  const { data: notificationsData } = useQuery(GET_UNREAD_NOTIFICATIONS_COUNT, {
    client,
    fetchPolicy: 'cache-and-network',
  });

  // Actualizar el contador de notificaciones no leídas
  useEffect(() => {
    if (notificationsData?.unreadNotificationsCount) {
      setUnreadCount(notificationsData.unreadNotificationsCount);
    }
  }, [notificationsData]);

  // Cargar enlaces externos
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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Transform navigation items for admin/tenant admin
  const transformedBaseNavigationItems: NavItem[] = useMemo(() => {
    // Get tenant slug from multiple sources
    const currentTenantSlug = firstTenant?.slug || tenantData?.tenant?.slug || tenantSlug;
    
    const items = sidebarConfig.baseNavigationItems(params.locale as string).map(item => ({
      ...item,
      name: t(item.name),
      children: item.children?.map(child => ({
        ...child,
        name: t(child.name)
      }))
    }));
    
    // For TenantAdmin users, transform base navigation to use the manage path
    if (showAsTenantAdmin && currentTenantSlug) {
      return items.map(item => ({
        ...item,
        href: item.href.replace(`/${params.locale}/admin`, `/${params.locale}/${currentTenantSlug}`),
        children: item.children?.map(child => ({
          ...child,
          href: child.href.replace(`/${params.locale}/admin`, `/${params.locale}/${currentTenantSlug}`)
        }))
      }));
    }
    
    return transformNavItemsForTenantDashboard(items);
  }, [params.locale, t, isInTenantDashboard, tenantSlug, showAsTenantAdmin, firstTenant?.slug, tenantData?.tenant?.slug]);

  const transformedAdminNavigationItems: NavItem[] = useMemo(() => {
    const items = sidebarConfig.adminNavigationItems(params.locale as string).map(item => ({
      ...item,
      name: t(item.name),
      children: item.children?.map(child => ({
        ...child,
        name: t(child.name)
      }))
    }));
    return transformNavItemsForTenantDashboard(items);
  }, [params.locale, t, isInTenantDashboard, tenantSlug]);

  const transformedTenantAdminNavigationItems: NavItem[] = useMemo(() => {
    // Get tenant slug from multiple sources
    const currentTenantSlug = firstTenant?.slug || tenantData?.tenant?.slug || tenantSlug;
    
    const items = sidebarConfig.tenantAdminNavigationItems(params.locale as string, currentTenantSlug).map(item => ({
      ...item,
      name: t(item.name),
      children: item.children?.map(child => ({
        ...child,
        name: t(child.name)
      }))
    }));
    
    console.log('Original tenant admin items:', items);
    console.log('Filtering tenant admin items with tenant features:', tenantFeatures);
    
    // Filter items based on tenant features
    const filteredItems = filterNavigationByFeatures(items, tenantFeatures);
    console.log('Filtered tenant admin items:', filteredItems);
    
    // Since we're now generating the correct URLs directly, we don't need to transform them
    return filteredItems;
  }, [params.locale, t, tenantFeatures, firstTenant?.slug, tenantData?.tenant?.slug, tenantSlug]);

  // SuperAdmin navigation items - MCP (Master Control Panel)
  const transformedSuperAdminNavigationItems: NavItem[] = useMemo(() => {
    const items = sidebarConfig.superAdminNavigationItems(params.locale as string).map(item => ({
      ...item,
      name: t(item.name),
      children: item.children?.map(child => ({
        ...child,
        name: t(child.name)
      }))
    }));
    
    // SuperAdmin doesn't need feature filtering as they have access to everything
    // Transform for tenant dashboard context if needed (though SuperAdmin mainly works outside tenant context)
    return transformNavItemsForTenantDashboard(items);
  }, [params.locale, t, isInTenantDashboard, tenantSlug]);

  // Get feature-based navigation items and filter by tenant features
  const featureBasedNavigationItems: NavItem[] = useMemo(() => {
    const items = sidebarConfig.featureBasedNavigationItems(params.locale as string).map(item => ({
      ...item,
      name: t(item.name),
      children: item.children?.map(child => ({
        ...child,
        name: t(child.name)
      }))
    }));
    
    console.log('Original feature-based items:', items);
    console.log('Filtering with tenant features:', tenantFeatures);
    
    // Filter items based on tenant features
    const filteredItems = filterNavigationByFeatures(items, tenantFeatures);
    console.log('Filtered feature-based items:', filteredItems);
    
    // Transform for tenant dashboard context
    return transformNavItemsForTenantDashboard(filteredItems);
  }, [params.locale, tenantFeatures, t, isInTenantDashboard, tenantSlug]);

  // Filtrar enlaces externos basados en el rol efectivo
  const getFilteredExternalLinks = (): NavItem[] => {
    console.log('Called getFilteredExternalLinks with:', {
      effectiveRole,
      isSuperAdmin,
      linksCount: externalLinksData?.activeExternalLinks?.length || 0
    });
    
    // Casos de error
    if (externalLinksLoading) {
      console.log('External links are still loading');
      return [];
    }
    
    if (externalLinksError) {
      console.error('Error while loading external links:', externalLinksError);
      return [];
    }
    
    // Si no hay datos de enlaces externos, devolver un arreglo vacío
    if (!externalLinksData) {
      console.warn('No externalLinksData available - returning empty array');
      return [];
    }
    
    if (!externalLinksData.activeExternalLinks) {
      console.warn('externalLinksData exists but activeExternalLinks is undefined - returning empty array');
      return [];
    }
    
    if (!Array.isArray(externalLinksData.activeExternalLinks)) {
      console.warn('activeExternalLinks is not an array:', externalLinksData.activeExternalLinks, '- returning empty array');
      return [];
    }
    
    if (externalLinksData.activeExternalLinks.length === 0) {
      console.warn('activeExternalLinks is an empty array - no external links found');
      return [];
    }

    console.log('Processing', externalLinksData.activeExternalLinks.length, 'external links');
    
    try {
      // Si el usuario es super admin, mostrar todos los enlaces
      if (isSuperAdmin) {
        console.log('Super Admin user - showing ALL links');
        return externalLinksData.activeExternalLinks.map((link: ExternalLinkType): NavItem => ({
          name: link.name || 'Unnamed Link',
          href: link.url || '#',
          icon: getIconComponent(link.icon || 'LinkIcon'),
          accessType: link.accessType || 'PUBLIC',
          allowedRoles: Array.isArray(link.allowedRoles) ? link.allowedRoles : [],
        }));
      }
      
      // Para usuarios normales (no super admin, o cuando no hay simulación)
      return externalLinksData.activeExternalLinks
        .filter((link: ExternalLinkType) => {
          if (!link || typeof link !== 'object') {
            console.warn('Invalid link object:', link);
            return false;
          }
          
          // Mostrar siempre enlaces públicos
          if (link.accessType === 'PUBLIC') {
            return true;
          }
          
          // Para enlaces basados en roles
          if (link.accessType === 'ROLES' || link.accessType === 'MIXED') {
            const userRoleId = data?.me?.role?.id;
            
            if (!userRoleId) {
              console.warn('No user role ID available - denying access');
              return false;
            }
            
            // Verificar si el rol actual está en la lista de roles permitidos
            const hasRoleAccess = Array.isArray(link.allowedRoles) && link.allowedRoles.includes(userRoleId);
            
            if (hasRoleAccess) {
              return true;
            }
            
            // Si es solo ROLES y no tiene acceso, rechazar
            if (link.accessType === 'ROLES') {
              return false;
            }
          }
          
          // Para enlaces basados en usuarios (USER o MIXED)
          if (link.accessType === 'USERS' || link.accessType === 'MIXED') {
            const userId = data?.me?.id;
            return userId && Array.isArray(link.allowedUsers) && link.allowedUsers.includes(userId);
          }
          
          return false;
        })
        .map((link: ExternalLinkType): NavItem => ({
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

  // Muestra información de carga y error durante la depuración
  useEffect(() => {
    if (externalLinksLoading) {
      console.log('External links are loading...');
    }
    if (externalLinksError) {
      console.error('External links error:', externalLinksError.message);
    }
  }, [externalLinksLoading, externalLinksError]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = `/${params.locale}/login`;
  };

  // Render notification badge if there are unread notifications
  const renderBadge = (item: NavItem) => {
    if (item.badge && item.badge.value > 0) {
      return (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
          {item.badge.value > 99 ? '99+' : item.badge.value}
        </span>
      );
    }
    return null;
  };

  // Helper function to format tenant name for display
  const getTenantDisplayName = (): string => {
    const tenantName = firstTenant?.name || tenantData?.tenant?.name;
    const tenantSlug = firstTenant?.slug || tenantData?.tenant?.slug;
    
    // Show loading indicator if tenant data is still loading
    if (!firstTenantId) {
      return '...'; // Loading state - no tenant ID yet
    }
    
    if (firstTenantId && !tenantName && !tenantSlug) {
      return '...'; // Loading state - have tenant ID but tenant data still loading
    }
    
    // Use tenant name if available, otherwise use slug, otherwise show generic indicator
    return tenantName || tenantSlug || 'T';
  };

  // Helper function to check if a path is active (including nested routes with slugs)
  const isPathActive = (itemHref: string, currentPath: string): boolean => {
    // Exact match
    if (currentPath === itemHref) return true;
    
    // Check if current path starts with item href (for nested routes)
    if (currentPath.startsWith(itemHref + '/')) return true;
    
    // Handle dynamic routes with slugs
    const pathSegments = currentPath.split('/').filter(Boolean);
    const itemSegments = itemHref.split('/').filter(Boolean);
    
    if (itemSegments.length === 0) return false;
    
    // Check if all item segments match the path (allowing for additional segments)
    return itemSegments.every((segment, index) => {
      if (index >= pathSegments.length) return false;
      return pathSegments[index] === segment || segment.startsWith('[') && segment.endsWith(']');
    });
  };

  // Helper function to check if any child is active
  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => 
      isPathActive(child.href, pathname) || hasActiveChild(child)
    );
  };

  // Component to render navigation items with children support
  const NavigationItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isPathActive(item.href, pathname);
    const hasActiveChildPath = hasActiveChild(item);
    
    // Keep expanded if any child is active or if this item is active
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

  // Render navigation items
  const renderNavigationItems = () => {
    // If it's a regular USER, only show external links
    if (showAsUser) {
      return null;
    }
    
    return (
      <> 
        {/* SuperAdmin items - MCP (Master Control Panel) */}
        {isSuperAdmin && (
          <>
            <div className="mb-4 mt-2">
              <h3 className="text-xs font-semibold uppercase text-gray-600 tracking-wider">
                🌐 {t('sidebar.masterControlPanel')} (MCP)
              </h3>
            </div>

            {transformedSuperAdminNavigationItems.map(item => (
              <NavigationItem key={item.href} item={item} />
            ))}
          </>
        )}
                  
        {/* Admin items */}
        {showAsAdmin && !(isSuperAdmin) && (
          <>
            <div className="mb-4 mt-2">
              <h3 className="text-xs font-semibold uppercase text-gray-600 tracking-wider">
                {t('sidebar.administration')}
              </h3>
            </div>

            {transformedAdminNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isPathActive(item.href, pathname)
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? (
                  <LockIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <item.icon className={`h-4 w-4 ${isPathActive(item.href, pathname) ? 'text-blue-700' : 'text-gray-500'}`} />
                )}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
            
            {/* User section for admins */}
            <div className="pb-4">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4" />
                  <span>{t('sidebar.user')}</span>
                </div>
                {userMenuOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              
              {userMenuOpen && (
                <div className="pl-4 mt-1 space-y-1">
                  {transformedBaseNavigationItems.map(item => (
                    <Link 
                      key={item.href}
                      href={item.disabled ? "#" : item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === item.href 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
                    >
                      {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                      <span>{item.name}</span>
                      {renderBadge(item)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tools section for admins */}
            <div className="mt-4 border-t pt-4 mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.tools')}
              </h3>
            </div>


            {featureBasedNavigationItems.map(item => (
              <NavigationItem key={item.href} item={item} />
            ))}

            </>
        )}

        {/* TenantAdmin items - Administrador de Tenant */}
        {showAsTenantAdmin && (
          <>
            <div className="mb-4 mt-4">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                🏢 {t('sidebar.tenantAdministration')}
              </h3>
            </div>

            {transformedTenantAdminNavigationItems.map(item => (
              <NavigationItem key={item.href} item={item} />
            ))}
          </>
        )}
        
        {/* Manager items */}
        {showAsManager && !showAsAdmin && !showAsTenantAdmin && (
          <>
            {/* Notifications section for managers */}
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                {t('sidebar.notifications')}
              </h3>
              <Link 
                href={`/${params.locale}/${tenantSlug}/notifications`}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === `/${params.locale}/${tenantSlug}/notifications`
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <BellIcon className="h-4 w-4" />
                <span>{t('sidebar.notifications')}</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link 
                href={`/${params.locale}/${tenantSlug}/notifications`}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === `/${params.locale}/${tenantSlug}/notifications`
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <MessageSquareIcon className="h-4 w-4" />
                <span>{t('sidebar.createNotifications')}</span>
              </Link>
            </div>

            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.management')}
              </h3>
            </div>
            
            {/* Tools section for managers */}
            <div className="mt-4 border-t pt-4 mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.tools')}
              </h3>
            </div>
            {featureBasedNavigationItems.map(item => (
              <NavigationItem key={item.href} item={item} />
            ))}
            
            {/* Base items for managers */}
            <div className="mt-4 border-t pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                {t('sidebar.dashboard')}
              </h3>
            </div>
            {transformedBaseNavigationItems.filter(item => 
              !item.href.includes('/notifications')
            ).map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
          </>
        )}
        
        {/* Regular User Items (excluding USER role) */}
        {shouldShowRegularUserView && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.dashboard')}
              </h3>
            </div>
            {transformedBaseNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
          </>
        )}
        
        {/* Employee Items - Similar to regular users but for employees specifically */}
        {showAsEmployee && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.dashboard')}
              </h3>
            </div>
            {transformedBaseNavigationItems.map(item => (
              <Link 
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
              >
                {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
                {renderBadge(item)}
              </Link>
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:inset-y-0 h-screen">
        <div className="flex flex-col bg-white border-r border-gray-200 h-screen">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <Link href={`/${params.locale}`} className="flex items-center">
              {/* Header Title instead of logo box */}
              <h1 
                className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                title={tenantData?.tenant?.name || 'Cargando...'}
              >
                {getTenantDisplayName()}
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher variant="sidebar" />
              
              {/* Role badges */}
              {isSuperAdmin && (
                <span className="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full font-medium">
                  Super Admin
                </span>
              )}
              {isAdmin && !isSuperAdmin && (
                <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                  Admin
                </span>
              )}
              {showAsTenantAdmin && !isSuperAdmin && !isAdmin && (
                <span className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                  Tenant Admin
                </span>
              )}
              {isManager && !isAdmin && !isSuperAdmin && !showAsTenantAdmin && (
                <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                  Manager
                </span>
              )}
              {showAsUser && (
                <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                  Usuario
                </span>
              )}
            </div>
          </div>

          {isSuperAdmin && (
            <div className="mt-4 p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="mb-3 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                {t('sidebar.adminTools')}
              </h3>
              <div className="px-3 py-2 text-sm text-gray-700">
                <p>{t('sidebar.adminMessage')}</p>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  onClick={() => window.location.href = `/${params.locale}/super-admin/tenants/create`}
                >
                  <UserIcon className="h-3 w-3" />
                  {t('sidebar.newTenant')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  onClick={() => window.location.href = `/${params.locale}/${tenantSlug}/notifications`}
                >
                  <BellIcon className="h-3 w-3" />
                  {t('sidebar.message')}
                </Button>
              </div>
              

            </div>
          )}
          
          {/* Nav items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
                {showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.welcome')}
                    </h3>
                    <div className="px-3 py-2 text-sm text-gray-700">
                      <p>{t('sidebar.welcomeMessage')}</p>
                    </div>
                  </div>
                )}
                {!showAsUser && renderNavigationItems()}
             

              <div className="mb-6 border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  {t('sidebar.externalLinksTitle')}
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
                  <>
                    {externalLinks.map((item: NavItem) => (
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
                    ))}
                    {isSuperAdmin && (
                      <div className="mt-3 px-4 py-2 text-xs text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                        {t('sidebar.adminViewingAllLinks')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="border border-gray-200">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gray-100 text-gray-700">UN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-gray-900">{data?.me?.firstName} {data?.me?.lastName}</span>
                <span className="text-xs text-gray-600">{data?.me?.role?.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
                onClick={handleLogout}
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
            {/* Mobile sidebar header with close button */}
            <div className="flex items-center justify-between h-16 px-4 border-b shrink-0">
              <Link href={`/${params.locale}`} className="flex items-center" onClick={() => setIsOpen(false)}>
                {/* Header Title instead of logo box */}
                <h1 
                  className="text-lg font-bold text-gray-800 hover:text-indigo-600 transition-colors"
                  title={tenantData?.tenant?.name || 'Cargando...'}
                >
                  {getTenantDisplayName()}
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <LanguageSwitcher variant="sidebar" />
                
                {/* Role badges */}
                {isSuperAdmin && (
                  <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-md">
                    Super Admin
                  </span>
                )}
                {isAdmin && !isSuperAdmin && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                    Admin
                  </span>
                )}
                {isManager && !isAdmin && !isSuperAdmin && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                    Manager
                  </span>
                )}
                {showAsUser && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                    Usuario
                  </span>
                )}
                
                {/* Close button */}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Mobile nav items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-3 space-y-1">
                {isSuperAdmin && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.adminTools')}
                    </h3>
                    

                    
                    <div className="grid grid-cols-2 gap-2 px-3 mb-2">
                                              <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center justify-center gap-2"
                          onClick={() => {
                            window.location.href = `/${params.locale}/super-admin/tenants/create`;
                            setIsOpen(false);
                          }}
                        >
                          <UserIcon className="h-3 w-3" />
                          {t('sidebar.newTenant')}
                        </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                        window.location.href = `/${params.locale}/${tenantSlug}/notifications`;
                          setIsOpen(false);
                        }}
                      >
                        <BellIcon className="h-3 w-3" />
                        {t('sidebar.message')}
                      </Button>
                    </div>
                  </div>
                )}
                
                {showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.welcome')}
                    </h3>
                    <div className="px-3 py-2 text-sm text-gray-700">
                      <p>{t('sidebar.welcomeMessage')}</p>
                    </div>
                  </div>
                )}
                
                {showAsAdmin && !showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.administration')}
                    </h3>
                    {transformedAdminNavigationItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.disabled ? "#" : item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          pathname === item.href 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
                      >
                        {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                        <span>{item.name}</span>
                        {renderBadge(item)}
                      </Link>
                    ))}
                  </div>
                )}

                {/* SuperAdmin items - Mobile */}
                {isSuperAdmin && !showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      🚀 {t('sidebar.superAdministration')}
                    </h3>
                    {transformedSuperAdminNavigationItems.map((item) => (
                      <NavigationItem key={item.href} item={item} />
                    ))}
                  </div>
                )}

                {/* TenantAdmin items - Mobile */}
                {showAsTenantAdmin && !showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      🏢 {t('sidebar.tenantAdministration')}
                    </h3>
                    {transformedTenantAdminNavigationItems.map((item) => (
                      <NavigationItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
                   
                {showAsManager && !showAsUser && !showAsTenantAdmin && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.notifications')}
                    </h3>
                    <Link 
                      href={`/${params.locale}/${params.tenantSlug}/notifications`}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === `/${params.locale}/${params.tenantSlug}/notifications`
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <BellIcon className="h-4 w-4" />
                      <span>{t('sidebar.notifications')}</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link 
                      href={`/${params.locale}/${params.tenantSlug}/notifications`}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === `/${params.locale}/${params.tenantSlug}/notifications`
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <MessageSquareIcon className="h-4 w-4" />
                      <span>{t('sidebar.createNotifications')}</span>
                    </Link>
                  </div>
                )}
                   
              
                
                {!showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.dashboard')}
                    </h3>
                    {transformedBaseNavigationItems.filter(item => 
                      !((showAsManager || showAsAdmin || showAsTenantAdmin) && item.href.includes('/notifications'))
                    ).map((item) => (
                      <Link 
                        key={item.href}
                        href={item.disabled ? "#" : item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          pathname === item.href 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={item.disabled ? (e) => e.preventDefault() : () => setIsOpen(false)}
                      >
                        {item.locked ? <LockIcon className="h-4 w-4 text-gray-400" /> : <item.icon className="h-4 w-4" />}
                        <span>{item.name}</span>
                        {renderBadge(item)}
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    {t('sidebar.externalLinksTitle')}
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
                    <>
                      {externalLinks.map((item: NavItem) => (
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
                      ))}
                      {isSuperAdmin && (
                        <div className="mt-2 px-3 py-1 text-xs text-gray-500">
                          {t('sidebar.adminViewingAllLinks')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </nav>
            </div>
            
            {/* Mobile sidebar footer */}
            <div className="border-t p-3 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>UN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{data?.me?.firstName} {data?.me?.lastName}</span>
                  <span className="text-xs text-gray-500">{data?.me?.role?.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
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