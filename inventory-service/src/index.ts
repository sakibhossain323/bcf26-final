import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventoryRoutes.js';
import { testConnection } from './config/database.js';
import { logger } from './utils/logger.js';
import { metricsMiddleware, register } from './middleware/metrics.js';

// 1. Import RabbitMQ dependencies
import { RabbitMQConnectionManager } from './config/rabbitmq.js';
import { InventoryConsumer } from './workers/inventoryConsumer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api/inventory', inventoryRoutes);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await testConnection();
  
  // Note: In a real production app, you might also want to check 
  // if RabbitMQ is connected here, but for now we keep it simple.
  
  if (dbHealthy) {
    res.status(200).json({ status: 'healthy', service: 'inventory-service' });
  } else {
    res.status(503).json({ status: 'unhealthy', service: 'inventory-service' });
  }
});

async function start() {
  try {
    // 1. Connect to Database
    await testConnection();

    // 2. Connect to RabbitMQ
    // We use the env variable if in Docker, otherwise fallback to localhost
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const rabbitMQ = new RabbitMQConnectionManager(rabbitUrl);
    
    console.log('🔌 Connecting to RabbitMQ...');
    await rabbitMQ.connect();

    // 3. Start the Background Consumer
    // This starts listening to the queue immediately
    const consumer = new InventoryConsumer(rabbitMQ);
    await consumer.start();

    // 4. Start the HTTP Server
    app.listen(PORT, () => {
      logger.info(`🚀 Inventory Service running on port ${PORT}`);
      logger.info(`🐰 Inventory Consumer is active and listening for retry events`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();