'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  SettingsIcon,
  HelpCircleIcon,
  BellIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  UsersIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  BarChartIcon,
  ShieldIcon,
  UserPlusIcon,
  LineChartIcon,
  LockIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import React from 'react';

// GraphQL queries y mutations
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      firstName
      lastName
      role {
        id
        name
        description
      }
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


const GET_ALL_ROLES = gql`
  query GetAllRoles {
    roles {
      id
      name
      description
    }
  }
`;

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: string[];
  permissions?: string[];
  badge?: {
    key: string;
    value: number;
  };
  disabled?: boolean;
  locked?: boolean;
  accessType?: string;
  allowedRoles?: string[];
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user: authUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
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

  // Check if user is an admin (using both sources of data)
  const isAdmin = data?.me?.role?.name === 'ADMIN' || authUser?.role?.name === 'ADMIN';
  const isManager = data?.me?.role?.name === 'MANAGER' || authUser?.role?.name === 'MANAGER';

  // Get all roles (for admin role switcher)
  const { data: rolesData, loading: rolesLoading } = useQuery(GET_ALL_ROLES, {
    client,
    skip: !isAdmin,
    onError: (error) => {
      console.error('Error fetching roles:', error);
    }
  });

  // Sort roles in the required order: admin, manager, employee, user, others
  const sortedRoles = React.useMemo(() => {
    if (!rolesData?.roles) return [];
    
    const roleOrder = {
      'ADMIN': 1,
      'MANAGER': 2,
      'EMPLOYEE': 3, 
      'USER': 4
    };
    
    return [...rolesData.roles].sort((a, b) => {
      const orderA = roleOrder[a.name as keyof typeof roleOrder] || 999;
      const orderB = roleOrder[b.name as keyof typeof roleOrder] || 999;
      return orderA - orderB;
    });
  }, [rolesData?.roles]);

  // Determinar el rol efectivo para mostrar (rol simulado o rol real del usuario)
  const effectiveRole = useMemo(() => {
    // Si el usuario es admin y ha seleccionado un rol para simulación
    if (isAdmin && selectedRole) {
      console.log(`Admin user viewing as ${selectedRole}`);
      return selectedRole;
    }
    
    // En caso contrario, usar el rol real del usuario
    const actualRole = data?.me?.role?.name;
    console.log('Actual role:', actualRole);
    console.log(`Using actual user role: ${actualRole}`);
    return actualRole;
  }, [isAdmin, selectedRole, data?.me?.role?.name]);
  
  // Derived states based on effective role
  const showAsAdmin = effectiveRole === 'ADMIN';
  const showAsManager = effectiveRole === 'MANAGER' || (!showAsAdmin && isManager);
  const showAsUser = effectiveRole === 'USER';
  const showAsEmployee = effectiveRole === 'EMPLOYEE';
  const shouldShowRegularUserView = !showAsAdmin && !showAsManager && !showAsUser && !showAsEmployee;

  // Cargar los datos de notificaciones no leídas
  const { data: notificationsData } = useQuery(GET_UNREAD_NOTIFICATIONS_COUNT, {
    client,
    fetchPolicy: 'cache-and-network',
  });

  // Actualizar el contador de notificaciones cuando cambien los datos
  useEffect(() => {
    if (notificationsData?.unreadNotificationsCount !== undefined) {
      setUnreadCount(notificationsData.unreadNotificationsCount);
    }
  }, [notificationsData]);

  // Get external links
  const { data: externalLinksData, loading: externalLinksLoading, error: externalLinksError, refetch: refetchExternalLinks } = useQuery(GET_ACTIVE_EXTERNAL_LINKS, {
    client,
    fetchPolicy: 'network-only', // Asegura datos frescos cada vez
    nextFetchPolicy: 'network-only', // Para refetch también
    context: {
      headers: {
        // Añadir explícitamente el token de autorización si está disponible
        authorization: typeof window !== 'undefined' 
          ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1] || ''}` 
          : '',
      }
    },
    onCompleted: (data) => {
      console.log('External links data loaded successfully:', data);
      if (data && data.activeExternalLinks) {
        console.log('Headers enviados en la request:', {
          authorization: typeof window !== 'undefined' 
            ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1] || ''}` 
            : '',
        });
        
        // Log each link to debug
        data.activeExternalLinks.forEach((link: ExternalLinkType) => {
          console.log(`Received link: ${link.name}, accessType: ${link.accessType}, roles:`, link.allowedRoles);
        });
      }
    },
    onError: (error) => {
      console.error('Error fetching external links:', error);
      console.error('GraphQL error details:', error.graphQLErrors);
      console.error('Network error details:', error.networkError);
    }
  });

  // Añadir logs para depurar datos de enlaces externos
  useEffect(() => {
    console.log('External Links Data:', externalLinksData);
    if (externalLinksData) {
      console.log('Active External Links:', externalLinksData.activeExternalLinks);
    }
  }, [externalLinksData]);

  // Refrescar los enlaces cuando cambia el rol
  useEffect(() => {
    if (refetchExternalLinks) {
      console.log('Role changed, refreshing external links. Current effective role:', effectiveRole);
      // Refrescar los enlaces externos cuando cambia el rol
      refetchExternalLinks()
        .then(result => {
          console.log('External links refreshed after role change:', result.data?.activeExternalLinks?.length || 0, 'links');
        })
        .catch(error => {
          console.error('Error refreshing external links:', error);
        });
    }
  }, [effectiveRole, refetchExternalLinks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(`${window.location.origin}/logo.png`);
      
      // Close sidebar on mobile when route changes
      setIsOpen(false);
      
      // Handle resize event
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setIsOpen(false);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [pathname]);

  // Generate base navigation items (for all users)
  const baseNavigationItems: NavItem[] = [
    { name: t('sidebar.dashboard'), href: `/${params.locale}/dashboard`, icon: HomeIcon },
    { 
      name: t('sidebar.notifications'), 
      href: `/${params.locale}/dashboard/notifications`, 
      icon: BellIcon,
      permissions: ['notifications:read'],
      badge: {
        key: 'unread',
        value: unreadCount
      }
    },
    { name: t('sidebar.benefits'), href: `/${params.locale}/dashboard/benefits`, icon: UserIcon },
    { name: t('sidebar.help'), href: `/${params.locale}/dashboard/help`, icon: HelpCircleIcon },
    { name: t('sidebar.settings'), href: `/${params.locale}/dashboard/settings`, icon: SettingsIcon },
  ];

  // Admin-specific navigation items
  const adminNavigationItems: NavItem[] = [
    { 
      name: t('sidebar.adminDashboard'), 
      href: `/${params.locale}/admin`, 
      icon: BarChartIcon, 
      permissions: ['admin:view']
    },

    { 
      name: t('sidebar.userManagement'), 
      href: `/${params.locale}/admin/users`, 
      icon: UsersIcon, 
      permissions: ['users:read']
    },
    {
      name: t('sidebar.roleManagement'),
      href: `/${params.locale}/admin/roles`,
      icon: ShieldIcon,
      permissions: ['roles:read']
    },
    { 
      name: t('sidebar.bookNow'), 
      href: `/${params.locale}/dashboard/bookings`, 
      icon: CalendarIcon,
      disabled: true,
      locked: true
    },
    {
      name: t('sidebar.externalLinks'),
      href: `/${params.locale}/admin/external-links`,
      icon: LinkIcon,
      permissions: ['admin:view']
    },
  ];

  // Manager-specific navigation items
  const managerNavigationItems: NavItem[] = [
    { 
      name: t('sidebar.createNotifications'), 
      href: `/${params.locale}/admin/notifications`, 
      icon: MessageSquareIcon,
      permissions: ['notifications:create']
    },
    {
      name: t('sidebar.staffManagement'),
      href: `/${params.locale}/manager/staff`,
      icon: UsersIcon,
      permissions: ['staff:view', 'staff:manage']
    },
    // {
    //   name: t('sidebar.approveRequests'),
    //   href: `/${params.locale}/manager/approvals`,
    //   icon: ClipboardListIcon,
    //   permissions: ['approvals:manage']
    // },
    
  ];

  const designNavigationItems: NavItem[] = [
    {
      name: t('sidebar.cms'),
      href: `/${params.locale}/cms`,
      icon: ClipboardListIcon,
      permissions: ['cms:access'],
      roles: ['ADMIN', 'MANAGER'],
      children: [
        {
          name: t('sidebar.cmsPages'),
          href: `/${params.locale}/cms/pages`,
          icon: LineChartIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: t('sidebar.cmsMedia'),
          href: `/${params.locale}/cms/media`,
          icon: LinkIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: t('sidebar.cmsMenus'),
          href: `/${params.locale}/cms/menus`,
          icon: MenuIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        },
        {
          name: t('sidebar.cmsSettings'),
          href: `/${params.locale}/cms/settings`,
          icon: SettingsIcon,
          permissions: ['cms:access'],
          roles: ['ADMIN', 'MANAGER']
        }
      ]
    },
  ]

  // Convertir los enlaces externos del API a objetos NavItem
  const getIconComponent = (iconName: string): React.ElementType => {
    const icons: { [key: string]: React.ElementType } = {
      HomeIcon,
      UserIcon,
      CalendarIcon,
      SettingsIcon,
      HelpCircleIcon,
      BellIcon,
      LogOutIcon,
      UsersIcon,
      MessageSquareIcon,
      ClipboardListIcon,
      BarChartIcon,
      ShieldIcon,
      UserPlusIcon,
      LineChartIcon,
      LockIcon,
      LinkIcon
    };
    
    return icons[iconName] || UserIcon; // Default to UserIcon if not found
  };

  // Filtrar enlaces externos basados en el rol efectivo
  const getFilteredExternalLinks = (): NavItem[] => {
    console.log('Called getFilteredExternalLinks with:', {
      effectiveRole,
      isAdmin,
      selectedRole,
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
      // Si el usuario es admin y está simulando un rol, filtrar enlaces según el rol simulado
      if (isAdmin && selectedRole) {
        console.log(`Admin user simulating role ${selectedRole}`);
        
        // Buscar el ID del rol seleccionado para filtrar
        const selectedRoleObj = sortedRoles.find(r => r.name === selectedRole);
        if (!selectedRoleObj) {
          console.warn(`Selected role ${selectedRole} not found in available roles`);
        }
        
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
            
            // Para enlaces basados en roles, verificar si el rol simulado tiene acceso
            if (link.accessType === 'ROLES' || link.accessType === 'MIXED') {
              // Para enlaces de tipo ROLES, verificar si el rol simulado está permitido
              const hasRoleAccess = Array.isArray(link.allowedRoles) && 
                                  link.allowedRoles.some(roleId => {
                                    // Buscar el rol por ID
                                    const allowedRole = sortedRoles.find(r => r.id === roleId);
                                    // Verificar si coincide con el rol simulado
                                    return allowedRole && allowedRole.name === selectedRole;
                                  });
              
              if (hasRoleAccess) {
                console.log(`Link ${link.name} allowed for simulated role ${selectedRole}`);
                return true;
              }
              
              // Si es solo ROLES y no tiene acceso, rechazar
              if (link.accessType === 'ROLES') {
                return false;
              }
            }
            
            // Para MIXED o USERS, verificar también el usuario (que en este caso es irrelevante porque estamos simulando un rol)
            return false;
          })
          .map((link: ExternalLinkType): NavItem => ({
            name: link.name || 'Unnamed Link',
            href: link.url || '#',
            icon: getIconComponent(link.icon || 'LinkIcon'),
            accessType: link.accessType || 'PUBLIC',
            allowedRoles: Array.isArray(link.allowedRoles) ? link.allowedRoles : [],
          }));
      }
      
      // Si el usuario es admin sin simulación, mostrar todos los enlaces
      if (isAdmin && !selectedRole) {
        console.log('Admin user without role simulation - showing ALL links');
        return externalLinksData.activeExternalLinks.map((link: ExternalLinkType): NavItem => ({
          name: link.name || 'Unnamed Link',
          href: link.url || '#',
          icon: getIconComponent(link.icon || 'LinkIcon'),
          accessType: link.accessType || 'PUBLIC',
          allowedRoles: Array.isArray(link.allowedRoles) ? link.allowedRoles : [],
        }));
      }
      
      // Para usuarios normales (no admin, o cuando no hay simulación)
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

  // Redirigir a usuarios con rol USER si intentan acceder a rutas internas del dashboard
  useEffect(() => {
    if (showAsUser && pathname && 
        (pathname.includes('/dashboard') || 
         pathname.includes('/admin') || 
         pathname.includes('/manager'))) {
      // Obtener el primer enlace externo disponible para redirigir al usuario
      const firstExternalLink = externalLinks && externalLinks.length > 0 
        ? externalLinks[0].href 
        : `/${params.locale}`;
      
      console.log('Usuario con rol USER intentando acceder a ruta interna, redirigiendo a:', firstExternalLink);
      
      // Espera un momento antes de redirigir para asegurar que todo esté cargado
      const redirectTimeout = setTimeout(() => {
        window.location.href = firstExternalLink;
      }, 1000);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [showAsUser, pathname, externalLinks, params.locale]);

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
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {item.badge.value > 99 ? '99+' : item.badge.value}
        </span>
      );
    }
    return null;
  };

  // Helper function to translate role names safely
  const translateRole = (roleName: string): string => {
    try {
      const roleKey = `roles.${roleName}`;
      const translation = t(roleKey);
      return translation === roleKey ? roleName : translation;
    } catch {
      return roleName;
    }
  };
  
  // Helper function to format the role switcher text
  const getRoleSwitcherText = (): string => {
    const baseText = t('sidebar.roleSwitcher');
    const roleText = selectedRole ? translateRole(selectedRole) : translateRole('ADMIN');
    return baseText.replace('{role}', roleText);
  };

  // Helper function to format text with a role parameter
  const formatTextWithRole = (key: string, role: string): string => {
    const baseText = t(key);
    return baseText.replace('{role}', translateRole(role));
  };

  // Render navigation items
  const renderNavigationItems = () => {
    // If it's a regular USER, only show external links
    if (showAsUser) {
      return null;
    }
    
    return (
      <>
        {/* Admin items */}
        {showAsAdmin && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.administration')}
              </h3>
            </div>
            {adminNavigationItems.map(item => (
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
            
            {/* Manager items for admins too */}
            <div className="mt-4 border-t pt-4 mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.management')}
              </h3>
            </div>
            {managerNavigationItems.map(item => (
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

            {/* Design section for admins */}
            <div className="mt-4 border-t pt-4 mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.design')}
              </h3>
            </div>
            {designNavigationItems.map(item => (
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
            
            {/* User section for admins */}
            <div className="mt-4 border-t pt-4">
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
                  {baseNavigationItems.map(item => (
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
          </>
        )}
        
        {/* Manager items */}
        {showAsManager && !showAsAdmin && (
          <>
            {/* Notifications section for managers */}
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                {t('sidebar.notifications')}
              </h3>
              <Link 
                href={`/${params.locale}/dashboard/notifications`}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === `/${params.locale}/dashboard/notifications`
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
                href={`/${params.locale}/admin/notifications`}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === `/${params.locale}/admin/notifications`
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
            {managerNavigationItems.filter(item => 
              !item.href.includes('/admin/notifications')
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
            
            {/* Design section for managers */}
            <div className="mt-4 border-t pt-4 mb-2">
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {t('sidebar.design')}
              </h3>
            </div>
            {designNavigationItems.map(item => (
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
            
            {/* Base items for managers */}
            <div className="mt-4 border-t pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                {t('sidebar.dashboard')}
              </h3>
            </div>
            {baseNavigationItems.filter(item => 
              !item.href.includes('/dashboard/notifications')
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
            {baseNavigationItems.map(item => (
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
            {baseNavigationItems.map(item => (
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
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 h-screen">
        <div className="flex flex-col bg-white border-r h-screen">
          {/* Sidebar header */}
          <div className="flex items-center border-b px-4">
            <Link href={`/${params.locale}`} className="flex items-center">
              <Image 
                src={logoUrl} 
                alt="E-voque Logo" 
                width={12} 
                height={12} 
                className="h-14 w-16" 
              />
            </Link>
            {isAdmin && (
              <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-md">
                Admin
              </span>
            )}
            {isManager && !isAdmin && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                Manager
              </span>
            )}
            {showAsUser && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                Usuario
              </span>
            )}
          </div>

          {isAdmin && (
            <div className="mt-2 p-3">
              <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                {t('sidebar.adminTools')}
              </h3>
              <div className="px-3 py-2 text-sm text-gray-500">
                <p>{t('sidebar.adminMessage')}</p>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 px-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2"
                  onClick={() => window.location.href = `/${params.locale}/admin/users`}
                >
                  <UserPlusIcon className="h-3 w-3" />
                  {t('sidebar.newUser')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2"
                  onClick={() => window.location.href = `/${params.locale}/admin/notifications`}
                >
                  <BellIcon className="h-3 w-3" />
                  {t('sidebar.message')}
                </Button>
              </div>
              
              {/* Role Switcher for Admins */}
              <div className="mt-4 border-t pt-3">
                <button 
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-indigo-600" />
                    <span>{getRoleSwitcherText()}</span>
                  </div>
                  {roleMenuOpen ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>
                
                {roleMenuOpen && (
                  <div className="mt-1 rounded-md border bg-white shadow-sm">
                    <div className="py-1">
                      {rolesLoading ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : (
                        <>
                          <button
                            className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${!selectedRole ? 'bg-indigo-50 text-indigo-700' : ''}`}
                            onClick={() => {
                              setSelectedRole(null);
                              setRoleMenuOpen(false);
                            }}
                          >
                            {t('sidebar.defaultRole')}
                          </button>
                          {sortedRoles.filter(role => role.name !== 'ADMIN').map((role) => (
                            <button
                              key={role.id}
                              className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${selectedRole === role.name ? 'bg-indigo-50 text-indigo-700' : ''}`}
                              onClick={() => {
                                setSelectedRole(role.name);
                                setRoleMenuOpen(false);
                              }}
                            >
                              {translateRole(role.name)}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Nav items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-3 space-y-1">
              <div className="border-t pt-3">
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
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                  {t('sidebar.externalLinksTitle')}
                  {isAdmin && selectedRole && (
                    <span className="ml-2 font-normal text-indigo-600">
                      ({formatTextWithRole('sidebar.viewingAsRole', selectedRole)})
                    </span>
                  )}
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
                    {isAdmin && selectedRole 
                      ? formatTextWithRole('sidebar.noExternalLinksForRole', selectedRole)
                      : t('sidebar.noExternalLinks')}
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
                    {isAdmin && !selectedRole && (
                      <div className="mt-2 px-3 py-1 text-xs text-gray-500">
                        {t('sidebar.adminViewingAllLinks')}
                      </div>
                    )}
                    {isAdmin && selectedRole && (
                      <div className="mt-2 px-3 py-1 text-xs text-indigo-500 border-t pt-2">
                        {t('sidebar.adminRoleSwitchInfo')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/50">
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-lg flex flex-col">
            {/* Mobile sidebar header with close button */}
            <div className="flex items-center justify-between h-16 px-4 border-b shrink-0">
              <Link href={`/${params.locale}`} className="flex items-center" onClick={() => setIsOpen(false)}>
                <Image 
                  src={logoUrl} 
                  alt="E-voque Logo" 
                  width={24} 
                  height={24} 
                  className="h-12 w-12" 
                />
              </Link>
              {isAdmin && (
                <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-md">
                  Admin
                </span>
              )}
              {isManager && !isAdmin && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                  Manager
                </span>
              )}
              {showAsUser && (
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                  Usuario
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile nav items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-3 space-y-1">
                {isAdmin && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.adminTools')}
                    </h3>
                    
                    {/* Role Switcher for Admins (Mobile) */}
                    <div className="px-3 mb-3">
                      <button 
                        onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                        className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <EyeIcon className="h-4 w-4 text-indigo-600" />
                          <span>{getRoleSwitcherText()}</span>
                        </div>
                        {roleMenuOpen ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      
                      {roleMenuOpen && (
                        <div className="mt-1 rounded-md border bg-white shadow-sm">
                          <div className="py-1">
                            {rolesLoading ? (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                Loading...
                              </div>
                            ) : (
                              <>
                                <button
                                  className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${!selectedRole ? 'bg-indigo-50 text-indigo-700' : ''}`}
                                  onClick={() => {
                                    setSelectedRole(null);
                                    setRoleMenuOpen(false);
                                  }}
                                >
                                  {t('sidebar.defaultRole')}
                                </button>
                                {sortedRoles.filter(role => role.name !== 'ADMIN').map((role) => (
                                  <button
                                    key={role.id}
                                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${selectedRole === role.name ? 'bg-indigo-50 text-indigo-700' : ''}`}
                                    onClick={() => {
                                      setSelectedRole(role.name);
                                      setRoleMenuOpen(false);
                                    }}
                                  >
                                    {translateRole(role.name)}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 px-3 mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                          window.location.href = `/${params.locale}/admin/users`;
                          setIsOpen(false);
                        }}
                      >
                        <UserPlusIcon className="h-3 w-3" />
                        {t('sidebar.newUser')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                          window.location.href = `/${params.locale}/admin/notifications`;
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
                    {adminNavigationItems.map((item) => (
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
                   
                {showAsManager && !showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.notifications')}
                    </h3>
                    <Link 
                      href={`/${params.locale}/dashboard/notifications`}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === `/${params.locale}/dashboard/notifications`
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
                      href={`/${params.locale}/admin/notifications`}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === `/${params.locale}/admin/notifications`
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
                   
                {showAsManager && !showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.management')}
                    </h3>
                    {managerNavigationItems.filter(item => 
                      !item.href.includes('/admin/notifications')
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
                
                {!showAsUser && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
                      {t('sidebar.dashboard')}
                    </h3>
                    {baseNavigationItems.filter(item => 
                      !((showAsManager || showAsAdmin) && item.href.includes('/dashboard/notifications'))
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
                    {isAdmin && selectedRole && (
                      <span className="ml-2 font-normal text-indigo-600">
                        ({formatTextWithRole('sidebar.viewingAsRole', selectedRole)})
                      </span>
                    )}
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
                      {isAdmin && selectedRole 
                        ? formatTextWithRole('sidebar.noExternalLinksForRole', selectedRole)
                        : t('sidebar.noExternalLinks')}
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
                      {isAdmin && !selectedRole && (
                        <div className="mt-2 px-3 py-1 text-xs text-gray-500">
                          {t('sidebar.adminViewingAllLinks')}
                        </div>
                      )}
                      {isAdmin && selectedRole && (
                        <div className="mt-2 px-3 py-1 text-xs text-indigo-500 border-t pt-2">
                          {t('sidebar.adminRoleSwitchInfo')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </nav>
            </div>
            
            {/* Mobile sidebar footer */}
            <div className="border-t p-3 shrink-0">
              <div className="flex items-center gap-3">
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