import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// IMPORTANT: Ensure these files exist or comment them out if they don't yet
import orderRoutes from './routes/orderRoutes.js';
import { testConnection } from './config/database.js';
import { RabbitMQConnectionManager } from './config/rabbitmq.js';
import { logger } from './utils/logger.js';
import { metricsMiddleware, register } from './middleware/metrics.js';

dotenv.config();

// FIX: Use Environment Variable from Docker, fallback to localhost only for non-docker dev
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
const rabbitMQ = new RabbitMQConnectionManager(rabbitUrl);

const app = express();
const PORT = process.env.PORT || 3005;


app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
app.use('/api/orders', orderRoutes);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await testConnection();

  if (dbHealthy) {
    res.status(200).json({ status: 'healthy', service: 'order-service' });
  } else {
    res.status(503).json({ status: 'unhealthy', service: 'order-service' });
  }
});

async function start() {
  try {
    // 1. Connect DB
    await testConnection();

    // 2. Connect RabbitMQ
    console.log(`Attempting to connect to RabbitMQ at: ${rabbitUrl}`);
    await rabbitMQ.connect();

    app.listen(PORT, () => {
      logger.info(`🚀 Order Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}


process.on('uncaughtException', (err) => {
  const fs = require('fs');
  fs.writeFileSync('crash.log', `Uncaught Exception: ${err.message}\n${err.stack}\n`, { flag: 'a' });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const fs = require('fs');
  fs.writeFileSync('crash.log', `Unhandled Rejection: ${reason}\n`, { flag: 'a' });
});

start();