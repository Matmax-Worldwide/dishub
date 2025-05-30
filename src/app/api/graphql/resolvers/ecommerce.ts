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

        return categories.map(category => ({
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
      return categories.map(category => ({
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
      return children.map(child => ({
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