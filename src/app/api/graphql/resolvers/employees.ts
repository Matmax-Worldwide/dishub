import { prisma } from '@/lib/prisma';
import { EmployeeStatus} from '@prisma/client';
import { GraphQLContext } from '../route';

// TypeScript interfaces for employee mutations
interface CreateEmployeeInput {
  userId: string;
  departmentId: string;
  positionId: string;
  employeeId: string;
  hireDate: string;
  managerId?: string;
  salary?: string | number;
  status?: EmployeeStatus;
}

interface UpdateEmployeeInput {
  userId?: string;
  departmentId?: string;
  positionId?: string;
  employeeId?: string;
  hireDate?: string;
  managerId?: string;
  salary?: string | number;
  status?: EmployeeStatus;
}

export const employeeResolvers = {
  Query: {
    // Obtener todos los empleados - auth handled by shield
    employees: async () => {
      try {
        // Manual auth & role checks removed
        
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
        // Consider re-throwing a generic error or a GraphQLError
        throw new Error('Failed to fetch employees.');
      }
    },
    
    // Obtener un empleado específico por ID - auth handled by shield
    employee: async (_parent: unknown, args: { id: string }) => {
      try {
        // Manual auth & role/ownership checks removed
        
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
          throw new Error('Employee not found'); // Or GraphQLError
        }
        
        return employee;
      } catch (error) {
        console.error('Get employee error:', error);
        throw new Error('Failed to fetch employee details.');
      }
    },
    
    // Obtener empleados por departamento - auth handled by shield
    employeesByDepartment: async (_parent: unknown, args: { departmentId: string }, ) => {
      try {
        // Manual auth & role checks removed
        
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
        throw new Error('Failed to fetch employees by department.');
      }
    },
    
    // Obtener todos los departamentos - auth handled by shield
    departments: async () => {
      try {
        // Manual auth checks removed
        
        const departments = await prisma.department.findMany({
          orderBy: {
            name: 'asc'
          }
        });
        
        return departments;
      } catch (error) {
        console.error('Get departments error:', error);
        throw new Error('Failed to fetch departments.');
      }
    },
    
    // Obtener todas las posiciones/cargos - auth handled by shield
    positions: async () => {
      try {
        // Manual auth checks removed
        
        const positions = await prisma.position.findMany({
          orderBy: {
            title: 'asc'
          }
        });
        
        return positions;
      } catch (error) {
        console.error('Get positions error:', error);
        throw new Error('Failed to fetch positions.');
      }
    }
  },
  
  Mutation: {
    // Crear un nuevo empleado - auth handled by shield
    createEmployee: async (_parent: unknown, args: { input: CreateEmployeeInput }, context: GraphQLContext) => {
      try {
        // Manual auth & role checks removed
        
        const { userId, departmentId, positionId, employeeId, hireDate, managerId, salary, ...otherData } = args.input;
        
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) throw new Error('User not found for employee creation.');
        
        const departmentExists = await prisma.department.findUnique({ where: { id: departmentId } });
        if (!departmentExists) throw new Error('Department not found for employee creation.');
        
        const positionExists = await prisma.position.findUnique({ where: { id: positionId } });
        if (!positionExists) throw new Error('Position not found for employee creation.');
        
        if (managerId) {
          const managerExists = await prisma.employee.findUnique({ where: { id: managerId } });
          if (!managerExists) throw new Error('Manager not found for employee creation.');
        }
        
        const employee = await prisma.employee.create({
          data: {
            userId,
            employeeId, // This is the custom employee ID string
            departmentId,
            positionId,
            tenantId: context.tenantId || '',
            hireDate: new Date(hireDate),
            managerId,
            salary: salary ? parseFloat(salary.toString()) : 0,
            status: 'ACTIVE' as EmployeeStatus, // Default status
            ...otherData // Any other fields passed in input
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
        // Consider specific error messages for known issues, or a generic one
        throw new Error(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Actualizar datos de un empleado - auth handled by shield
      updateEmployee: async (_parent: unknown, args: { id: string, input: UpdateEmployeeInput }) => {
        try {
        // Manual auth & role checks removed
        
        const employeeExists = await prisma.employee.findUnique({ where: { id: args.id } });
        if (!employeeExists) throw new Error('Employee not found for update.');
        
        // Ensure userId is not part of the update input if it's not allowed to change
        const { userId, salary, hireDate, ...updateData } = args.input;
        if (userId && userId !== employeeExists.userId) {
            throw new Error("Cannot change the associated user (userId) of an employee.");
        }

        const processedUpdateData = {
          ...updateData,
          ...(salary !== undefined && { salary: parseFloat(salary.toString()) }),
          ...(hireDate && { hireDate: new Date(hireDate) })
        };

        const employee = await prisma.employee.update({
          where: { id: args.id },
          data: processedUpdateData,
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
        throw new Error(`Failed to update employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Asignar un empleado a un departamento - auth handled by shield
      assignEmployeeToDepartment: async (_parent: unknown, args: { employeeId: string, departmentId: string }) => {
      try {
        // Manual auth & role checks removed
        
        const employeeExists = await prisma.employee.findUnique({ where: { id: args.employeeId } });
        if (!employeeExists) throw new Error('Employee not found for department assignment.');
        
        const departmentExists = await prisma.department.findUnique({ where: { id: args.departmentId } });
        if (!departmentExists) throw new Error('Department not found for assignment.');
        
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
        throw new Error(`Failed to assign employee to department: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};

export default employeeResolvers;

