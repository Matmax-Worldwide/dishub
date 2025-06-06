'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';

// Updated role names to match the new role system
export type RoleName = 
  | 'SuperAdmin' | 'PlatformAdmin' | 'SupportAgent'
  | 'TenantAdmin' | 'TenantManager' | 'TenantUser'
  | 'ContentManager' | 'ContentEditor'
  | 'HRAdmin' | 'HRManager' | 'Employee'
  | 'BookingAdmin' | 'Agent' | 'Customer'
  | 'StoreAdmin' | 'StoreManager'
  | 'FinanceManager' | 'SalesRep' | 'Instructor' | 'ProjectLead';

// Updated permissions mapping for new roles
const rolePermissions: Record<RoleName, string[]> = {
  SuperAdmin: [
    'all:permissions', // SuperAdmin has all permissions
    'admin:view',
    'admin:create',
    'admin:update',
    'admin:delete',
    'manage:all_tenants',
    'access:all_databases',
    'manage:platform_configuration',
  ],
  
  PlatformAdmin: [
    'manage:tenants',
    'view:tenant_analytics',
    'manage:modules',
    'activate:modules',
    'deactivate:modules',
    'manage:plans',
    'view:platform_analytics',
  ],
  
  SupportAgent: [
    'view:support_dashboard',
    'view:tickets',
    'update:ticket',
    'view:user_issues',
    'assist:users',
    'view:system_status',
  ],
  
  TenantAdmin: [
    'admin:view',
    'admin:create',
    'admin:update',
    'admin:delete',
    'manage:tenant_settings',
    'manage:tenant_users',
    'activate:tenant_modules',
    'read:user',
    'create:user',
    'update:user',
    'delete:user',
    'manage:settings',
    'access:adminDashboard',
  ],
  
  TenantManager: [
    'manager:view',
    'manager:create',
    'manager:update',
    'view:reports',
    'approve:actions',
    'read:user',
    'access:managerDashboard',
  ],
  
  TenantUser: [
    'user:view',
    'read:post',
    'update:ownProfile',
    'access:tenant_dashboard',
  ],
  
  ContentManager: [
    'admin:view',
    'create:blog',
    'update:blog',
    'delete:blog',
    'create:post',
    'update:any_post',
    'delete:post',
    'publish:post',
    'manage:media',
    'edit:cms_content',
    'create:page',
    'edit:page',
    'delete:page',
  ],
  
  ContentEditor: [
    'editor:view',
    'create:post',
    'update:own_post',
    'read:any_post',
    'edit:cms_content',
    'read:any_page',
  ],
  
  HRAdmin: [
    'admin:view',
    'list:employees',
    'view:any_employee_profile',
    'create:employee',
    'update:employee',
    'delete:employee',
    'manage:departments',
    'manage:positions',
    'view:all_attendance',
    'manage:attendance',
    'generate:hr_reports',
    'manage:leaves',
    'approve:leave',
    'reject:leave',
    'manage:benefits',
    'manage:payroll',
    'process:payroll',
    'manage:performance_reviews',
    'manage:trainings',
  ],
  
  HRManager: [
    'manager:view',
    'list:employees',
    'view:any_employee_profile',
    'update:employee',
    'view:departments',
    'view:positions',
    'view:all_attendance',
    'manage:attendance',
    'approve:leave',
    'reject:leave',
    'view:leaves',
    'view:benefits',
    'view:payroll',
    'create:performance_review',
    'view:performance_reviews',
    'assign:training',
    'view:trainings',
  ],
  
  Employee: [
    'employee:view',
    'view:own_employee_profile',
    'update:own_profile',
    'view:own_attendance',
    'clock:in_out',
    'request:leave',
    'view:own_leaves',
    'view:own_benefits',
    'view:own_payroll',
    'view:own_performance_reviews',
    'view:assigned_trainings',
  ],
  
  BookingAdmin: [
    'admin:view',
    'manage:locations',
    'manage:service_categories',
    'manage:services',
    'manage:staff_profiles',
    'manage:booking_rules',
    'view:all_bookings',
    'create:booking_for_others',
    'update:any_booking',
    'cancel:any_booking',
    'assign:staff_to_service',
    'assign:staff_to_location',
    'update:any_staff_schedule',
  ],
  
  Agent: [
    'agent:view',
    'view:own_staff_profile',
    'update:own_staff_schedule',
    'view:assigned_bookings',
    'update:assigned_bookings',
    'create:booking_for_others',
  ],
  
  Customer: [
    'customer:view',
    'create:own_booking',
    'view:own_bookings',
    'update:own_booking',
    'cancel:own_booking',
    'view:available_services',
    'view:available_slots',
    'view:own_orders',
    'create:order',
    'view:cart',
    'update:cart',
    'view:public_products',
    'view:product_details',
  ],
  
  StoreAdmin: [
    'admin:view',
    'list:shops',
    'view:shop_details',
    'create:shop',
    'update:shop',
    'delete:shop',
    'list:products',
    'view:any_product',
    'create:product',
    'update:any_product',
    'delete:any_product',
    'manage:product_categories',
    'view:taxes',
    'manage:taxes',
    'list:orders',
    'view:any_order',
    'update:any_order',
    'delete:order',
    'manage:payment_settings',
    'view:payments',
    'manage:payments',
    'manage:customers',
    'view:customer_details',
    'manage:discounts',
    'manage:currencies',
    'view:shipping_zones',
    'manage:shipping_zones',
  ],
  
  StoreManager: [
    'manager:view',
    'list:shops',
    'view:shop_details',
    'list:products',
    'view:any_product',
    'create:product',
    'update:any_product',
    'manage:product_categories',
    'list:orders',
    'view:any_order',
    'update:any_order',
    'view:payments',
    'manage:customers',
    'manage:discounts',
  ],
  
  FinanceManager: [
    'manager:view',
    'view:financial_reports',
    'generate:financial_reports',
    'manage:billing',
    'create:invoice',
    'update:invoice',
    'view:payments',
    'manage:payments',
    'manage:taxes',
    'view:tax_reports',
    'manage:currencies',
    'view:revenue_analytics',
  ],
  
  SalesRep: [
    'sales:view',
    'view:customers',
    'create:customer',
    'update:customer',
    'view:leads',
    'create:lead',
    'update:lead',
    'view:opportunities',
    'create:opportunity',
    'update:opportunity',
    'view:sales_reports',
    'track:sales_performance',
  ],
  
  Instructor: [
    'instructor:view',
    'view:courses',
    'create:course',
    'update:own_course',
    'view:students',
    'manage:course_enrollment',
    'create:lesson',
    'update:lesson',
    'delete:own_lesson',
    'grade:assignments',
    'view:student_progress',
  ],
  
  ProjectLead: [
    'project:view',
    'view:projects',
    'create:project',
    'update:project',
    'view:tasks',
    'create:task',
    'update:task',
    'assign:task',
    'view:team_members',
    'assign:team_members',
    'view:project_reports',
    'track:project_progress',
  ],
};

// GraphQL query para obtener permisos específicos del usuario
const GET_USER_SPECIFIC_PERMISSIONS = gql`
  query GetUserSpecificPermissions($userId: ID!) {
    userSpecificPermissions(userId: $userId) {
      id
      permissionName
      granted
      userId
    }
  }
`;

interface UserPermission {
  id: string;
  permissionName: string;
  granted: boolean;
  userId: string;
}

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: RoleName) => boolean;
  userPermissions: string[];
  userSpecificPermissions: UserPermission[];
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [roleBasedPermissions, setRoleBasedPermissions] = useState<string[]>([]);
  const [userSpecificPermissions, setUserSpecificPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Función para cargar permisos específicos del usuario desde GraphQL
  const loadUserSpecificPermissions = async (): Promise<UserPermission[]> => {
    if (!user?.id) return [];
    
    try {
      const { data } = await client.query({
        query: GET_USER_SPECIFIC_PERMISSIONS,
        variables: { userId: user.id },
        fetchPolicy: 'network-only',
      });
      
      return data.userSpecificPermissions || [];
    } catch (error) {
      console.error('Error loading user specific permissions:', error);
      return [];
    }
  };

  // Función para refrescar los permisos (útil después de actualizarlos)
  const refreshPermissions = async () => {
    setIsLoading(true);
    await loadPermissions();
    setIsLoading(false);
  };

  // Cargar permisos del usuario
  const loadPermissions = async () => {
    setIsLoading(true);
    
    if (isAuthenticated && user?.role) {
      // 1. Obtener permisos basados en el rol
      const roleName = user.role.name as RoleName;
      console.log('Loading permissions for role:', roleName);
      
      const permissionsFromRole = roleName in rolePermissions 
        ? rolePermissions[roleName] 
        : rolePermissions.Employee;
      
      console.log('Permissions for role:', permissionsFromRole);
      setRoleBasedPermissions(permissionsFromRole);
      
      // 2. Obtener permisos específicos del usuario
      const userPermissions = await loadUserSpecificPermissions();
      setUserSpecificPermissions(userPermissions);
    } else {
      console.log('No auth or role information available, clearing permissions');
      setRoleBasedPermissions([]);
      setUserSpecificPermissions([]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadPermissions();
  }, [isAuthenticated, user]);

  // Calcula los permisos efectivos combinando permisos de rol y específicos de usuario
  const getEffectivePermissions = (): string[] => {
    if (!isAuthenticated) return [];
    
    // Comenzar con permisos basados en rol
    const effectivePermissions = new Set(roleBasedPermissions);
    
    // Aplicar permisos específicos del usuario (tienen prioridad)
    userSpecificPermissions.forEach((permission) => {
      if (permission.granted) {
        // Agregar permisos explícitamente concedidos
        effectivePermissions.add(permission.permissionName);
      } else {
        // Eliminar permisos explícitamente denegados
        effectivePermissions.delete(permission.permissionName);
      }
    });
    
    return Array.from(effectivePermissions);
  };

  // Verifica si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated) {
      console.log('hasPermission check failed - user not authenticated');
      return false;
    }
    
    const effectivePermissions = getEffectivePermissions();
    const hasPermission = effectivePermissions.includes(permission);
    
    console.log('hasPermission check:', {
      permission,
      effectivePermissions,
      hasPermission
    });
    
    return hasPermission;
  };

  // Verifica si el usuario tiene al menos uno de los permisos listados
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated) return false;
    const effectivePermissions = getEffectivePermissions();
    return permissions.some(permission => effectivePermissions.includes(permission));
  };

  // Verifica si el usuario tiene todos los permisos listados
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated) return false;
    const effectivePermissions = getEffectivePermissions();
    return permissions.every(permission => effectivePermissions.includes(permission));
  };

  // Verifica si el usuario tiene un rol específico
  const hasRole = (role: RoleName): boolean => {
    if (!isAuthenticated || !user || !user.role) {
      console.log('hasRole check failed - user not authenticated or missing role info');
      return false;
    }
    
    // Obtener el nombre del rol del usuario y el rol a verificar
    const userRoleName = user.role.name;
    const roleName = role;
    
    console.log('hasRole check:', {
      userRole: user.role,
      userRoleName,
      roleName,
      isMatch: userRoleName === roleName
    });
    
    // Verificación especial para SuperAdmin
    if (roleName === 'SuperAdmin') {
      return userRoleName === 'SuperAdmin';
    }
    
    return userRoleName === roleName;
  };

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        userPermissions: getEffectivePermissions(),
        userSpecificPermissions,
        isLoading,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error('usePermission debe usarse dentro de un PermissionProvider');
  }
  
  return context;
} 