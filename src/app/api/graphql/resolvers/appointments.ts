import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types
interface CreateAppointmentInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  clientId?: string;
}

interface UpdateAppointmentInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  clientId?: string;
}

export const appointmentResolvers = {
  Query: {
    appointments: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        try {
          if (!prisma || !prisma.appointment) {
            console.error('Prisma client or appointment model is not available');
            return []; // Return empty array instead of throwing an error
          }
          
          const appointments = await prisma.appointment.findMany({
            where: { userId: decoded.userId },
            orderBy: { startTime: 'asc' },
            include: {
              client: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });
          
          return appointments;
        } catch (dbError) {
          console.error('Database error in appointments query:', dbError);
          return []; // Return empty array on database error
        }
      } catch (error) {
        console.error('Get appointments error:', error);
        // Return empty array instead of throwing error
        return [];
      }
    },
    
    appointment: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const appointment = await prisma.appointment.findUnique({
          where: { 
            id,
            userId: decoded.userId
          },
          include: {
            client: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        return appointment;
      } catch (error) {
        console.error('Get appointment error:', error);
        throw error;
      }
    },
    
    upcomingAppointments: async (_parent: unknown, { count = 5 }: { count?: number }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const now = new Date();
        
        const appointments = await prisma.appointment.findMany({
          where: { 
            userId: decoded.userId,
            startTime: { gte: now }
          },
          orderBy: { startTime: 'asc' },
          take: count,
          include: {
            client: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        
        return appointments;
      } catch (error) {
        console.error('Get upcoming appointments error:', error);
        return []; // Return empty array instead of throwing
      }
    }
  },
  
  Mutation: {
    createAppointment: async (_parent: unknown, { input }: { input: CreateAppointmentInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // If a client is specified, ensure it exists
        if (input.clientId) {
          const client = await prisma.client.findUnique({
            where: { id: input.clientId }
          });
          
          if (!client) {
            throw new Error('The specified client does not exist');
          }
        }
        
        // Validate that start time is before end time
        const startTime = new Date(input.startTime);
        const endTime = new Date(input.endTime);
        
        if (startTime >= endTime) {
          throw new Error('Start time must be before end time');
        }
        
        const appointment = await prisma.appointment.create({
          data: {
            title: input.title,
            description: input.description || '',
            startTime: input.startTime,
            endTime: input.endTime,
            location: input.location || '',
            isVirtual: input.isVirtual || false,
            meetingUrl: input.meetingUrl || '',
            clientId: input.clientId || null,
            userId: decoded.userId
          },
          include: {
            client: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        
        return appointment;
      } catch (error) {
        console.error('Create appointment error:', error);
        throw error;
      }
    },
    
    updateAppointment: async (_parent: unknown, { id, input }: { id: string, input: UpdateAppointmentInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the appointment exists and belongs to the user
        const existingAppointment = await prisma.appointment.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingAppointment) {
          throw new Error('Appointment not found or you do not have permission to update it');
        }
        
        // If a client is specified, ensure it exists
        if (input.clientId) {
          const client = await prisma.client.findUnique({
            where: { id: input.clientId }
          });
          
          if (!client) {
            throw new Error('The specified client does not exist');
          }
        }
        
        const updateData: Record<string, unknown> = {};
        
        // Only update fields that are provided
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.location !== undefined) updateData.location = input.location;
        if (input.clientId !== undefined) updateData.clientId = input.clientId;
        if (input.isVirtual !== undefined) updateData.isVirtual = input.isVirtual;
        if (input.meetingUrl !== undefined) updateData.meetingUrl = input.meetingUrl;
        
        // Validate and update time if provided
        if (input.startTime !== undefined) updateData.startTime = input.startTime;
        if (input.endTime !== undefined) updateData.endTime = input.endTime;
        
        // If both times are provided, ensure start is before end
        if (input.startTime && input.endTime) {
          const startTime = new Date(input.startTime);
          const endTime = new Date(input.endTime);
          
          if (startTime >= endTime) {
            throw new Error('Start time must be before end time');
          }
        }
        
        const updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: updateData,
          include: {
            client: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        
        return updatedAppointment;
      } catch (error) {
        console.error('Update appointment error:', error);
        throw error;
      }
    },
    
    deleteAppointment: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Ensure the appointment exists and belongs to the user
        const appointment = await prisma.appointment.findUnique({
          where: {
            id,
            userId: decoded.userId
          }
        });
        
        if (!appointment) {
          throw new Error('Appointment not found or you do not have permission to delete it');
        }
        
        await prisma.appointment.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete appointment error:', error);
        throw error;
      }
    }
  }
}; 