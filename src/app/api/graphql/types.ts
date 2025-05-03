import { NextRequest } from 'next/server';

// Definición de los tipos de usuario y sesión
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: string;
  };
  permissions?: string[];
}

export interface Session {
  user: User;
}

// Contexto para los resolvers de GraphQL
export interface Context {
  req: NextRequest;
  session?: Session;
}

// Tipo para permisos específicos de usuario
export interface UserPermission {
  id: string;
  userId: string;
  permissionName: string;
  granted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para roles
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo para permisos
export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
} 