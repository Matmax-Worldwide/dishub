import { prisma } from '@/lib/prisma';

interface ContactFormSubmissionInput {
  firstName: string;
  lastName: string;
  email: string;
}

interface ContactFormSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}

// Contact form resolvers
export const contactResolvers = {
  Mutation: {
    createContactFormSubmission: async (_parent: unknown, args: { input: ContactFormSubmissionInput }) => {
      const { firstName, lastName, email } = args.input;

      try {
        const submission = await prisma.contactFormSubmission.create({
          data: {
            firstName,
            lastName,
            email,
          },
        });
        
        return {
          id: submission.id,
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
          createdAt: submission.createdAt.toISOString(),
        };
      } catch (error) {
        console.error('Error creating contact form submission:', error);
        throw new Error('Failed to submit contact form');
      }
    },
  },
  
  Query: {
    // For admin use if needed in the future
    contactFormSubmissions: async () => {
      // This could be protected by authentication in the future
      try {
        const submissions = await prisma.contactFormSubmission.findMany({
          orderBy: { createdAt: 'desc' },
        });
        
        return submissions.map((submission: ContactFormSubmission) => ({
          id: submission.id,
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
          createdAt: submission.createdAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching contact form submissions:', error);
        return [];
      }
    },
  },
}; 