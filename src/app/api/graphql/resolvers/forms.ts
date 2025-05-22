import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { SubmissionStatus, FormFieldType } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Define interfaces for the input types
interface FormInput {
  title: string;
  description?: string;
  slug: string;
  isMultiStep?: boolean;
  isActive?: boolean;
  successMessage?: string;
  redirectUrl?: string;
  submitButtonText?: string;
  submitButtonStyle?: string;
  layout?: string;
  styling?: Prisma.InputJsonValue;
  pageId?: string;
}

interface FormStepInput {
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible?: boolean;
  validationRules?: Prisma.InputJsonValue;
}

interface FormFieldInput {
  formId?: string;
  stepId?: string;
  label: string;
  name: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  isRequired?: boolean;
  order: number;
  options?: Prisma.InputJsonValue;
  validationRules?: Prisma.InputJsonValue;
  styling?: Prisma.InputJsonValue;
  width?: number;
}

interface FormSubmissionInput {
  formId: string;
  data: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

interface FormParent {
  id: string;
  fields?: FormField[];
  steps?: FormStep[];
  submissions?: FormSubmission[];
  pageId?: string;
}

interface FormStep {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible: boolean;
  validationRules?: Prisma.JsonValue;
}

interface FormField {
  id: string;
  formId?: string;
  stepId?: string;
  label: string;
  name: string;
  type: FormFieldType;
}

interface FormSubmission {
  id: string;
  formId: string;
  data: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
  status?: SubmissionStatus;
}

interface FormStepParent {
  id: string;
  formId: string;
  form?: FormParent;
  fields?: FormField[];
}

interface FormFieldParent {
  id: string;
  formId?: string;
  stepId?: string;
}

interface FormSubmissionParent {
  id: string;
  formId: string;
  form?: FormParent;
}

export const formResolvers = {
  Query: {
    // Get all forms
    forms: async () => {
      try {
        // Make forms publicly accessible for editors
        return prisma.form.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        console.error('Error fetching forms:', error);
        throw error;
      }
    },
    
    // Get a single form by ID
    form: async (_parent: unknown, args: { id: string }) => {
      try {
        // Allow public access to forms for viewing/submission
       

        
        return prisma.form.findUnique({
          where: { id: args.id },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
            steps: {
              orderBy: { order: 'asc' },
              include: {
                fields: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching form:', error);
        throw error;
      }
    },
    
    // Get a single form by slug
    formBySlug: async (_parent: unknown, args: { slug: string }) => {
      try {
        
        
        return prisma.form.findUnique({
          where: { slug: args.slug },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
            steps: {
              orderBy: { order: 'asc' },
              include: {
                fields: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching form by slug:', error);
        throw error;
      }
    },
    
    // Get form steps for a form
    formSteps: async (_parent: unknown, args: { formId: string }) => {
      try {
        // Make this public - no authentication check
        return prisma.formStep.findMany({
          where: { formId: args.formId },
          orderBy: { order: 'asc' },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching form steps:', error);
        throw error;
      }
    },
    
    // Get a single form step
    formStep: async (_parent: unknown, args: { id: string }) => {
      try {
        // Make this public - no authentication check
        return prisma.formStep.findUnique({
          where: { id: args.id },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching form step:', error);
        throw error;
      }
    },
    
    // Get form fields for a form or step
    formFields: async (_parent: unknown, args: { formId: string, stepId?: string }) => {
      try {
        // Make this public - no authentication check
        const where = args.stepId 
          ? { stepId: args.stepId }
          : { formId: args.formId };
        
        return prisma.formField.findMany({
          where,
          orderBy: { order: 'asc' },
        });
      } catch (error) {
        console.error('Error fetching form fields:', error);
        throw error;
      }
    },
    
    // Get a single form field
    formField: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.formField.findUnique({
          where: { id: args.id },
        });
      } catch (error) {
        console.error('Error fetching form field:', error);
        throw error;
      }
    },
    
    // Get form submissions
    formSubmissions: async (_parent: unknown, args: { formId: string, limit?: number, offset?: number }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.formSubmission.findMany({
          where: { formId: args.formId },
          orderBy: { createdAt: 'desc' },
          skip: args.offset || 0,
          take: args.limit || 20,
        });
      } catch (error) {
        console.error('Error fetching form submissions:', error);
        throw error;
      }
    },
    
    // Get a single form submission
    formSubmission: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.formSubmission.findUnique({
          where: { id: args.id },
        });
      } catch (error) {
        console.error('Error fetching form submission:', error);
        throw error;
      }
    },
    
    // Get form submission statistics
    formSubmissionStats: async (_parent: unknown, args: { formId: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const totalCount = await prisma.formSubmission.count({
          where: { formId: args.formId },
        });
        
        const statusCounts = await prisma.formSubmission.groupBy({
          by: ['status'],
          where: { formId: args.formId },
          _count: true,
        });
        
        const last30DaysCount = await prisma.formSubmission.count({
          where: { 
            formId: args.formId,
            createdAt: { 
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            },
          },
        });
        
        return {
          totalCount,
          statusCounts: statusCounts.map((item: { status: string; _count: number }) => ({
            status: item.status,
            count: item._count,
          })),
          last30DaysCount,
        };
      } catch (error) {
        console.error('Error fetching form submission stats:', error);
        throw error;
      }
    },
  },
  
  Mutation: {
    // Create a new form
    createForm: async (_parent: unknown, args: { input: FormInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const form = await prisma.form.create({
          data: {
            ...args.input,
            createdById: decoded.userId,
          },
        });
        
        return {
          success: true,
          message: 'Form created successfully',
          form,
        };
      } catch (error) {
        console.error('Error creating form:', error);
        return {
          success: false,
          message: `Error creating form: ${error instanceof Error ? error.message : 'Unknown error'}`,
          form: null,
        };
      }
    },
    
    // Update a form
    updateForm: async (_parent: unknown, args: { id: string, input: FormInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const form = await prisma.form.update({
          where: { id: args.id },
          data: {
            ...args.input,
            updatedById: decoded.userId,
          },
        });
        
        return {
          success: true,
          message: 'Form updated successfully',
          form,
        };
      } catch (error) {
        console.error('Error updating form:', error);
        return {
          success: false,
          message: `Error updating form: ${error instanceof Error ? error.message : 'Unknown error'}`,
          form: null,
        };
      }
    },
    
    // Delete a form
    deleteForm: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        await prisma.form.delete({
          where: { id: args.id },
        });
        
        return {
          success: true,
          message: 'Form deleted successfully',
          form: null,
        };
      } catch (error) {
        console.error('Error deleting form:', error);
        return {
          success: false,
          message: `Error deleting form: ${error instanceof Error ? error.message : 'Unknown error'}`,
          form: null,
        };
      }
    },
    
    // Create a form step
    createFormStep: async (_parent: unknown, args: { input: FormStepInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const step = await prisma.formStep.create({
          data: args.input,
        });
        
        return {
          success: true,
          message: 'Form step created successfully',
          step,
        };
      } catch (error) {
        console.error('Error creating form step:', error);
        return {
          success: false,
          message: `Error creating form step: ${error instanceof Error ? error.message : 'Unknown error'}`,
          step: null,
        };
      }
    },
    
    // Update a form step
    updateFormStep: async (_parent: unknown, args: { id: string, input: FormStepInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const step = await prisma.formStep.update({
          where: { id: args.id },
          data: args.input,
        });
        
        return {
          success: true,
          message: 'Form step updated successfully',
          step,
        };
      } catch (error) {
        console.error('Error updating form step:', error);
        return {
          success: false,
          message: `Error updating form step: ${error instanceof Error ? error.message : 'Unknown error'}`,
          step: null,
        };
      }
    },
    
    // Delete a form step
    deleteFormStep: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        await prisma.formStep.delete({
          where: { id: args.id },
        });
        
        return {
          success: true,
          message: 'Form step deleted successfully',
          step: null,
        };
      } catch (error) {
        console.error('Error deleting form step:', error);
        return {
          success: false,
          message: `Error deleting form step: ${error instanceof Error ? error.message : 'Unknown error'}`,
          step: null,
        };
      }
    },
    
    // Create a form field
    createFormField: async (_parent: unknown, args: { input: FormFieldInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Make sure we have either formId or stepId
        if (!args.input.formId && !args.input.stepId) {
          return {
            success: false,
            message: 'Either formId or stepId is required',
            field: null,
          };
        }
        
        const field = await prisma.formField.create({
          data: args.input,
        });
        
        return {
          success: true,
          message: 'Form field created successfully',
          field,
        };
      } catch (error) {
        console.error('Error creating form field:', error);
        return {
          success: false,
          message: `Error creating form field: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: null,
        };
      }
    },
    
    // Update a form field
    updateFormField: async (_parent: unknown, args: { id: string, input: FormFieldInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const field = await prisma.formField.update({
          where: { id: args.id },
          data: args.input,
        });
        
        return {
          success: true,
          message: 'Form field updated successfully',
          field,
        };
      } catch (error) {
        console.error('Error updating form field:', error);
        return {
          success: false,
          message: `Error updating form field: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: null,
        };
      }
    },
    
    // Delete a form field
    deleteFormField: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        await prisma.formField.delete({
          where: { id: args.id },
        });
        
        return {
          success: true,
          message: 'Form field deleted successfully',
          field: null,
        };
      } catch (error) {
        console.error('Error deleting form field:', error);
        return {
          success: false,
          message: `Error deleting form field: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: null,
        };
      }
    },
    
    // Submit a form
    submitForm: async (_parent: unknown, args: { input: FormSubmissionInput }) => {
      try {
        const form = await prisma.form.findUnique({
          where: { id: args.input.formId },
        });
        
        if (!form) {
          return {
            success: false,
            message: 'Form not found',
            submission: null,
          };
        }
        
        if (!form.isActive) {
          return {
            success: false,
            message: 'This form is no longer accepting submissions',
            submission: null,
          };
        }
        
        // Check if this is a guest submission and mark it as such
        const metadata = args.input.metadata || {};
        if (metadata && typeof metadata === 'object' && (metadata as { isGuestSubmission?: boolean }).isGuestSubmission) {
          (metadata as Record<string, string | boolean | number>).submissionType = 'guest';
        }
        
        const submission = await prisma.formSubmission.create({
          data: {
            formId: args.input.formId,
            data: args.input.data,
            metadata: metadata,
          },
        });
        
        return {
          success: true,
          message: 'Form submission successful',
          submission,
        };
      } catch (error) {
        console.error('Error submitting form:', error);
        return {
          success: false,
          message: `Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`,
          submission: null,
        };
      }
    },
    
    // Update form submission status
    updateFormSubmissionStatus: async (_parent: unknown, args: { id: string, status: SubmissionStatus }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        const submission = await prisma.formSubmission.update({
          where: { id: args.id },
          data: { status: args.status },
        });
        
        return {
          success: true,
          message: 'Form submission status updated successfully',
          submission,
        };
      } catch (error) {
        console.error('Error updating form submission status:', error);
        return {
          success: false,
          message: `Error updating form submission status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          submission: null,
        };
      }
    },
    
    // Delete a form submission
    deleteFormSubmission: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        await prisma.formSubmission.delete({
          where: { id: args.id },
        });
        
        return {
          success: true,
          message: 'Form submission deleted successfully',
          submission: null,
        };
      } catch (error) {
        console.error('Error deleting form submission:', error);
        return {
          success: false,
          message: `Error deleting form submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
          submission: null,
        };
      }
    },
    
    // Update multiple form field orders at once
    updateFieldOrders: async (_parent: unknown, args: { updates: Array<{ id: string; order: number }> }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Process updates in a transaction to ensure consistency
        const results = await prisma.$transaction(
          args.updates.map(update => 
            prisma.formField.update({
              where: { id: update.id },
              data: { order: update.order },
            })
          )
        );
        
        return {
          success: true,
          message: `Successfully updated orders for ${results.length} fields`,
        };
      } catch (error) {
        console.error('Error updating form field orders:', error);
        return {
          success: false,
          message: `Error updating form field orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  },
  
  // Type resolvers
  Form: {
    fields: (parent: FormParent) => {
      if (parent.fields) {
        return parent.fields;
      }
      return prisma.formField.findMany({
        where: { formId: parent.id },
        orderBy: { order: 'asc' },
      });
    },
    steps: (parent: FormParent) => {
      if (parent.steps) {
        return parent.steps;
      }
      return prisma.formStep.findMany({
        where: { formId: parent.id },
        orderBy: { order: 'asc' },
      });
    },
    submissions: (parent: FormParent) => {
      if (parent.submissions) {
        return parent.submissions;
      }
      return prisma.formSubmission.findMany({
        where: { formId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    page: (parent: FormParent) => {
      if (parent.pageId) {
        return prisma.page.findUnique({
          where: { id: parent.pageId },
        });
      }
      return null;
    },
  },
  
  FormStep: {
    form: (parent: FormStepParent) => {
      if (parent.form) {
        return parent.form;
      }
      return prisma.form.findUnique({
        where: { id: parent.formId },
      });
    },
    fields: (parent: FormStepParent) => {
      if (parent.fields) {
        return parent.fields;
      }
      return prisma.formField.findMany({
        where: { stepId: parent.id },
        orderBy: { order: 'asc' },
      });
    },
  },
  
  FormField: {
    form: (parent: FormFieldParent) => {
      if (parent.formId) {
        return prisma.form.findUnique({
          where: { id: parent.formId },
        });
      }
      return null;
    },
    step: (parent: FormFieldParent) => {
      if (parent.stepId) {
        return prisma.formStep.findUnique({
          where: { id: parent.stepId },
        });
      }
      return null;
    },
  },
  
  FormSubmission: {
    form: (parent: FormSubmissionParent) => {
      if (parent.form) {
        return parent.form;
      }
      return prisma.form.findUnique({
        where: { id: parent.formId },
      });
    },
  },
}; 