import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

interface PaginationInput {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
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

        return shops.map(shop => ({
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

    prices: async (parent: Record<string, unknown>) => {
      return await prisma.price.findMany({
        where: { productId: parent.id as string },
        include: {
          currency: true
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
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string },
        include: {
          defaultCurrency: true,
          adminUser: true
        }
      });
    }
  }
}; 