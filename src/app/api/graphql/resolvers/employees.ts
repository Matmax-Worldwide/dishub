import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const employeeResolvers = {
  Query: {
    // Obtener todos los empleados - solo para admin y managers
    employees: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Verificar si es admin o manager
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        // Solo permitir a admin y manager acceder a la lista de empleados
        if (user?.role?.name !== 'ADMIN' && user?.role?.name !== 'MANAGER') {
          throw new Error('Unauthorized: Only admin and managers can view all employees');
        }
        
        // Obtener empleados con sus relaciones
        const employees = await prisma.employee.findMany({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            department: true,
            position: true,
            manager: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: {
            hireDate: 'desc'
          }
        });
        
        return employees;
      } catch (error) {
        console.error('Get employees error:', error);
        throw error;
      }
    },
    
    // Obtener un empleado específico por ID
    employee: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Verificar si es admin, manager o el propio empleado
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            role: {
              select: {
                name: true
              }
            },
            employee: {
              select: {
                id: true
              }
            }
          }
        });
        
        const isAdmin = user?.role?.name === 'ADMIN';
        const isManager = user?.role?.name === 'MANAGER';
        const isOwnProfile = user?.employee?.id === args.id;
        
        if (!isAdmin && !isManager && !isOwnProfile) {
          throw new Error('Unauthorized: You can only view your own profile or you need manager/admin permissions');
        }
        
        // Obtener el empleado con toda la información relacionada
        const employee = await prisma.employee.findUnique({
          where: { id: args.id },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true
              }
            },
            department: true,
            position: true,
            manager: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            subordinates: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            attendances: {
              take: 10,
              orderBy: {
                date: 'desc'
              }
            },
            leaves: {
              take: 10,
              orderBy: {
                createdAt: 'desc'
              }
            },
            benefits: {
              include: {
                benefit: true
              }
            },
            documents: true,
            trainings: {
              include: {
                training: true
              }
            }
          }
        });
        
        if (!employee) {
          throw new Error('Employee not found');
        }
        
        return employee;
      } catch (error) {
        console.error('Get employee error:', error);
        throw error;
      }
    },
    
    // Obtener empleados por departamento
    employeesByDepartment: async (_parent: unknown, args: { departmentId: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Verificar si es admin o manager
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN' && user?.role?.name !== 'MANAGER') {
          throw new Error('Unauthorized: Only admin and managers can view department employees');
        }
        
        // Buscar empleados por departamento
        const employees = await prisma.employee.findMany({
          where: {
            departmentId: args.departmentId
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            position: true,
            manager: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: {
            user: {
              firstName: 'asc'
            }
          }
        });
        
        return employees;
      } catch (error) {
        console.error('Get employees by department error:', error);
        throw error;
      }
    },
    
    // Obtener todos los departamentos
    departments: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Obtener todos los departamentos
        const departments = await prisma.department.findMany({
          orderBy: {
            name: 'asc'
          }
        });
        
        return departments;
      } catch (error) {
        console.error('Get departments error:', error);
        throw error;
      }
    },
    
    // Obtener todas las posiciones/cargos
    positions: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Obtener todas las posiciones
        const positions = await prisma.position.findMany({
          orderBy: {
            title: 'asc'
          }
        });
        
        return positions;
      } catch (error) {
        console.error('Get positions error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    // Crear un nuevo empleado
    createEmployee: async (_parent: unknown, args: { input: any }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Verificar si es admin
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN' && user?.role?.name !== 'MANAGER') {
          throw new Error('Unauthorized: Only admin and managers can create employees');
        }
        
        const { userId, departmentId, positionId, employeeId, hireDate, managerId, salary, ...otherData } = args.input;
        
        // Verificar que el usuario exista
        const userExists = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!userExists) {
          throw new Error('User not found');
        }
        
        // Verificar que el departamento exista
        const departmentExists = await prisma.department.findUnique({
          where: { id: departmentId }
        });
        
        if (!departmentExists) {
          throw new Error('Department not found');
        }
        
        // Verificar que la posición exista
        const positionExists = await prisma.position.findUnique({
          where: { id: positionId }
        });
        
        if (!positionExists) {
          throw new Error('Position not found');
        }
        
        // Verificar que el manager exista si se proporciona
        if (managerId) {
          const managerExists = await prisma.employee.findUnique({
            where: { id: managerId }
          });
          
          if (!managerExists) {
            throw new Error('Manager not found');
          }
        }
        
        // Crear el nuevo empleado
        const employee = await prisma.employee.create({
          data: {
            userId,
            employeeId,
            departmentId,
            positionId,
            hireDate: new Date(hireDate),
            managerId,
            salary,
            status: 'ACTIVE',
            ...otherData
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            department: true,
            position: true
          }
        });
        
        return employee;
      } catch (error) {
        console.error('Create employee error:', error);
        throw error;
      }
    },
    
    // Actualizar datos de un empleado
    updateEmployee: async (_parent: unknown, args: { id: string, input: any }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Verificar si es admin o manager
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN' && user?.role?.name !== 'MANAGER') {
          throw new Error('Unauthorized: Only admin and managers can update employees');
        }
        
        // Verificar que el empleado exista
        const employeeExists = await prisma.employee.findUnique({
          where: { id: args.id }
        });
        
        if (!employeeExists) {
          throw new Error('Employee not found');
        }
        
        // Actualizar el empleado
        const employee = await prisma.employee.update({
          where: { id: args.id },
          data: args.input,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            department: true,
            position: true
          }
        });
        
        return employee;
      } catch (error) {
        console.error('Update employee error:', error);
        throw error;
      }
    },
    
    // Asignar un empleado a un departamento
    assignEmployeeToDepartment: async (_parent: unknown, args: { employeeId: string, departmentId: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Verificar si es admin o manager
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN' && user?.role?.name !== 'MANAGER') {
          throw new Error('Unauthorized: Only admin and managers can assign departments');
        }
        
        // Verificar que el empleado exista
        const employeeExists = await prisma.employee.findUnique({
          where: { id: args.employeeId }
        });
        
        if (!employeeExists) {
          throw new Error('Employee not found');
        }
        
        // Verificar que el departamento exista
        const departmentExists = await prisma.department.findUnique({
          where: { id: args.departmentId }
        });
        
        if (!departmentExists) {
          throw new Error('Department not found');
        }
        
        // Actualizar el departamento del empleado
        const employee = await prisma.employee.update({
          where: { id: args.employeeId },
          data: {
            departmentId: args.departmentId
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            department: true,
            position: true
          }
        });
        
        return employee;
      } catch (error) {
        console.error('Assign employee to department error:', error);
        throw error;
      }
    }
  }
};

export default employeeResolvers; 