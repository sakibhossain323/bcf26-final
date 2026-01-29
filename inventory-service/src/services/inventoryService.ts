import { db } from '../config/database.js';
import { inventory, processedRequests, inventoryAuditLog } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

interface InventoryItem {
  productId: string;
  quantity: number;
}

class InventoryService {
  async updateStock(orderId: string, items: InventoryItem[], idempotencyKey: string) {
    return await db.transaction(async (tx) => {
      for (const item of items) {
        const [currentInventory] = await tx
          .select()
          .from(inventory)
          .where(eq(inventory.productId, item.productId));

        if (!currentInventory) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (currentInventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        const newQuantity = currentInventory.quantity - item.quantity;

        // Update inventory
        await tx
          .update(inventory)
          .set({
            quantity: newQuantity,
            updatedAt: new Date(),
          })
          .where(eq(inventory.productId, item.productId));

        // Log audit trail
        await tx.insert(inventoryAuditLog).values({
          productId: item.productId,
          orderId,
          action: 'update',
          quantityBefore: currentInventory.quantity,
          quantityAfter: newQuantity,
        });
      }

      // Store idempotency key
      const response = JSON.stringify({ orderId, items, success: true });
      await tx.insert(processedRequests).values({
        idempotencyKey,
        orderId,
        response,
      });

      return { orderId, items, success: true };
    });
  }

  async checkIdempotency(idempotencyKey: string) {
    const [record] = await db
      .select()
      .from(processedRequests)
      .where(eq(processedRequests.idempotencyKey, idempotencyKey));

    if (record) {
      return JSON.parse(record.response || '{}');
    }

    return null;
  }

  async getInventory(productId: string) {
    const [result] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId));

    return result;
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

export const inventoryService = new InventoryService();