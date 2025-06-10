'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, CreditCard, Settings, UserCheck } from 'lucide-react';

interface ProtectedOperation {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'payments' | 'settings' | 'roles';
  riskLevel: 'high' | 'critical';
}

const protectedOperations: ProtectedOperation[] = [
  // Eliminar usuarios y tenants
  {
    id: 'deleteUser',
    name: 'Eliminar Usuario',
    description: 'Eliminar permanentemente un usuario del sistema',
    category: 'users',
    riskLevel: 'critical'
  },
  {
    id: 'deleteTenant',
    name: 'Eliminar Tenant',
    description: 'Eliminar permanentemente un tenant y todos sus datos',
    category: 'users',
    riskLevel: 'critical'
  },
  
  // Modificar proveedores de pago
  {
    id: 'createPaymentProvider',
    name: 'Crear Proveedor de Pago',
    description: 'Añadir un nuevo proveedor de pago al sistema',
    category: 'payments',
    riskLevel: 'high'
  },
  {
    id: 'updatePaymentProvider',
    name: 'Actualizar Proveedor de Pago',
    description: 'Modificar configuración de proveedores de pago existentes',
    category: 'payments',
    riskLevel: 'high'
  },
  {
    id: 'deletePaymentProvider',
    name: 'Eliminar Proveedor de Pago',
    description: 'Remover un proveedor de pago del sistema',
    category: 'payments',
    riskLevel: 'critical'
  },
  
  // Actualizar configuraciones críticas
  {
    id: 'updateSiteSettings',
    name: 'Actualizar Configuración del Sitio',
    description: 'Modificar configuraciones globales del sistema',
    category: 'settings',
    riskLevel: 'critical'
  },
  
  // Gestionar permisos y roles
  {
    id: 'createRole',
    name: 'Crear Rol',
    description: 'Crear un nuevo rol en el sistema',
    category: 'roles',
    riskLevel: 'high'
  },
  {
    id: 'updateRole',
    name: 'Actualizar Rol',
    description: 'Modificar permisos y configuración de roles existentes',
    category: 'roles',
    riskLevel: 'high'
  },
  {
    id: 'deleteRole',
    name: 'Eliminar Rol',
    description: 'Eliminar un rol del sistema',
    category: 'roles',
    riskLevel: 'critical'
  },
  {
    id: 'assignPermissionToRole',
    name: 'Asignar Permisos',
    description: 'Asignar nuevos permisos a un rol',
    category: 'roles',
    riskLevel: 'high'
  },
  {
    id: 'removePermissionFromRole',
    name: 'Remover Permisos',
    description: 'Quitar permisos de un rol',
    category: 'roles',
    riskLevel: 'high'
  }
];

const categoryConfig = {
  users: {
    icon: Users,
    title: 'Usuarios y Tenants',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Operaciones que afectan usuarios y organizaciones'
  },
  payments: {
    icon: CreditCard,
    title: 'Proveedores de Pago',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Gestión de sistemas de pago y facturación'
  },
  settings: {
    icon: Settings,
    title: 'Configuraciones Críticas',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Configuraciones que afectan todo el sistema'
  },
  roles: {
    icon: UserCheck,
    title: 'Permisos y Roles',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Control de acceso y autorización'
  }
};

const riskLevelConfig = {
  high: {
    label: 'Alto Riesgo',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  critical: {
    label: 'Riesgo Crítico',
    color: 'bg-red-100 text-red-800 border-red-300'
  }
};

export function ProtectedOperations() {
  const groupedOperations = protectedOperations.reduce((acc, operation) => {
    if (!acc[operation.category]) {
      acc[operation.category] = [];
    }
    acc[operation.category].push(operation);
    return acc;
  }, {} as Record<string, ProtectedOperation[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Operaciones Protegidas con MetaMask
          </CardTitle>
          <CardDescription>
            Estas operaciones requieren aprobación adicional mediante firma digital con MetaMask
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(groupedOperations).map(([category, operations]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        const IconComponent = config.icon;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                {config.title}
              </CardTitle>
              <CardDescription>
                {config.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {operations.map((operation) => (
                  <div
                    key={operation.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">
                        {operation.name}
                      </h4>
                      <Badge 
                        variant="outline"
                        className={riskLevelConfig[operation.riskLevel].color}
                      >
                        {riskLevelConfig[operation.riskLevel].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {operation.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3 w-3" />
                      <span>Requiere firma MetaMask</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-1">
                ¿Por qué MetaMask?
              </h4>
              <p className="text-sm text-orange-800 mb-3">
                MetaMask proporciona una capa adicional de seguridad mediante firmas criptográficas 
                que garantizan que solo usuarios autorizados puedan ejecutar operaciones críticas.
              </p>
              <ul className="text-xs text-orange-700 space-y-1">
                <li>• <strong>Autenticación fuerte:</strong> Firma digital inmutable</li>
                <li>• <strong>Auditoría completa:</strong> Registro de todas las operaciones</li>
                <li>• <strong>Prevención de fraude:</strong> Imposible falsificar firmas</li>
                <li>• <strong>Control granular:</strong> Aprobación por operación</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProtectedOperations; 