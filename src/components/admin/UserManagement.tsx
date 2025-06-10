'use client';

import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useMetaMaskApproval } from '@/components/auth/MetaMaskApproval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// GraphQL mutation for deleting a user with MetaMask signature
const DELETE_USER_MUTATION = gql`
  mutation DeleteUser(
    $id: ID!
    $metaMaskSignature: String!
    $operationType: String!
    $operationData: String!
  ) {
    deleteUser(
      id: $id
      metaMaskSignature: $metaMaskSignature
      operationType: $operationType
      operationData: $operationData
    ) {
      success
      message
    }
  }
`;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    name: string;
  };
  isActive: boolean;
}

interface UserManagementProps {
  users: User[];
  onUserDeleted: (userId: string) => void;
}

export function UserManagement({ users, onUserDeleted }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const { requestApproval, ApprovalModal } = useMetaMaskApproval();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteUserMutation] = useMutation(DELETE_USER_MUTATION, {
    onCompleted: (data) => {
      if (data.deleteUser.success) {
        onUserDeleted(selectedUser!.id);
        setSelectedUser(null);
        setIsDeleting(false);
      }
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      setIsDeleting(false);
    }
  });

  const handleDeleteUser = async (user: User) => {
    setSelectedUser(user);
    setIsDeleting(true);

    try {
      // Prepare operation data
      const operationData = {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        timestamp: Date.now(),
        requestedBy: currentUser?.id
      };

      // Request MetaMask approval
      const signature = await requestApproval(
        'deleteUser',
        operationData,
        `Eliminar usuario: ${user.firstName} ${user.lastName} (${user.email})`
      );

      // Execute the mutation with the signature
      await deleteUserMutation({
        variables: {
          id: user.id,
          metaMaskSignature: signature,
          operationType: 'deleteUser',
          operationData: JSON.stringify(operationData)
        }
      });

    } catch (error) {
      console.error('Error in delete process:', error);
      setIsDeleting(false);
      setSelectedUser(null);
    }
  };

  const canDeleteUser = (user: User) => {
    // Don't allow deleting yourself
    if (user.id === currentUser?.id) return false;
    
    // Only admins can delete users
    const adminRoles = ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin'];
    return adminRoles.includes(currentUser?.role?.name || '');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Gestión de Usuarios con MetaMask
          </CardTitle>
          <CardDescription>
            Las operaciones críticas como eliminar usuarios requieren aprobación con MetaMask
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Seguridad mejorada:</strong> Las operaciones de eliminación requieren 
              firma digital con MetaMask para prevenir acciones no autorizadas.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-semibold">
                        {user.firstName} {user.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Rol: {user.role.name} | 
                        Estado: {user.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canDeleteUser(user) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={isDeleting && selectedUser?.id === user.id}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting && selectedUser?.id === user.id ? (
                        'Eliminando...'
                      ) : (
                        'Eliminar'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-gray-400"
                    >
                      No disponible
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay usuarios para mostrar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MetaMask Approval Modal */}
      <ApprovalModal />
    </div>
  );
}

// Example of how to use this component
export function UserManagementExample() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: { name: 'TenantUser' },
      isActive: true
    },
    {
      id: '2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: { name: 'TenantManager' },
      isActive: true
    }
  ]);

  const handleUserDeleted = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Panel de Administración - Usuarios
      </h1>
      <UserManagement 
        users={users} 
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
} 