// src/app/api/graphql/dataloaders/orderItemsByOrderIdLoader.ts
import { prisma } from '@/lib/prisma';
import { OrderItem, Product } from '@prisma/client';

export type EnrichedOrderItem = OrderItem & {
  product?: Partial<Product> | null; 
};

export const batchOrderItemsByOrderIds = async (orderIds: readonly string[]): Promise<EnrichedOrderItem[][]> => {
  console.log(`OrderItemsByOrderIdLoader: Batch loading items for order IDs: [${orderIds.join(', ')}]`);

  const items = await prisma.orderItem.findMany({
    where: {
      orderId: { in: orderIds as string[] },
    },
    include: {
      product: { 
        select: {
          id: true,
          name: true,
          sku: true,
        }
      }
    },
  });

  const itemsByOrderId: Record<string, EnrichedOrderItem[]> = {};
  orderIds.forEach(id => {
    itemsByOrderId[id] = [];
  });

  items.forEach(item => {
    if (item.orderId) { 
      itemsByOrderId[item.orderId].push(item as EnrichedOrderItem);
    }
  });

  return orderIds.map(id => itemsByOrderId[id]);
};
