import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/logger';

class RabbitMQConnection {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Setup exchanges and queues
      await this.channel.assertExchange('inventory_exchange', 'direct', { durable: true });
      await this.channel.assertQueue('inventory_updates', { durable: true });
      await this.channel.bindQueue('inventory_updates', 'inventory_exchange', 'inventory.update');

      logger.info('✓ RabbitMQ connected successfully');
    } catch (error) {
      logger.error('✗ RabbitMQ connection failed:', error);
      throw error;
    }
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export const rabbitMQ = new RabbitMQConnection();