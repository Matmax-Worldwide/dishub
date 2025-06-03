// import { NextRequest } from 'next/server'; // No longer needed
// import { verifyToken } from '@/lib/auth'; // No longer needed
import { prisma } from '@/lib/prisma';
import { Context } from '@/app/api/graphql/types'; // Import main Context
import { GraphQLError } from 'graphql'; // For throwing resolver errors

// Define input types (preserved)
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
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  clientId?: string;
}

export const appointmentResolvers = {
  Query: {
    appointments: async (_parent: unknown, _args: unknown, context: Context) => {
      // Auth handled by shield. context.user is expected if rule passes.
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const appointments = await prisma.appointment.findMany({
          where: { userId: context.user.id }, // Use context.user.id
          orderBy: { startTime: 'asc' },
          include: {
            client: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        });
        return appointments;
      } catch (dbError) {
        console.error('Database error in appointments query:', dbError);
        throw new GraphQLError('Failed to fetch appointments');
      }
    },
    
    appointment: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { 
            id,
            userId: context.user.id // Ensure user owns the appointment
          },
          include: {
            client: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        });
        if (!appointment) {
          throw new GraphQLError('Appointment not found or access denied');
        }
        return appointment;
      } catch (error) {
        console.error('Get appointment error:', error);
        throw new GraphQLError('Failed to fetch appointment');
      }
    },
    
    upcomingAppointments: async (_parent: unknown, { count = 5 }: { count?: number }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const now = new Date();
        const appointments = await prisma.appointment.findMany({
          where: { 
            userId: context.user.id, // Use context.user.id
            startTime: { gte: now }
          },
          orderBy: { startTime: 'asc' },
          take: count,
          include: {
            client: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        });
        return appointments;
      } catch (error) {
        console.error('Get upcoming appointments error:', error);
        throw new GraphQLError('Failed to fetch upcoming appointments');
      }
    }
  },
  
  Mutation: {
    createAppointment: async (_parent: unknown, { input }: { input: CreateAppointmentInput }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        if (input.clientId) {
          const client = await prisma.client.findUnique({ where: { id: input.clientId } });
          if (!client) throw new GraphQLError('The specified client does not exist');
        }
        const startTime = new Date(input.startTime);
        const endTime = new Date(input.endTime);
        if (startTime >= endTime) throw new GraphQLError('Start time must be before end time');
        
        const appointment = await prisma.appointment.create({
          data: {
            title: input.title,
            description: input.description || '',
            startTime: startTime,
            endTime: endTime,
            location: input.location || '',
            isVirtual: input.isVirtual || false,
            meetingUrl: input.meetingUrl || '',
            clientId: input.clientId || null,
            userId: context.user.id // Use context.user.id
          },
          include: {
            client: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        });
        return appointment;
      } catch (error) {
        console.error('Create appointment error:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to create appointment');
      }
    },
    
    updateAppointment: async (_parent: unknown, { id, input }: { id: string, input: UpdateAppointmentInput }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const existingAppointment = await prisma.appointment.findUnique({
          where: { id, userId: context.user.id } // Ensure user owns the appointment
        });
        if (!existingAppointment) {
          throw new GraphQLError('Appointment not found or you do not have permission to update it');
        }
        if (input.clientId) {
          const client = await prisma.client.findUnique({ where: { id: input.clientId } });
          if (!client) throw new GraphQLError('The specified client does not exist');
        }
        
        const updateData: Partial<UpdateAppointmentInput> & { startTime?: Date, endTime?: Date } = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.location !== undefined) updateData.location = input.location;
        if (input.clientId !== undefined) updateData.clientId = input.clientId;
        if (input.isVirtual !== undefined) updateData.isVirtual = input.isVirtual;
        if (input.meetingUrl !== undefined) updateData.meetingUrl = input.meetingUrl;
        if (input.startTime !== undefined) updateData.startTime = new Date(input.startTime);
        if (input.endTime !== undefined) updateData.endTime = new Date(input.endTime);

        if (updateData.startTime && updateData.endTime && updateData.startTime >= updateData.endTime) {
          throw new GraphQLError('Start time must be before end time');
        } else if (updateData.startTime && !updateData.endTime && updateData.startTime >= existingAppointment.endTime) {
          throw new GraphQLError('Start time must be before existing end time');
        } else if (!updateData.startTime && updateData.endTime && existingAppointment.startTime >= updateData.endTime) {
          throw new GraphQLError('Existing start time must be before new end time');
        }
        
        const updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: updateData,
          include: {
            client: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        });
        return updatedAppointment;
      } catch (error) {
        console.error('Update appointment error:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to update appointment');
      }
    },
    
    deleteAppointment: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id, userId: context.user.id } // Ensure user owns the appointment
        });
        if (!appointment) {
          throw new GraphQLError('Appointment not found or you do not have permission to delete it');
        }
        await prisma.appointment.delete({ where: { id } });
        return true;
      } catch (error) {
        console.error('Delete appointment error:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to delete appointment');
      }
    }
  }
};
