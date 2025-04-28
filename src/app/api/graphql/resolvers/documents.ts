import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Correct enum types
type DocumentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

// Define interfaces for document input types
interface DocumentCreateInput {
  title: string;
  description?: string;
  fileUrl?: string;
  status?: DocumentStatus;
}

interface DocumentUpdateInput {
  title?: string;
  description?: string;
  fileUrl?: string;
  status?: DocumentStatus;
}

export const documentResolvers = {
  Query: {
    documents: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const documents = await prisma.document.findMany({
          where: { userId: decoded.userId },
          orderBy: { updatedAt: 'desc' },
          include: {
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
        
        return documents;
      } catch (error) {
        console.error('Get documents error:', error);
        throw error;
      }
    },
    
    document: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const document = await prisma.document.findUnique({
          where: { 
            id,
            userId: decoded.userId
          },
          include: {
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
        
        if (!document) {
          throw new Error('Document not found');
        }
        
        return document;
      } catch (error) {
        console.error('Get document error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createDocument: async (_parent: unknown, { input }: { input: DocumentCreateInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const document = await prisma.document.create({
          data: {
            title: input.title,
            description: input.description || '',
            fileUrl: input.fileUrl || '',
            status: input.status || 'DRAFT',
            userId: decoded.userId
          },
          include: {
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
        
        return document;
      } catch (error) {
        console.error('Create document error:', error);
        throw error;
      }
    },
    
    updateDocument: async (_parent: unknown, { id, input }: { id: string, input: DocumentUpdateInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the document exists and belongs to the user
        const existingDocument = await prisma.document.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingDocument) {
          throw new Error('Document not found or you do not have permission to update it');
        }
        
        const updateData: Partial<{
          title: string;
          description: string;
          fileUrl: string;
          status: DocumentStatus;
        }> = {};
        
        // Only update fields that are provided
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.fileUrl !== undefined) updateData.fileUrl = input.fileUrl;
        if (input.status !== undefined) updateData.status = input.status;
        
        const updatedDocument = await prisma.document.update({
          where: { id },
          data: updateData,
          include: {
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
        
        return updatedDocument;
      } catch (error) {
        console.error('Update document error:', error);
        throw error;
      }
    },
    
    deleteDocument: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the document exists and belongs to the user
        const existingDocument = await prisma.document.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingDocument) {
          throw new Error('Document not found or you do not have permission to delete it');
        }
        
        await prisma.document.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete document error:', error);
        return false;
      }
    }
  }
}; 