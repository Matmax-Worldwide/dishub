'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldIcon, 
  UsersIcon,
  PlusIcon,
  EditIcon,
  CheckIcon,
} from 'lucide-react';

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState('roles');

  const roles = [
    {
      id: 1,
      name: 'TenantAdmin',
      description: 'Full administrative access to tenant',
      userCount: 1,
      permissions: ['admin:all', 'users:all', 'modules:all', 'billing:all'],
      color: 'purple'
    },
    {
      id: 2,
      name: 'TenantManager',
      description: 'Management access with limited admin functions',
      userCount: 2,
      permissions: ['users:read', 'users:edit', 'modules:read', 'reports:all'],
      color: 'blue'
    },
    {
      id: 3,
      name: 'Employee',
      description: 'Basic user access',
      userCount: 3,
      permissions: ['profile:edit', 'reports:read'],
      color: 'green'
    }
  ];

  const permissions = [
    { category: 'Administration', items: ['admin:view', 'admin:edit', 'admin:delete'] },
    { category: 'User Management', items: ['users:read', 'users:create', 'users:edit', 'users:delete'] },
    { category: 'Module Management', items: ['modules:read', 'modules:configure', 'modules:request'] },
    { category: 'Reports', items: ['reports:read', 'reports:create', 'reports:export'] },
    { category: 'Billing', items: ['billing:read', 'billing:edit'] },
  ];

  const getRoleColor = (color: string) => {
    const variants = {
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200'
    };
    return variants[color as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage user roles and their permissions</p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="assignments">User Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldIcon className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <Badge className={getRoleColor(role.color)}>
                      {role.userCount} users
                    </Badge>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Permissions</Label>
                    <div className="mt-2 space-y-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <div key={permission} className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-3 w-3 text-green-500 mr-2" />
                          {permission}
                        </div>
                      ))}
                      {role.permissions.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{role.permissions.length - 3} more permissions
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Categories</CardTitle>
              <CardDescription>Available permissions organized by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {permissions.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{category.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.items.map((permission) => (
                        <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">{permission}</span>
                          <Badge variant="secondary" className="text-xs">
                            Permission
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>Assign roles to users and manage permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Role Management</h3>
                <p className="text-gray-600">Assign and manage user roles and permissions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 