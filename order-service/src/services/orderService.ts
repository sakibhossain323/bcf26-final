import { db } from '../config/database.js';
import { orders, orderItems, inventoryUpdates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { HttpClient } from '../utils/httpClient.js';
import { RabbitMQConnectionManager } from '../config/rabbitmq.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';
const rabbitMQ = new RabbitMQConnectionManager('amqp://localhost:5672');
interface CreateOrderDTO {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

class OrderService {
  private inventoryClient: HttpClient;

  constructor() {
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
    this.inventoryClient = new HttpClient(inventoryServiceUrl, 3000); // 3 second timeout
  }

  async createOrder(orderData: CreateOrderDTO) {
    const orderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return await db.transaction(async (tx) => {
      // Create order
      const [order] = await tx.insert(orders).values({
        orderId,
        userId: orderData.userId,
        status: 'pending',
        totalAmount: totalAmount.toString(),
      }).returning();

      // Create order items
      for (const item of orderData.items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
        });
      }

      return { order, items: orderData.items };
    });
  }

  async shipOrder(orderId: string) {
    // Get order details
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error(`Order cannot be shipped. Current status: ${order.status}`);
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    // Generate idempotency key
    const idempotencyKey = `${orderId}-${Date.now()}`;

    // Try to update inventory with timeout handling
    let inventoryUpdateSuccess = false;
    let errorMessage = '';

    try {
      logger.info(`Calling inventory service for order: ${orderId}`);

      await this.inventoryClient.post(
        '/api/inventory/update',
        {
          orderId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          idempotencyKey,
        },
        idempotencyKey
      );

      inventoryUpdateSuccess = true;
      logger.info(`✓ Inventory updated successfully for order: ${orderId}`);

    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Inventory service timeout - order will be retried via message queue';
        logger.warn(`⏱️  Timeout while updating inventory for order: ${orderId}`);

        // Send to message queue for retry
        await this.sendToRetryQueue(orderId, items, idempotencyKey);

      } else {
        errorMessage = `Inventory update failed: ${error.message}`;
        logger.error(`✗ Failed to update inventory for order: ${orderId}`, error);
      }
    }

    // Update order status based on inventory update result
    if (inventoryUpdateSuccess) {
      await db.update(orders)
        .set({ status: 'shipped', updatedAt: new Date() })
        .where(eq(orders.orderId, orderId));

      return {
        success: true,
        orderId,
        status: 'shipped',
        message: 'Order shipped successfully',
      };
    } else {
      // Store for retry
      await db.insert(inventoryUpdates).values({
        orderId,
        status: 'pending',
        retryCount: 0,
      });

      return {
        success: false,
        orderId,
        status: 'pending',
        message: errorMessage,
        willRetry: true,
      };
    }
  }

  private async sendToRetryQueue(orderId: string, items: any[], idempotencyKey: string) {
    try {
      const channel = rabbitMQ.getChannel();

      const message = {
        orderId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        idempotencyKey,
        timestamp: new Date().toISOString(),
      };

      channel.publish(
        'inventory_exchange',
        'inventory.update',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      logger.info(`📬 Order ${orderId} sent to retry queue`);
    } catch (error) {
      logger.error('Failed to send to retry queue:', error);
    }
  }

  async getOrder(orderId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    if (!order) {
      return null;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    return { ...order, items };
  }

  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const orderService = new OrderService();