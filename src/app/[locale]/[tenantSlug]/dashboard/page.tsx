'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useEffect } from 'react';

export default function TenantDashboard() {
  const params = useParams();
  const { user, isLoading } = useAuth();
  const { hasRole } = usePermission();

  // Check if user has access to this tenant dashboard
  useEffect(() => {
    if (!isLoading) {
      const hasAccess = hasRole('SuperAdmin') || hasRole('TenantAdmin') || hasRole('TenantManager') || hasRole('Employee');
      
      if (!hasAccess) {
        // Redirect unauthorized users to login
        window.location.href = `/${params.locale}/login`;
        return;
      }
    }
  }, [isLoading, hasRole, params.locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Determine user role for display
  const getUserRoleDisplay = () => {
    if (hasRole('SuperAdmin')) return 'SuperAdmin';
    if (hasRole('TenantAdmin')) return 'TenantAdmin';
    if (hasRole('TenantManager')) return 'TenantManager';
    if (hasRole('Employee')) return 'Employee';
    return 'Usuario';
  };

  const getUserRoleColor = () => {
    if (hasRole('SuperAdmin')) return 'bg-red-100 text-red-800';
    if (hasRole('TenantAdmin')) return 'bg-purple-100 text-purple-800';
    if (hasRole('TenantManager')) return 'bg-blue-100 text-blue-800';
    if (hasRole('Employee')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏢 Dashboard de {params.tenantSlug}
              </h1>
              <p className="mt-1 text-gray-600">
                Bienvenido al panel de administración de <span className="font-semibold text-indigo-600">{params.tenantSlug}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm rounded-full ${getUserRoleColor()}`}>
                {getUserRoleDisplay()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-specific welcome section */}
        <div className="mb-8">
          {hasRole('SuperAdmin') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-900">Super Administrador</h3>
                  <p className="text-red-700">Tienes acceso completo a todos los tenants y funcionalidades de la plataforma</p>
                </div>
              </div>
            </div>
          )}

          {hasRole('TenantAdmin') && !hasRole('SuperAdmin') && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👑</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-purple-900">Administrador de Tenant</h3>
                  <p className="text-purple-700">Tienes acceso completo a todas las funcionalidades del tenant</p>
                </div>
              </div>
            </div>
          )}

          {hasRole('TenantManager') && !hasRole('SuperAdmin') && !hasRole('TenantAdmin') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍💼</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900">Gerente de Tenant</h3>
                  <p className="text-blue-700">Tienes permisos de gestión y supervisión del tenant</p>
                </div>
              </div>
            </div>
          )}

          {hasRole('Employee') && !hasRole('SuperAdmin') && !hasRole('TenantAdmin') && !hasRole('TenantManager') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍💻</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-900">Empleado</h3>
                  <p className="text-green-700">Tienes acceso a funcionalidades específicas del empleado</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick access cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🧩</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Gestión de Módulos</h3>
                <p className="text-gray-600">Administra los módulos activos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
                <p className="text-gray-600">Controla usuarios y permisos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración</h3>
                <p className="text-gray-600">Perfil y branding del tenant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats or content area */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Tenant</h4>
              <p className="text-lg font-semibold text-gray-900">{params.tenantSlug}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Rol</h4>
              <p className="text-lg font-semibold text-gray-900">{getUserRoleDisplay()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Usuario</h4>
              <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Ruta</h4>
              <p className="text-sm text-gray-600 font-mono">/{params.locale}/{params.tenantSlug}/dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 