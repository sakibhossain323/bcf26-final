import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.js';
import { logger } from '../utils/logger.js';

export class InventoryController {
  async updateInventory(req: Request, res: Response) {
    const { orderId, items, idempotencyKey } = req.body;

    try {
      // Check idempotency
      const alreadyProcessed = await inventoryService.checkIdempotency(idempotencyKey);

      if (alreadyProcessed) {
        logger.info(`Request already processed: ${idempotencyKey}`);
        return res.status(200).json({
          message: 'Already processed',
          cached: true,
          data: alreadyProcessed
        });
      }

      // Simulate crash scenario (Schrödinger's Warehouse)
      const shouldCrash = Math.random() < 0.1; // 10% chance

      if (shouldCrash && process.env.ENABLE_CHAOS === 'true') {
        // Update database first
        await inventoryService.updateStock(orderId, items, idempotencyKey);

        // Then crash before sending response
        logger.error('💥 Simulated crash after database commit!');
        // Don't send response - simulate crash
        return;
      }

      const result = await inventoryService.updateStock(orderId, items, idempotencyKey);

      res.status(200).json({
        success: true,
        message: 'Inventory updated successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error updating inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update inventory',
        error: error.message,
      });
    }
  }

  async getInventory(req: Request, res: Response) {
const productId: string = req.params.productId as string;

    try {
      const inventory = await inventoryService.getInventory(productId);

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      logger.error('Error fetching inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory',
        error: error.message,
      });
    }
  }

  async healthCheck(req: Request, res: Response) {
    try {
      // Check database connection
      const dbHealthy = await inventoryService.checkDatabaseHealth();

      if (!dbHealthy) {
        return res.status(503).json({
          status: 'unhealthy',
          service: 'inventory-service',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        status: 'healthy',
        service: 'inventory-service',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'inventory-service',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const inventoryController = new InventoryController();