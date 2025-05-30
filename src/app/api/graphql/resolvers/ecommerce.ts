import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define types for Prisma entities with relations
type ShopWithRelations = {
  id: string;
  name: string;
  defaultCurrencyId: string;
  adminUserId: string;
  createdAt: Date;
  updatedAt: Date;
  defaultCurrency: unknown;
  acceptedCurrencies: Array<{ currency: unknown }>;
  adminUser: unknown;
  products: unknown[];
  _count: { products: number };
};

type ProductCategoryWithCount = {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  parentId?: string | null;
  shopId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { products: number };
};

interface Context {
  req: NextRequest;
}

interface ShopFilterInput {
  search?: string;
  adminUserId?: string;
  currencyId?: string;
}

interface ProductFilterInput {
  search?: string;
  shopId?: string;
  categoryId?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductCategoryFilterInput {
  search?: string;
  shopId?: string;
  parentId?: string;
  isActive?: boolean;
}

interface PaginationInput {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

interface OrderFilterInput {
  search?: string;
  shopId?: string;
  customerId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  dateFrom?: string;
  dateTo?: string;
}

interface PaymentProviderFilterInput {
  search?: string;
  type?: string;
  isActive?: boolean;
}

interface PaymentMethodFilterInput {
  search?: string;
  providerId?: string;
  type?: string;
  isActive?: boolean;
}

interface PaymentFilterInput {
  search?: string;
  orderId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  providerId?: string;
  paymentMethodId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const ecommerceResolvers = {
  Query: {
    // Shop queries
    shops: async (
      _parent: unknown,
      { filter, pagination }: { filter?: ShopFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.name = {
            contains: filter.search,
            mode: 'insensitive'
          };
        }

        if (filter?.adminUserId) {
          where.adminUserId = filter.adminUserId;
        }

        if (filter?.currencyId) {
          where.defaultCurrencyId = filter.currencyId;
        }

        const shops = await prisma.shop.findMany({
          where,
          include: {
            defaultCurrency: true,
            acceptedCurrencies: {
              include: {
                currency: true
              }
            },
            adminUser: true,
            products: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return shops.map((shop: ShopWithRelations) => ({
          ...shop,
          acceptedCurrencies: shop.acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency)
        }));
      } catch (error) {
        console.error('Error fetching shops:', error);
        throw error;
      }
    },

    shop: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const shop = await prisma.shop.findUnique({
          where: { id },
          include: {
            defaultCurrency: true,
            acceptedCurrencies: {
              include: {
                currency: true
              }
            },
            adminUser: true,
            products: {
              include: {
                prices: {
                  include: {
                    currency: true
                  }
                }
              }
            }
          }
        });

        if (!shop) {
          throw new Error('Shop not found');
        }

        return {
          ...shop,
          acceptedCurrencies: shop.acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency)
        };
      } catch (error) {
        console.error('Error fetching shop:', error);
        throw error;
      }
    },

    // Product queries
    products: async (
      _parent: unknown,
      { filter, pagination }: { filter?: ProductFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { sku: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.shopId) {
          where.shopId = filter.shopId;
        }

        if (filter?.inStock !== undefined) {
          if (filter.inStock) {
            where.stockQuantity = { gt: 0 };
          } else {
            where.stockQuantity = { lte: 0 };
          }
        }

        const products = await prisma.product.findMany({
          where,
          include: {
            shop: true,
            prices: {
              include: {
                currency: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return products;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },

    product: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const product = await prisma.product.findUnique({
          where: { id },
          include: {
            shop: true,
            prices: {
              include: {
                currency: true
              }
            }
          }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        return product;
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },

    productBySku: async (_parent: unknown, { sku }: { sku: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const product = await prisma.product.findUnique({
          where: { sku },
          include: {
            shop: true,
            prices: {
              include: {
                currency: true
              }
            }
          }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        return product;
      } catch (error) {
        console.error('Error fetching product by SKU:', error);
        throw error;
      }
    },

    // Currency queries
    currencies: async (_parent: unknown, _args: unknown, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currencies = await prisma.currency.findMany({
          orderBy: { code: 'asc' }
        });

        return currencies;
      } catch (error) {
        console.error('Error fetching currencies:', error);
        throw error;
      }
    },

    currency: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currency = await prisma.currency.findUnique({
          where: { id }
        });

        if (!currency) {
          throw new Error('Currency not found');
        }

        return currency;
      } catch (error) {
        console.error('Error fetching currency:', error);
        throw error;
      }
    },

    currencyByCode: async (_parent: unknown, { code }: { code: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currency = await prisma.currency.findUnique({
          where: { code }
        });

        if (!currency) {
          throw new Error('Currency not found');
        }

        return currency;
      } catch (error) {
        console.error('Error fetching currency by code:', error);
        throw error;
      }
    },

    // Tax queries
    taxes: async (_parent: unknown, { shopId }: { shopId?: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};
        if (shopId) {
          where.shopId = shopId;
        }

        const taxes = await prisma.tax.findMany({
          where,
          include: {
            shop: true
          },
          orderBy: { name: 'asc' }
        });

        return taxes;
      } catch (error) {
        console.error('Error fetching taxes:', error);
        throw error;
      }
    },

    tax: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const tax = await prisma.tax.findUnique({
          where: { id },
          include: {
            shop: true
          }
        });

        if (!tax) {
          throw new Error('Tax not found');
        }

        return tax;
      } catch (error) {
        console.error('Error fetching tax:', error);
        throw error;
      }
    },

    // Order queries
    orders: async (
      _parent: unknown,
      _args: { filter?: OrderFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // For now, return empty array since Order model needs to be properly set up in Prisma
        // This will be replaced when Order model is fully implemented
        return [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },

    order: async (_parent: unknown, _args: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        // For now, return null since Order model needs to be properly set up in Prisma
        // This will be replaced when Order model is fully implemented
        return null;
      } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
      }
    },

    // Product Category queries
    productCategories: async (
      _parent: unknown,
      { filter, pagination }: { filter?: ProductCategoryFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { slug: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.shopId) {
          where.shopId = filter.shopId;
        }

        if (filter?.parentId !== undefined) {
          where.parentId = filter.parentId;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        const categories = await prisma.productCategory.findMany({
          where,
          include: {
            shop: true,
            parent: true,
            children: true,
            products: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return categories.map((category: ProductCategoryWithCount) => ({
          ...category,
          productCount: category._count.products
        }));
      } catch (error) {
        console.error('Error fetching product categories:', error);
        throw error;
      }
    },

    productCategory: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const category = await prisma.productCategory.findUnique({
          where: { id },
          include: {
            shop: true,
            parent: true,
            children: true,
            products: {
              include: {
                prices: {
                  include: {
                    currency: true
                  }
                }
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        if (!category) {
          throw new Error('Product category not found');
        }

        return {
          ...category,
          productCount: category._count.products
        };
      } catch (error) {
        console.error('Error fetching product category:', error);
        throw error;
      }
    },

    productCategoryBySlug: async (_parent: unknown, { slug }: { slug: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const category = await prisma.productCategory.findUnique({
          where: { slug },
          include: {
            shop: true,
            parent: true,
            children: true,
            products: {
              include: {
                prices: {
                  include: {
                    currency: true
                  }
                }
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        if (!category) {
          throw new Error('Product category not found');
        }

        return {
          ...category,
          productCount: category._count.products
        };
      } catch (error) {
        console.error('Error fetching product category by slug:', error);
        throw error;
      }
    },

    // Payment Provider queries
    paymentProviders: async (
      _parent: unknown,
      { filter, pagination }: { filter?: PaymentProviderFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { type: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.type) {
          where.type = filter.type;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        const providers = await prisma.paymentProvider.findMany({
          where,
          include: {
            paymentMethods: true,
            payments: true,
            _count: {
              select: {
                paymentMethods: true,
                payments: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return providers;
      } catch (error) {
        console.error('Error fetching payment providers:', error);
        throw error;
      }
    },

    paymentProvider: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const provider = await prisma.paymentProvider.findUnique({
          where: { id },
          include: {
            paymentMethods: true,
            payments: {
              include: {
                order: true,
                currency: true,
                paymentMethod: true
              }
            }
          }
        });

        if (!provider) {
          throw new Error('Payment provider not found');
        }

        return provider;
      } catch (error) {
        console.error('Error fetching payment provider:', error);
        throw error;
      }
    },

    // Payment Method queries
    paymentMethods: async (
      _parent: unknown,
      { filter, pagination }: { filter?: PaymentMethodFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { type: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.providerId) {
          where.providerId = filter.providerId;
        }

        if (filter?.type) {
          where.type = filter.type;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        const methods = await prisma.paymentMethod.findMany({
          where,
          include: {
            provider: true,
            payments: true,
            _count: {
              select: {
                payments: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return methods;
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }
    },

    paymentMethod: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const method = await prisma.paymentMethod.findUnique({
          where: { id },
          include: {
            provider: true,
            payments: {
              include: {
                order: true,
                currency: true
              }
            }
          }
        });

        if (!method) {
          throw new Error('Payment method not found');
        }

        return method;
      } catch (error) {
        console.error('Error fetching payment method:', error);
        throw error;
      }
    },

    // Payment queries
    payments: async (
      _parent: unknown,
      { filter, pagination }: { filter?: PaymentFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.orderId) {
          where.orderId = filter.orderId;
        }

        if (filter?.status) {
          where.status = filter.status;
        }

        if (filter?.providerId) {
          where.providerId = filter.providerId;
        }

        if (filter?.paymentMethodId) {
          where.paymentMethodId = filter.paymentMethodId;
        }

        if (filter?.dateFrom || filter?.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) {
            (where.createdAt as Record<string, unknown>).gte = new Date(filter.dateFrom);
          }
          if (filter.dateTo) {
            (where.createdAt as Record<string, unknown>).lte = new Date(filter.dateTo);
          }
        }

        const payments = await prisma.payment.findMany({
          where,
          include: {
            order: {
              include: {
                customer: true,
                shop: true
              }
            },
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50),
          orderBy: { createdAt: 'desc' }
        });

        return payments;
      } catch (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
    },

    payment: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const payment = await prisma.payment.findUnique({
          where: { id },
          include: {
            order: {
              include: {
                customer: true,
                shop: true,
                items: {
                  include: {
                    product: true
                  }
                }
              }
            },
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          }
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        return payment;
      } catch (error) {
        console.error('Error fetching payment:', error);
        throw error;
      }
    }
  },

  Mutation: {
    // Shop mutations
    createShop: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const shop = await prisma.shop.create({
          data: {
            name: input.name as string,
            defaultCurrencyId: input.defaultCurrencyId as string,
            adminUserId: input.adminUserId as string,
            acceptedCurrencies: input.acceptedCurrencyIds ? {
              create: (input.acceptedCurrencyIds as string[]).map((currencyId: string) => ({
                currencyId
              }))
            } : undefined
          },
          include: {
            defaultCurrency: true,
            acceptedCurrencies: {
              include: {
                currency: true
              }
            },
            adminUser: true
          }
        });

        return {
          success: true,
          message: 'Shop created successfully',
          shop: {
            ...shop,
            acceptedCurrencies: shop.acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency)
          }
        };
      } catch (error) {
        console.error('Error creating shop:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create shop',
          shop: null
        };
      }
    },

    // Currency mutations
    createCurrency: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currency = await prisma.currency.create({
          data: {
            code: input.code as string,
            name: input.name as string,
            symbol: input.symbol as string
          }
        });

        return {
          success: true,
          message: 'Currency created successfully',
          currency
        };
      } catch (error) {
        console.error('Error creating currency:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create currency',
          currency: null
        };
      }
    },

    // Product Category mutations
    createProductCategory: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const category = await prisma.productCategory.create({
          data: {
            name: input.name as string,
            description: input.description as string || null,
            slug: input.slug as string,
            parentId: input.parentId as string || null,
            isActive: input.isActive as boolean ?? true,
            shopId: input.shopId as string || null
          },
          include: {
            shop: true,
            parent: true,
            children: true,
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Product category created successfully',
          category: {
            ...category,
            productCount: category._count.products
          }
        };
      } catch (error) {
        console.error('Error creating product category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create product category',
          category: null
        };
      }
    },

    updateProductCategory: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const category = await prisma.productCategory.update({
          where: { id },
          data: {
            name: input.name as string,
            description: input.description as string || null,
            slug: input.slug as string,
            parentId: input.parentId as string || null,
            isActive: input.isActive as boolean
          },
          include: {
            shop: true,
            parent: true,
            children: true,
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Product category updated successfully',
          category: {
            ...category,
            productCount: category._count.products
          }
        };
      } catch (error) {
        console.error('Error updating product category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update product category',
          category: null
        };
      }
    },

    deleteProductCategory: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if category has products
        const categoryWithProducts = await prisma.productCategory.findUnique({
          where: { id },
          include: {
            products: true,
            children: true
          }
        });

        if (!categoryWithProducts) {
          throw new Error('Product category not found');
        }

        if (categoryWithProducts.products.length > 0) {
          throw new Error('Cannot delete category with associated products');
        }

        if (categoryWithProducts.children.length > 0) {
          throw new Error('Cannot delete category with child categories');
        }

        await prisma.productCategory.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Product category deleted successfully',
          category: null
        };
      } catch (error) {
        console.error('Error deleting product category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete product category',
          category: null
        };
      }
    },

    // Payment Provider mutations
    createPaymentProvider: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const provider = await prisma.paymentProvider.create({
          data: {
            name: input.name as string,
            type: input.type as string,
            isActive: input.isActive as boolean ?? true,
            apiKey: input.apiKey as string || null,
            secretKey: input.secretKey as string || null,
            webhookUrl: input.webhookUrl as string || null
          }
        });

        return {
          success: true,
          message: 'Payment provider created successfully',
          provider
        };
      } catch (error) {
        console.error('Error creating payment provider:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment provider',
          provider: null
        };
      }
    },

    updatePaymentProvider: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const provider = await prisma.paymentProvider.update({
          where: { id },
          data: {
            name: input.name as string,
            type: input.type as string,
            isActive: input.isActive as boolean,
            apiKey: input.apiKey as string || null,
            secretKey: input.secretKey as string || null,
            webhookUrl: input.webhookUrl as string || null
          }
        });

        return {
          success: true,
          message: 'Payment provider updated successfully',
          provider
        };
      } catch (error) {
        console.error('Error updating payment provider:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update payment provider',
          provider: null
        };
      }
    },

    deletePaymentProvider: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if provider has payment methods or payments
        const providerWithRelations = await prisma.paymentProvider.findUnique({
          where: { id },
          include: {
            paymentMethods: true,
            payments: true
          }
        });

        if (!providerWithRelations) {
          throw new Error('Payment provider not found');
        }

        if (providerWithRelations.paymentMethods.length > 0) {
          throw new Error('Cannot delete provider with associated payment methods');
        }

        if (providerWithRelations.payments.length > 0) {
          throw new Error('Cannot delete provider with associated payments');
        }

        await prisma.paymentProvider.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Payment provider deleted successfully',
          provider: null
        };
      } catch (error) {
        console.error('Error deleting payment provider:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete payment provider',
          provider: null
        };
      }
    },

    // Payment Method mutations
    createPaymentMethod: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const method = await prisma.paymentMethod.create({
          data: {
            name: input.name as string,
            type: input.type as string,
            providerId: input.providerId as string,
            isActive: input.isActive as boolean ?? true,
            processingFeeRate: input.processingFeeRate as number || null,
            fixedFee: input.fixedFee as number || null
          },
          include: {
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment method created successfully',
          method
        };
      } catch (error) {
        console.error('Error creating payment method:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment method',
          method: null
        };
      }
    },

    updatePaymentMethod: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const method = await prisma.paymentMethod.update({
          where: { id },
          data: {
            name: input.name as string,
            type: input.type as string,
            providerId: input.providerId as string,
            isActive: input.isActive as boolean,
            processingFeeRate: input.processingFeeRate as number || null,
            fixedFee: input.fixedFee as number || null
          },
          include: {
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment method updated successfully',
          method
        };
      } catch (error) {
        console.error('Error updating payment method:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update payment method',
          method: null
        };
      }
    },

    deletePaymentMethod: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if method has payments
        const methodWithPayments = await prisma.paymentMethod.findUnique({
          where: { id },
          include: {
            payments: true
          }
        });

        if (!methodWithPayments) {
          throw new Error('Payment method not found');
        }

        if (methodWithPayments.payments.length > 0) {
          throw new Error('Cannot delete payment method with associated payments');
        }

        await prisma.paymentMethod.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Payment method deleted successfully',
          method: null
        };
      } catch (error) {
        console.error('Error deleting payment method:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete payment method',
          method: null
        };
      }
    },

    // Payment mutations
    createPayment: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const payment = await prisma.payment.create({
          data: {
            orderId: input.orderId as string || null,
            amount: input.amount as number,
            currencyId: input.currencyId as string,
            paymentMethodId: input.paymentMethodId as string,
            providerId: input.providerId as string,
            transactionId: input.transactionId as string || null
          },
          include: {
            order: true,
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment created successfully',
          payment
        };
      } catch (error) {
        console.error('Error creating payment:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment',
          payment: null
        };
      }
    },

    updatePayment: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const payment = await prisma.payment.update({
          where: { id },
          data: {
            status: input.status as string,
            transactionId: input.transactionId as string || null,
            gatewayResponse: input.gatewayResponse as string || null,
            failureReason: input.failureReason as string || null,
            refundAmount: input.refundAmount as number || null
          },
          include: {
            order: true,
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment updated successfully',
          payment
        };
      } catch (error) {
        console.error('Error updating payment:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update payment',
          payment: null
        };
      }
    },

    deletePayment: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        await prisma.payment.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Payment deleted successfully',
          payment: null
        };
      } catch (error) {
        console.error('Error deleting payment:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete payment',
          payment: null
        };
      }
    }
  },

  // Type resolvers
  Shop: {
    acceptedCurrencies: async (parent: Record<string, unknown>) => {
      const acceptedCurrencies = await prisma.shopAcceptedCurrencies.findMany({
        where: { shopId: parent.id as string },
        include: { currency: true }
      });
      return acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency);
    },
    
    products: async (parent: Record<string, unknown>) => {
      return await prisma.product.findMany({
        where: { shopId: parent.id as string },
        include: {
          prices: {
            include: {
              currency: true
            }
          }
        }
      });
    },

    productCategories: async (parent: Record<string, unknown>) => {
      const categories = await prisma.productCategory.findMany({
        where: { shopId: parent.id as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return categories.map((category: ProductCategoryWithCount) => ({
        ...category,
        productCount: category._count.products
      }));
    }
  },

  Product: {
    shop: async (parent: Record<string, unknown>) => {
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string },
        include: {
          defaultCurrency: true,
          adminUser: true
        }
      });
    },

    category: async (parent: Record<string, unknown>) => {
      if (!parent.categoryId) return null;
      const category = await prisma.productCategory.findUnique({
        where: { id: parent.categoryId as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return category ? {
        ...category,
        productCount: category._count.products
      } : null;
    },

    prices: async (parent: Record<string, unknown>) => {
      return await prisma.price.findMany({
        where: { productId: parent.id as string },
        include: {
          currency: true
        }
      });
    }
  },

  ProductCategory: {
    shop: async (parent: Record<string, unknown>) => {
      if (!parent.shopId) return null;
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string },
        include: {
          defaultCurrency: true,
          adminUser: true
        }
      });
    },

    parent: async (parent: Record<string, unknown>) => {
      if (!parent.parentId) return null;
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: parent.parentId as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return parentCategory ? {
        ...parentCategory,
        productCount: parentCategory._count.products
      } : null;
    },

    children: async (parent: Record<string, unknown>) => {
      const children = await prisma.productCategory.findMany({
        where: { parentId: parent.id as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return children.map((child: ProductCategoryWithCount) => ({
        ...child,
        productCount: child._count.products
      }));
    },

    products: async (parent: Record<string, unknown>) => {
      return await prisma.product.findMany({
        where: { categoryId: parent.id as string },
        include: {
          shop: true,
          prices: {
            include: {
              currency: true
            }
          }
        }
      });
    }
  },

  Price: {
    currency: async (parent: Record<string, unknown>) => {
      return await prisma.currency.findUnique({
        where: { id: parent.currencyId as string }
      });
    }
  },

  Tax: {
    shop: async (parent: Record<string, unknown>) => {
      if (!parent.shopId) return null;
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string }
      });
    }
  },

  PaymentProvider: {
    paymentMethods: async (parent: Record<string, unknown>) => {
      return await prisma.paymentMethod.findMany({
        where: { providerId: parent.id as string },
        include: {
          provider: true
        }
      });
    },

    payments: async (parent: Record<string, unknown>) => {
      return await prisma.payment.findMany({
        where: { providerId: parent.id as string },
        include: {
          order: true,
          currency: true,
          paymentMethod: true
        }
      });
    }
  },

  PaymentMethod: {
    provider: async (parent: Record<string, unknown>) => {
      return await prisma.paymentProvider.findUnique({
        where: { id: parent.providerId as string }
      });
    },

    payments: async (parent: Record<string, unknown>) => {
      return await prisma.payment.findMany({
        where: { paymentMethodId: parent.id as string },
        include: {
          order: true,
          currency: true,
          provider: true
        }
      });
    }
  },

  Payment: {
    order: async (parent: Record<string, unknown>) => {
      if (!parent.orderId) return null;
      return await prisma.order.findUnique({
        where: { id: parent.orderId as string },
        include: {
          customer: true,
          shop: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
    },

    currency: async (parent: Record<string, unknown>) => {
      return await prisma.currency.findUnique({
        where: { id: parent.currencyId as string }
      });
    },

    paymentMethod: async (parent: Record<string, unknown>) => {
      return await prisma.paymentMethod.findUnique({
        where: { id: parent.paymentMethodId as string },
        include: {
          provider: true
        }
      });
    },

    provider: async (parent: Record<string, unknown>) => {
      return await prisma.paymentProvider.findUnique({
        where: { id: parent.providerId as string }
      });
    }
  }
};