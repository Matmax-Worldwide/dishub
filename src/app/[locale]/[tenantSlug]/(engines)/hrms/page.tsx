'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UsersIcon,
  UserPlusIcon,
  CalendarIcon,
  DollarSignIcon,
  ClipboardListIcon,
  TrendingUpIcon,
  HomeIcon,
  SettingsIcon,
  AlertCircleIcon
} from 'lucide-react';
import Link from 'next/link';

export default function HRMSEngine() {
  const params = useParams();
  const locale = params.locale as string;
  const tenantSlug = params.tenantSlug as string;

  const hrmsModules = [
    {
      title: 'Gestión de Empleados',
      description: 'Administra la información y perfiles de empleados',
      icon: UsersIcon,
      href: `/${locale}/${tenantSlug}/hrms/employees`,
      color: 'blue',
      stats: '12 empleados activos'
    },
    {
      title: 'Departamentos',
      description: 'Organiza y gestiona departamentos y equipos',
      icon: HomeIcon,
      href: `/${locale}/${tenantSlug}/hrms/departments`,
      color: 'green',
      stats: '5 departamentos'
    },
    {
      title: 'Nómina',
      description: 'Procesamiento y gestión de nóminas',
      icon: DollarSignIcon,
      href: `/${locale}/${tenantSlug}/hrms/payroll`,
      color: 'yellow',
      stats: 'Próximo: 15 dic'
    },
    {
      title: 'Asistencia',
      description: 'Control de horarios y asistencia',
      icon: CalendarIcon,
      href: `/${locale}/${tenantSlug}/hrms/attendance`,
      color: 'purple',
      stats: '98% asistencia'
    },
    {
      title: 'Evaluaciones',
      description: 'Sistema de evaluación de desempeño',
      icon: ClipboardListIcon,
      href: `/${locale}/${tenantSlug}/hrms/evaluations`,
      color: 'indigo',
      stats: '8 pendientes'
    },
    {
      title: 'Reportes',
      description: 'Análisis y reportes de recursos humanos',
      icon: TrendingUpIcon,
      href: `/${locale}/${tenantSlug}/hrms/reports`,
      color: 'pink',
      stats: '15 reportes'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            HRMS Engine
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema de Gestión de Recursos Humanos para {tenantSlug}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/${tenantSlug}/hrms/settings`}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Configuración
            </Link>
          </Button>
        </div>
      </div>

      {/* Notice - Sistema en desarrollo */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircleIcon className="h-5 w-5 text-amber-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Sistema en Desarrollo</h3>
            <p className="text-sm text-amber-700 mt-1">
              El módulo HRMS está actualmente en desarrollo. Algunas funcionalidades pueden no estar disponibles.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departamentos</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Asistencia Hoy</p>
                <p className="text-2xl font-bold text-gray-900">11/12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nómina Mensual</p>
                <p className="text-2xl font-bold text-gray-900">€45,600</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Modules */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Módulos HRMS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hrmsModules.map((module) => (
            <Card key={module.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${getColorClasses(module.color)}`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm text-gray-500">{module.stats}</span>
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline" className="w-full">
                  <Link href={module.href}>
                    Acceder
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas actividades en el sistema HRMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nuevo empleado registrado</p>
                <p className="text-xs text-gray-500">María González - Departamento de Marketing</p>
              </div>
              <span className="text-xs text-gray-500">Hace 2 horas</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nómina procesada</p>
                <p className="text-xs text-gray-500">Nómina de noviembre completada</p>
              </div>
              <span className="text-xs text-gray-500">Ayer</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Evaluación pendiente</p>
                <p className="text-xs text-gray-500">Juan Pérez - Evaluación trimestral</p>
              </div>
              <span className="text-xs text-gray-500">Hace 3 días</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 