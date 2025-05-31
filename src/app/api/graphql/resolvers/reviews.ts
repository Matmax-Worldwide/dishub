import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types
interface CreateReviewInput {
  productId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title?: string;
  comment?: string;
  orderItemId?: string;
  images?: Array<{
    imageUrl: string;
    altText?: string;
    order?: number;
  }>;
}

interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
  isApproved?: boolean;
  isReported?: boolean;
  reportReason?: string;
}

interface CreateReviewResponseInput {
  reviewId: string;
  response: string;
}

interface UpdateReviewResponseInput {
  response: string;
}

interface ReviewFilterInput {
  search?: string;
  productId?: string;
  customerId?: string;
  rating?: number;
  isVerified?: boolean;
  isApproved?: boolean;
  isReported?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

interface PaginationInput {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

interface ReviewWhereInput {
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    comment?: { contains: string; mode: 'insensitive' };
    customerName?: { contains: string; mode: 'insensitive' };
    customerEmail?: { contains: string; mode: 'insensitive' };
  }>;
  productId?: string;
  customerId?: string;
  rating?: number;
  isVerified?: boolean;
  isApproved?: boolean;
  isReported?: boolean;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export const reviewResolvers = {
  Query: {
    reviews: async (_parent: unknown, { filter, pagination }: { filter?: ReviewFilterInput; pagination?: PaginationInput }) => {
      const where: ReviewWhereInput = {};
      
      if (filter) {
        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { comment: { contains: filter.search, mode: 'insensitive' } },
            { customerName: { contains: filter.search, mode: 'insensitive' } },
            { customerEmail: { contains: filter.search, mode: 'insensitive' } }
          ];
        }
        if (filter.productId) where.productId = filter.productId;
        if (filter.customerId) where.customerId = filter.customerId;
        if (filter.rating) where.rating = filter.rating;
        if (filter.isVerified !== undefined) where.isVerified = filter.isVerified;
        if (filter.isApproved !== undefined) where.isApproved = filter.isApproved;
        if (filter.isReported !== undefined) where.isReported = filter.isReported;
        if (filter.dateFrom || filter.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
          if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
        }
      }

      const limit = pagination?.limit || pagination?.pageSize || 20;
      const offset = pagination?.offset || (pagination?.page ? (pagination.page - 1) * limit : 0);

      return await prisma.review.findMany({
        where,
        include: {
          product: true,
          customer: true,
          orderItem: true,
          images: {
            orderBy: { order: 'asc' }
          },
          response: {
            include: {
              responder: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    },

    review: async (_parent: unknown, { id }: { id: string }) => {
      return await prisma.review.findUnique({
        where: { id },
        include: {
          product: true,
          customer: true,
          orderItem: true,
          images: {
            orderBy: { order: 'asc' }
          },
          response: {
            include: {
              responder: true
            }
          }
        }
      });
    },

    reviewsByProduct: async (_parent: unknown, { productId, filter, pagination }: { productId: string; filter?: ReviewFilterInput; pagination?: PaginationInput }) => {
      const where: ReviewWhereInput = { productId };
      
      if (filter) {
        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { comment: { contains: filter.search, mode: 'insensitive' } },
            { customerName: { contains: filter.search, mode: 'insensitive' } }
          ];
        }
        if (filter.customerId) where.customerId = filter.customerId;
        if (filter.rating) where.rating = filter.rating;
        if (filter.isVerified !== undefined) where.isVerified = filter.isVerified;
        if (filter.isApproved !== undefined) where.isApproved = filter.isApproved;
        if (filter.isReported !== undefined) where.isReported = filter.isReported;
        if (filter.dateFrom || filter.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
          if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
        }
      }

      const limit = pagination?.limit || pagination?.pageSize || 20;
      const offset = pagination?.offset || (pagination?.page ? (pagination.page - 1) * limit : 0);

      return await prisma.review.findMany({
        where,
        include: {
          product: true,
          customer: true,
          orderItem: true,
          images: {
            orderBy: { order: 'asc' }
          },
          response: {
            include: {
              responder: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    },

    reviewsByCustomer: async (_parent: unknown, { customerId, filter, pagination }: { customerId: string; filter?: ReviewFilterInput; pagination?: PaginationInput }) => {
      const where: ReviewWhereInput = { customerId };
      
      if (filter) {
        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { comment: { contains: filter.search, mode: 'insensitive' } }
          ];
        }
        if (filter.productId) where.productId = filter.productId;
        if (filter.rating) where.rating = filter.rating;
        if (filter.isVerified !== undefined) where.isVerified = filter.isVerified;
        if (filter.isApproved !== undefined) where.isApproved = filter.isApproved;
        if (filter.isReported !== undefined) where.isReported = filter.isReported;
        if (filter.dateFrom || filter.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
          if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
        }
      }

      const limit = pagination?.limit || pagination?.pageSize || 20;
      const offset = pagination?.offset || (pagination?.page ? (pagination.page - 1) * limit : 0);

      return await prisma.review.findMany({
        where,
        include: {
          product: true,
          customer: true,
          orderItem: true,
          images: {
            orderBy: { order: 'asc' }
          },
          response: {
            include: {
              responder: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    },

    reviewStats: async (_parent: unknown, { productId }: { productId?: string }) => {
      const where = productId ? { productId } : {};

      const [totalReviews, averageRating, ratingDistribution, verifiedReviews, pendingReviews] = await Promise.all([
        prisma.review.count({ where }),
        prisma.review.aggregate({
          where,
          _avg: { rating: true }
        }),
        prisma.review.groupBy({
          by: ['rating'],
          where,
          _count: { rating: true }
        }),
        prisma.review.count({ where: { ...where, isVerified: true } }),
        prisma.review.count({ where: { ...where, isApproved: false } })
      ]);

      return {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution: ratingDistribution.map((item: { rating: number; _count: { rating: number } }) => ({
          rating: item.rating,
          count: item._count.rating
        })),
        verifiedReviews,
        pendingReviews
      };
    },

    pendingReviews: async (_parent: unknown, { pagination }: { pagination?: PaginationInput }) => {
      const limit = pagination?.limit || pagination?.pageSize || 20;
      const offset = pagination?.offset || (pagination?.page ? (pagination.page - 1) * limit : 0);

      return await prisma.review.findMany({
        where: { isApproved: false },
        include: {
          product: true,
          customer: true,
          orderItem: true,
          images: {
            orderBy: { order: 'asc' }
          },
          response: {
            include: {
              responder: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    }
  },

  Mutation: {
    createReview: async (_parent: unknown, { input }: { input: CreateReviewInput }, context: { req: NextRequest }) => {
      try {
        // Verify if customer is authenticated (optional for guest reviews)
        let userId: string | null = null;
        try {
          const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
          if (token) {
            const decoded = await verifyToken(token);
            if (decoded && typeof decoded.userId === 'string') {
              userId = decoded.userId;
            }
          }
        } catch {
          // Guest review - continue without authentication
        }

        // Validate rating
        if (input.rating < 1 || input.rating > 5) {
          return {
            success: false,
            message: 'Rating must be between 1 and 5',
            review: null
          };
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
          where: { id: input.productId }
        });

        if (!product) {
          return {
            success: false,
            message: 'Product not found',
            review: null
          };
        }

        // Check if order item exists and belongs to customer (for verified reviews)
        let isVerified = false;
        if (input.orderItemId) {
          const orderItem = await prisma.orderItem.findUnique({
            where: { id: input.orderItemId },
            include: { order: true }
          });

          if (orderItem && orderItem.productId === input.productId) {
            if (userId && orderItem.order.customerId === userId) {
              isVerified = true;
            } else if (!userId && orderItem.order.customerEmail === input.customerEmail) {
              isVerified = true;
            }
          }
        }

        // Create review
        const review = await prisma.review.create({
          data: {
            productId: input.productId,
            customerId: userId || input.customerId,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            rating: input.rating,
            title: input.title,
            comment: input.comment,
            isVerified,
            orderItemId: input.orderItemId,
            images: input.images ? {
              create: input.images.map((image, index) => ({
                imageUrl: image.imageUrl,
                altText: image.altText,
                order: image.order || index
              }))
            } : undefined
          },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Review created successfully',
          review
        };
      } catch (error) {
        console.error('Error creating review:', error);
        return {
          success: false,
          message: 'Failed to create review',
          review: null
        };
      }
    },

    updateReview: async (_parent: unknown, { id, input }: { id: string; input: UpdateReviewInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            review: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            review: null
          };
        }

        // Check if review exists
        const existingReview = await prisma.review.findUnique({
          where: { id }
        });

        if (!existingReview) {
          return {
            success: false,
            message: 'Review not found',
            review: null
          };
        }

        // Check permissions (customer can only edit their own reviews, admin can edit any)
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        const isOwner = existingReview.customerId === decoded.userId;

        if (!isAdmin && !isOwner) {
          return {
            success: false,
            message: 'Permission denied',
            review: null
          };
        }

        // Validate rating if provided
        if (input.rating && (input.rating < 1 || input.rating > 5)) {
          return {
            success: false,
            message: 'Rating must be between 1 and 5',
            review: null
          };
        }

        // Update review
        const review = await prisma.review.update({
          where: { id },
          data: {
            ...(input.rating && { rating: input.rating }),
            ...(input.title !== undefined && { title: input.title }),
            ...(input.comment !== undefined && { comment: input.comment }),
            ...(input.isApproved !== undefined && isAdmin && { isApproved: input.isApproved }),
            ...(input.isReported !== undefined && isAdmin && { isReported: input.isReported }),
            ...(input.reportReason !== undefined && isAdmin && { reportReason: input.reportReason })
          },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Review updated successfully',
          review
        };
      } catch (error) {
        console.error('Error updating review:', error);
        return {
          success: false,
          message: 'Failed to update review',
          review: null
        };
      }
    },

    deleteReview: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            review: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            review: null
          };
        }

        // Check if review exists
        const existingReview = await prisma.review.findUnique({
          where: { id }
        });

        if (!existingReview) {
          return {
            success: false,
            message: 'Review not found',
            review: null
          };
        }

        // Check permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        const isOwner = existingReview.customerId === decoded.userId;

        if (!isAdmin && !isOwner) {
          return {
            success: false,
            message: 'Permission denied',
            review: null
          };
        }

        // Delete review (cascade will delete images and response)
        await prisma.review.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Review deleted successfully',
          review: null
        };
      } catch (error) {
        console.error('Error deleting review:', error);
        return {
          success: false,
          message: 'Failed to delete review',
          review: null
        };
      }
    },

    approveReview: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            review: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            review: null
          };
        }

        // Check admin permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        if (!isAdmin) {
          return {
            success: false,
            message: 'Admin access required',
            review: null
          };
        }

        const review = await prisma.review.update({
          where: { id },
          data: { isApproved: true },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Review approved successfully',
          review
        };
      } catch (error) {
        console.error('Error approving review:', error);
        return {
          success: false,
          message: 'Failed to approve review',
          review: null
        };
      }
    },

    rejectReview: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            review: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            review: null
          };
        }

        // Check admin permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        if (!isAdmin) {
          return {
            success: false,
            message: 'Admin access required',
            review: null
          };
        }

        const review = await prisma.review.update({
          where: { id },
          data: { isApproved: false },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Review rejected successfully',
          review
        };
      } catch (error) {
        console.error('Error rejecting review:', error);
        return {
          success: false,
          message: 'Failed to reject review',
          review: null
        };
      }
    },

    reportReview: async (_parent: unknown, { id, reason }: { id: string; reason: string }) => {
      try {
        const review = await prisma.review.update({
          where: { id },
          data: { 
            isReported: true,
            reportReason: reason
          },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Review reported successfully',
          review
        };
      } catch (error) {
        console.error('Error reporting review:', error);
        return {
          success: false,
          message: 'Failed to report review',
          review: null
        };
      }
    },

    markReviewHelpful: async (_parent: unknown, { id }: { id: string }) => {
      try {
        const review = await prisma.review.update({
          where: { id },
          data: { 
            isHelpful: {
              increment: 1
            }
          },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Review marked as helpful',
          review
        };
      } catch (error) {
        console.error('Error marking review as helpful:', error);
        return {
          success: false,
          message: 'Failed to mark review as helpful',
          review: null
        };
      }
    },

    createReviewResponse: async (_parent: unknown, { input }: { input: CreateReviewResponseInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            response: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            response: null
          };
        }

        // Check admin permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        if (!isAdmin) {
          return {
            success: false,
            message: 'Admin access required',
            response: null
          };
        }

        // Check if review exists
        const review = await prisma.review.findUnique({
          where: { id: input.reviewId }
        });

        if (!review) {
          return {
            success: false,
            message: 'Review not found',
            response: null
          };
        }

        // Check if response already exists
        const existingResponse = await prisma.reviewResponse.findUnique({
          where: { reviewId: input.reviewId }
        });

        if (existingResponse) {
          return {
            success: false,
            message: 'Review already has a response',
            response: null
          };
        }

        const response = await prisma.reviewResponse.create({
          data: {
            reviewId: input.reviewId,
            responderId: decoded.userId,
            response: input.response
          },
          include: {
            review: true,
            responder: true
          }
        });

        return {
          success: true,
          message: 'Review response created successfully',
          response
        };
      } catch (error) {
        console.error('Error creating review response:', error);
        return {
          success: false,
          message: 'Failed to create review response',
          response: null
        };
      }
    },

    updateReviewResponse: async (_parent: unknown, { id, input }: { id: string; input: UpdateReviewResponseInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            response: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            response: null
          };
        }

        // Check admin permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        if (!isAdmin) {
          return {
            success: false,
            message: 'Admin access required',
            response: null
          };
        }

        const response = await prisma.reviewResponse.update({
          where: { id },
          data: {
            response: input.response
          },
          include: {
            review: true,
            responder: true
          }
        });

        return {
          success: true,
          message: 'Review response updated successfully',
          response
        };
      } catch (error) {
        console.error('Error updating review response:', error);
        return {
          success: false,
          message: 'Failed to update review response',
          response: null
        };
      }
    },

    deleteReviewResponse: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return {
            success: false,
            message: 'Authentication required',
            response: null
          };
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.userId !== 'string') {
          return {
            success: false,
            message: 'Invalid token',
            response: null
          };
        }

        // Check admin permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true }
        });

        const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
        if (!isAdmin) {
          return {
            success: false,
            message: 'Admin access required',
            response: null
          };
        }

        await prisma.reviewResponse.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Review response deleted successfully',
          response: null
        };
      } catch (error) {
        console.error('Error deleting review response:', error);
        return {
          success: false,
          message: 'Failed to delete review response',
          response: null
        };
      }
    }
  }
}; 