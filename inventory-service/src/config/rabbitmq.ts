import amqp, { Connection, Channel } from 'amqplib/callback_api.js';

export class RabbitMQConnectionManager {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private url: string;
  private isConnecting: boolean = false;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      console.log('Connection already in progress...');
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to RabbitMQ...');

      amqp.connect(this.url, (error: Error | null, connection: Connection) => {
        if (error) {
          this.isConnecting = false;
          console.error('❌ RabbitMQ Connection Error:', error.message);
          reject(error);
          return;
        }

        this.connection = connection;

        // Handle connection events
        connection.on('error', (err: Error) => {
          console.error('❌ RabbitMQ connection error:', err.message);
        });

        connection.on('close', () => {
          console.log('🔌 RabbitMQ connection closed');
          this.connection = null;
          this.channel = null;
          setTimeout(() => this.connect(), 5000);
        });

        // Create channel
        connection.createChannel((error: Error | null, channel: Channel) => {
          this.isConnecting = false;

          if (error) {
            console.error('❌ Channel creation error:', error.message);
            reject(error);
            return;
          }

          this.channel = channel;
          console.log('✅ RabbitMQ connected successfully!');
          resolve();
        });
      });
    });
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }
    return this.channel;
  }

  async close(): Promise<void> {
    if (this.channel) {
      await new Promise<void>((resolve) => {
        this.channel!.close(() => resolve());
      });
    }
    if (this.connection) {
      await new Promise<void>((resolve) => {
        this.connection!.close(() => resolve());
      });
    }
  }
}