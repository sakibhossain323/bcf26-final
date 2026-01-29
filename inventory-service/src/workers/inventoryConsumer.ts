import axios from 'axios';
import { RabbitMQConnectionManager } from '../config/rabbitmq.js';
import { inventoryService } from '../services/inventoryService.js';
import { logger } from '../utils/logger.js';

export class InventoryConsumer {
  private rabbitMQ: RabbitMQConnectionManager;

  constructor(rabbitMQ: RabbitMQConnectionManager) {
    this.rabbitMQ = rabbitMQ;
  }

  async start() {
    try {
      const channel = this.rabbitMQ.getChannel();

      // These must match exactly what OrderService is sending to
      const exchange = 'inventory_exchange';
      const queue = 'inventory_updates_queue';
      const routingKey = 'inventory.update';

      // 1. Setup the plumbing (ensure Exchange and Queue exist)
      await channel.assertExchange(exchange, 'direct', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);

      logger.info('🐰 Inventory Consumer waiting for messages...');

      // 2. Start listening for messages
      channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          // Parse the message (it comes as a Buffer)
          const content = JSON.parse(msg.content.toString());
          const { orderId, items, idempotencyKey } = content;

          logger.info(`📥 Received retry for Order: ${orderId}`);

          // 3. REUSE your existing service logic!
          // This ensures Idempotency and Transactions are still used.
          await inventoryService.updateStock(orderId, items, idempotencyKey);

          logger.info(`✅ Successfully processed retry for Order: ${orderId}`);

          // 3.5 Notify OrderService to update status
          try {
            const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';
            await axios.patch(`${orderServiceUrl}/api/orders/${orderId}`, { status: 'shipped' });
            logger.info(`📞 Updated order status to shipped for Order: ${orderId}`);
          } catch (err: any) {
            logger.error(`⚠️ Failed to update order status for Order: ${orderId}`, err.message);
            // We proceed to ACK because inventory IS updated. 
            // In a real system, we might push to a "status-update-retry" queue.
          }

          // 4. Acknowledge (Tell RabbitMQ we are done so it deletes the message)
          channel.ack(msg);

        } catch (error: any) {
          logger.error(`❌ Failed to process message for Order`, error);

          // If it's a known logic error (e.g., "Out of Stock"), we might want to ack it anyway 
          // so we don't retry forever. 
          // For now, we reject it without requeueing to avoid infinite loops.
          channel.nack(msg, false, false);
        }
      });

    } catch (error) {
      logger.error('Failed to start Inventory Consumer:', error);
    }
  }
}