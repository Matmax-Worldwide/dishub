
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GraphQLContext } from '../route';

// Define types for Prisma entities with relations
type ShippingProviderWithRelations = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  apiKey?: string | null;
  secretKey?: string | null;
  webhookUrl?: string | null;
  trackingUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  shippingMethods: unknown[];
};

type ShippingMethodWithRelations = {
  id: string;
  name: string;
  description?: string | null;
  providerId: string;
  isActive: boolean;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  trackingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  provider: unknown;
  shippingRates: unknown[];
  shipments: unknown[];
};

type ShippingZoneWithRelations = {
  id: string;
  name: string;
  description?: string | null;
  countries: string[];
  states: string[];
  postalCodes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  shippingRates: unknown[];
};

type ShippingRateWithRelations = {
  id: string;
  shippingMethodId: string;
  shippingZoneId: string;
  minWeight?: number | null;
  maxWeight?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  baseRate: number;
  perKgRate?: number | null;
  freeShippingMin?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  shippingMethod: unknown;
  shippingZone: unknown;
};

type ShipmentWithRelations = {
  id: string;
  orderId: string;
  shippingMethodId: string;
  trackingNumber?: string | null;
  status: string;
  shippingCost: number;
  weight?: number | null;
  dimensions?: string | null;
  fromAddress: string;
  toAddress: string;
  shippedAt?: Date | null;
  estimatedDelivery?: Date | null;
  deliveredAt?: Date | null;
  providerResponse?: string | null;
  createdAt: Date;
  updatedAt: Date;
  order: unknown;
  shippingMethod: unknown;
};

// Define input types
interface CreateShippingProviderInput {
  name: string;
  type: string;
  isActive?: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  trackingUrl?: string;
}

interface UpdateShippingProviderInput {
  name?: string;
  type?: string;
  isActive?: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  trackingUrl?: string;
}

interface CreateShippingMethodInput {
  name: string;
  description?: string;
  providerId: string;
  isActive?: boolean;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  trackingEnabled?: boolean;
}

interface UpdateShippingMethodInput {
  name?: string;
  description?: string;
  providerId?: string;
  isActive?: boolean;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  trackingEnabled?: boolean;
}

interface CreateShippingZoneInput {
  name: string;
  description?: string;
  countries: string[];
  states?: string[];
  postalCodes?: string[];
  isActive?: boolean;
}

interface UpdateShippingZoneInput {
  name?: string;
  description?: string;
  countries?: string[];
  states?: string[];
  postalCodes?: string[];
  isActive?: boolean;
}

interface CreateShippingRateInput {
  shippingMethodId: string;
  shippingZoneId: string;
  minWeight?: number;
  maxWeight?: number;
  minValue?: number;
  maxValue?: number;
  baseRate: number;
  perKgRate?: number;
  freeShippingMin?: number;
  isActive?: boolean;
}

interface UpdateShippingRateInput {
  shippingMethodId?: string;
  shippingZoneId?: string;
  minWeight?: number;
  maxWeight?: number;
  minValue?: number;
  maxValue?: number;
  baseRate?: number;
  perKgRate?: number;
  freeShippingMin?: number;
  isActive?: boolean;
}

interface CreateShipmentInput {
  orderId: string;
  shippingMethodId: string;
  trackingNumber?: string;
  shippingCost: number;
  weight?: number;
  dimensions?: string;
  fromAddress: string;
  toAddress: string;
  estimatedDelivery?: string;
}

interface UpdateShipmentInput {
  trackingNumber?: string;
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED' | 'CANCELLED';
  shippingCost?: number;
  weight?: number;
  dimensions?: string;
  fromAddress?: string;
  toAddress?: string;
  shippedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  providerResponse?: string;
}

export const shippingResolvers = {
  Query: {
    // Shipping Providers
    shippingProviders: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const providers = await prisma.shippingProvider.findMany({
          include: {
            shippingMethods: {
              include: {
                shippingRates: true,
                shipments: true
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        
        return providers.map((provider: ShippingProviderWithRelations) => ({
          ...provider,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get shipping providers error:', error);
        throw error;
      }
    },

    shippingProvider: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const provider = await prisma.shippingProvider.findUnique({
          where: { id },
          include: {
            shippingMethods: {
              include: {
                shippingRates: true,
                shipments: true
              }
            }
          }
        });
        
        if (!provider) {
          throw new Error('Shipping provider not found');
        }
        
        return {
          ...provider,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Get shipping provider error:', error);
        throw error;
      }
    },

    // Shipping Methods
    shippingMethods: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const methods = await prisma.shippingMethod.findMany({
          include: {
            provider: true,
            shippingRates: {
              include: {
                shippingZone: true
              }
            },
            shipments: true
          },
          orderBy: { name: 'asc' }
        });
        
        return methods.map((method: ShippingMethodWithRelations) => ({
          ...method,
          createdAt: method.createdAt.toISOString(),
          updatedAt: method.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get shipping methods error:', error);
        throw error;
      }
    },

    // Shipping Zones
    shippingZones: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const zones = await prisma.shippingZone.findMany({
          include: {
            shippingRates: {
              include: {
                shippingMethod: {
                  include: {
                    provider: true
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        
        return zones.map((zone: ShippingZoneWithRelations) => ({
          ...zone,
          createdAt: zone.createdAt.toISOString(),
          updatedAt: zone.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get shipping zones error:', error);
        throw error;
      }
    },

    // Shipping Rates
    shippingRates: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const rates = await prisma.shippingRate.findMany({
          include: {
            shippingMethod: {
              include: {
                provider: true
              }
            },
            shippingZone: true
          },
          orderBy: { baseRate: 'asc' }
        });
        
        return rates.map((rate: ShippingRateWithRelations) => ({
          ...rate,
          createdAt: rate.createdAt.toISOString(),
          updatedAt: rate.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get shipping rates error:', error);
        throw error;
      }
    },

    // Shipments
    shipments: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const shipments = await prisma.shipment.findMany({
          include: {
            order: {
              include: {
                customer: true,
                shop: true,
                currency: true
              }
            },
            shippingMethod: {
              include: {
                provider: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return shipments.map((shipment: ShipmentWithRelations) => ({
          ...shipment,
          createdAt: shipment.createdAt.toISOString(),
          updatedAt: shipment.updatedAt.toISOString(),
          shippedAt: shipment.shippedAt?.toISOString(),
          estimatedDelivery: shipment.estimatedDelivery?.toISOString(),
          deliveredAt: shipment.deliveredAt?.toISOString()
        }));
      } catch (error) {
        console.error('Get shipments error:', error);
        throw error;
      }
    },

    shipment: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const shipment = await prisma.shipment.findUnique({
          where: { id },
          include: {
            order: {
              include: {
                customer: true,
                shop: true,
                currency: true
              }
            },
            shippingMethod: {
              include: {
                provider: true
              }
            }
          }
        });
        
        if (!shipment) {
          throw new Error('Shipment not found');
        }
        
        return {
          ...shipment,
          createdAt: shipment.createdAt.toISOString(),
          updatedAt: shipment.updatedAt.toISOString(),
          shippedAt: shipment.shippedAt?.toISOString(),
          estimatedDelivery: shipment.estimatedDelivery?.toISOString(),
          deliveredAt: shipment.deliveredAt?.toISOString()
        };
      } catch (error) {
        console.error('Get shipment error:', error);
        throw error;
      }
    }
  },

  Mutation: {
    // Shipping Provider Mutations
    createShippingProvider: async (
      _parent: unknown,
      { input }: { input: CreateShippingProviderInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const provider = await prisma.shippingProvider.create({
          data: {
            name: input.name,
            type: input.type,
            isActive: input.isActive ?? true,
            apiKey: input.apiKey,
            secretKey: input.secretKey,
            webhookUrl: input.webhookUrl,
            trackingUrl: input.trackingUrl
          },
          include: {
            shippingMethods: true
          }
        });
        
        return {
          ...provider,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Create shipping provider error:', error);
        throw error;
      }
    },

    updateShippingProvider: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateShippingProviderInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const updateData: Partial<CreateShippingProviderInput> = {};
        
        if (input.name !== undefined) updateData.name = input.name;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.apiKey !== undefined) updateData.apiKey = input.apiKey;
        if (input.secretKey !== undefined) updateData.secretKey = input.secretKey;
        if (input.webhookUrl !== undefined) updateData.webhookUrl = input.webhookUrl;
        if (input.trackingUrl !== undefined) updateData.trackingUrl = input.trackingUrl;
        
        const provider = await prisma.shippingProvider.update({
          where: { id },
          data: updateData,
          include: {
            shippingMethods: true
          }
        });
        
        return {
          ...provider,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Update shipping provider error:', error);
        throw error;
      }
    },

    deleteShippingProvider: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        await prisma.shippingProvider.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete shipping provider error:', error);
        return false;
      }
    },

    // Shipping Method Mutations
    createShippingMethod: async (
      _parent: unknown,
      { input }: { input: CreateShippingMethodInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const method = await prisma.shippingMethod.create({
          data: {
            name: input.name,
            description: input.description,
            providerId: input.providerId,
            isActive: input.isActive ?? true,
            estimatedDaysMin: input.estimatedDaysMin,
            estimatedDaysMax: input.estimatedDaysMax,
            trackingEnabled: input.trackingEnabled ?? true
          },
          include: {
            provider: true,
            shippingRates: true
          }
        });
        
        return {
          ...method,
          createdAt: method.createdAt.toISOString(),
          updatedAt: method.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Create shipping method error:', error);
        throw error;
      }
    },

    updateShippingMethod: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateShippingMethodInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const updateData: Partial<CreateShippingMethodInput> = {};
        
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.providerId !== undefined) updateData.providerId = input.providerId;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.estimatedDaysMin !== undefined) updateData.estimatedDaysMin = input.estimatedDaysMin;
        if (input.estimatedDaysMax !== undefined) updateData.estimatedDaysMax = input.estimatedDaysMax;
        if (input.trackingEnabled !== undefined) updateData.trackingEnabled = input.trackingEnabled;
        
        const method = await prisma.shippingMethod.update({
          where: { id },
          data: updateData,
          include: {
            provider: true,
            shippingRates: true
          }
        });
        
        return {
          ...method,
          createdAt: method.createdAt.toISOString(),
          updatedAt: method.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Update shipping method error:', error);
        throw error;
      }
    },

    deleteShippingMethod: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        await prisma.shippingMethod.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete shipping method error:', error);
        return false;
      }
    },

    // Shipping Zone Mutations
    createShippingZone: async (
      _parent: unknown,
      { input }: { input: CreateShippingZoneInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const zone = await prisma.shippingZone.create({
          data: {
            name: input.name,
            description: input.description,
            countries: input.countries,
            states: input.states || [],
            postalCodes: input.postalCodes || [],
            isActive: input.isActive ?? true
          },
          include: {
            shippingRates: true
          }
        });
        
        return {
          ...zone,
          createdAt: zone.createdAt.toISOString(),
          updatedAt: zone.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Create shipping zone error:', error);
        throw error;
      }
    },

    updateShippingZone: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateShippingZoneInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const updateData: Partial<CreateShippingZoneInput> = {};
        
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.countries !== undefined) updateData.countries = input.countries;
        if (input.states !== undefined) updateData.states = input.states;
        if (input.postalCodes !== undefined) updateData.postalCodes = input.postalCodes;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        
        const zone = await prisma.shippingZone.update({
          where: { id },
          data: updateData,
          include: {
            shippingRates: true
          }
        });
        
        return {
          ...zone,
          createdAt: zone.createdAt.toISOString(),
          updatedAt: zone.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Update shipping zone error:', error);
        throw error;
      }
    },

    deleteShippingZone: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        await prisma.shippingZone.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete shipping zone error:', error);
        return false;
      }
    },

    // Shipping Rate Mutations
    createShippingRate: async (
      _parent: unknown,
      { input }: { input: CreateShippingRateInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const rate = await prisma.shippingRate.create({
          data: {
            shippingMethodId: input.shippingMethodId,
            shippingZoneId: input.shippingZoneId,
            minWeight: input.minWeight,
            maxWeight: input.maxWeight,
            minValue: input.minValue,
            maxValue: input.maxValue,
            baseRate: input.baseRate,
            perKgRate: input.perKgRate,
            freeShippingMin: input.freeShippingMin,
            isActive: input.isActive ?? true
          },
          include: {
            shippingMethod: {
              include: {
                provider: true
              }
            },
            shippingZone: true
          }
        });
        
        return {
          ...rate,
          createdAt: rate.createdAt.toISOString(),
          updatedAt: rate.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Create shipping rate error:', error);
        throw error;
      }
    },

    updateShippingRate: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateShippingRateInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const updateData: Partial<CreateShippingRateInput> = {};
        
        if (input.shippingMethodId !== undefined) updateData.shippingMethodId = input.shippingMethodId;
        if (input.shippingZoneId !== undefined) updateData.shippingZoneId = input.shippingZoneId;
        if (input.minWeight !== undefined) updateData.minWeight = input.minWeight;
        if (input.maxWeight !== undefined) updateData.maxWeight = input.maxWeight;
        if (input.minValue !== undefined) updateData.minValue = input.minValue;
        if (input.maxValue !== undefined) updateData.maxValue = input.maxValue;
        if (input.baseRate !== undefined) updateData.baseRate = input.baseRate;
        if (input.perKgRate !== undefined) updateData.perKgRate = input.perKgRate;
        if (input.freeShippingMin !== undefined) updateData.freeShippingMin = input.freeShippingMin;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        
        const rate = await prisma.shippingRate.update({
          where: { id },
          data: updateData,
          include: {
            shippingMethod: {
              include: {
                provider: true
              }
            },
            shippingZone: true
          }
        });
        
        return {
          ...rate,
          createdAt: rate.createdAt.toISOString(),
          updatedAt: rate.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Update shipping rate error:', error);
        throw error;
      }
    },

    deleteShippingRate: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        await prisma.shippingRate.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete shipping rate error:', error);
        return false;
      }
    },

    // Shipment Mutations
    createShipment: async (
      _parent: unknown,
      { input }: { input: CreateShipmentInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const shipment = await prisma.shipment.create({
          data: {
            orderId: input.orderId,
            shippingMethodId: input.shippingMethodId,
            trackingNumber: input.trackingNumber,
            shippingCost: input.shippingCost,
            weight: input.weight,
            dimensions: input.dimensions,
            fromAddress: input.fromAddress,
            toAddress: input.toAddress,
            estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : undefined
          },
          include: {
            order: {
              include: {
                customer: true,
                shop: true,
                currency: true
              }
            },
            shippingMethod: {
              include: {
                provider: true
              }
            }
          }
        });
        
        return {
          ...shipment,
          createdAt: shipment.createdAt.toISOString(),
          updatedAt: shipment.updatedAt.toISOString(),
          shippedAt: shipment.shippedAt?.toISOString(),
          estimatedDelivery: shipment.estimatedDelivery?.toISOString(),
          deliveredAt: shipment.deliveredAt?.toISOString()
        };
      } catch (error) {
        console.error('Create shipment error:', error);
        throw error;
      }
    },

    updateShipment: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateShipmentInput },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        const updateData: {
          trackingNumber?: string;
          status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED' | 'CANCELLED';
          shippingCost?: number;
          weight?: number;
          dimensions?: string;
          fromAddress?: string;
          toAddress?: string;
          shippedAt?: Date;
          estimatedDelivery?: Date;
          deliveredAt?: Date;
          providerResponse?: string;
        } = {};
        
        if (input.trackingNumber !== undefined) updateData.trackingNumber = input.trackingNumber;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.shippingCost !== undefined) updateData.shippingCost = input.shippingCost;
        if (input.weight !== undefined) updateData.weight = input.weight;
        if (input.dimensions !== undefined) updateData.dimensions = input.dimensions;
        if (input.fromAddress !== undefined) updateData.fromAddress = input.fromAddress;
        if (input.toAddress !== undefined) updateData.toAddress = input.toAddress;
        if (input.shippedAt !== undefined) updateData.shippedAt = new Date(input.shippedAt);
        if (input.estimatedDelivery !== undefined) updateData.estimatedDelivery = new Date(input.estimatedDelivery);
        if (input.deliveredAt !== undefined) updateData.deliveredAt = new Date(input.deliveredAt);
        if (input.providerResponse !== undefined) updateData.providerResponse = input.providerResponse;
        
        const shipment = await prisma.shipment.update({
          where: { id },
          data: updateData,
          include: {
            order: {
              include: {
                customer: true,
                shop: true,
                currency: true
              }
            },
            shippingMethod: {
              include: {
                provider: true
              }
            }
          }
        });
        
        return {
          ...shipment,
          createdAt: shipment.createdAt.toISOString(),
          updatedAt: shipment.updatedAt.toISOString(),
          shippedAt: shipment.shippedAt?.toISOString(),
          estimatedDelivery: shipment.estimatedDelivery?.toISOString(),
          deliveredAt: shipment.deliveredAt?.toISOString()
        };
      } catch (error) {
        console.error('Update shipment error:', error);
        throw error;
      }
    },

    deleteShipment: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        await verifyToken(token);
        
        await prisma.shipment.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete shipment error:', error);
        return false;
      }
    }
  }
}; 