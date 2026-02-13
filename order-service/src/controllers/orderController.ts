import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';

export class OrderController {
  async createOrder(req: Request, res: Response) {
    try {
      const result = await orderService.createOrder(req.body);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message,
      });
    }
  }

  async shipOrder(req: Request, res: Response) {
    const orderId: string = req.params.orderId as string;

    try {
      const result = await orderService.shipOrder(orderId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(202).json(result); // 202 Accepted - will retry
      }
    } catch (error: any) {
      logger.error('Error shipping order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ship order',
        error: error.message,
      });
    }
  }

  async getOrder(req: Request, res: Response) {
    const orderId: string = req.params.orderId as string;

    try {
      const order = await orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message,
      });
    }
  }

  async healthCheck(req: Request, res: Response) {
    try {
      const dbHealthy = await orderService.checkDatabaseHealth();

      if (!dbHealthy) {
        return res.status(503).json({
          status: 'unhealthy',
          service: 'order-service',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        status: 'healthy',
        service: 'order-service',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'order-service',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async updateStatus(req: Request, res: Response) {
    const orderId: string = req.params.orderId as string;
    const { status } = req.body;

    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.status(200).json({
        success: true,
        data: updatedOrder,
      });
    } catch (error: any) {
      logger.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error.message,
      });
    }
  }
}

export const orderController = new OrderController();