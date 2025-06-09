'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useEffect } from 'react';

export default function TenantRootPage() {
  const params = useParams();
  const { user, isLoading } = useAuth();
  const { hasRole } = usePermission();

  // Check if user has access and redirect appropriately
  useEffect(() => {
    if (!isLoading && user) {
      // If user is Employee, they should access this page
      if (hasRole('Employee')) {
        // Stay on this page - it's correct for Employee role
        return;
      }
      
      // If TenantAdmin or TenantManager, redirect to dashboard
      if (hasRole('TenantAdmin') || hasRole('TenantManager')) {
        window.location.href = `/${params.locale}/${params.tenantSlug}/dashboard`;
        return;
      }
      
      // For any other role, redirect to general dashboard
      window.location.href = `/${params.locale}/${params.tenantSlug}/dashboard`;
    }
  }, [isLoading, user, hasRole, params.locale, params.tenantSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                👨‍💻 Portal del Empleado
              </h1>
              <p className="mt-1 text-gray-600">
                Bienvenido al portal de empleado de <span className="font-semibold text-indigo-600">{params.tenantSlug}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                Employee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👨‍💻</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-900">Portal del Empleado</h3>
                <p className="text-green-700">Accede a tus herramientas y funcionalidades como empleado</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick access cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏰</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Mi Horario</h3>
                <p className="text-gray-600">Consulta tus horarios y asignaciones</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Mis Tareas</h3>
                <p className="text-gray-600">Gestiona tus tareas y proyectos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Mi Perfil</h3>
                <p className="text-gray-600">Actualiza tu información personal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee info */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Empleado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Tenant</h4>
              <p className="text-lg font-semibold text-gray-900">{params.tenantSlug}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Rol</h4>
              <p className="text-lg font-semibold text-gray-900">Employee</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Usuario</h4>
              <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Ruta</h4>
              <p className="text-sm text-gray-600 font-mono">/{params.locale}/{params.tenantSlug}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 