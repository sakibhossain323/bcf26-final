import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// IMPORTANT: Ensure this file exists or comment out if not created yet
import inventoryRoutes from './routes/inventoryRoutes.js';
import { testConnection } from './config/database.js';
import { logger } from './utils/logger.js';
import { metricsMiddleware, register } from './middleware/metrics.js';

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

  if (dbHealthy) {
    res.status(200).json({ status: 'healthy', service: 'inventory-service' });
  } else {
    res.status(503).json({ status: 'unhealthy', service: 'inventory-service' });
  }
});

async function start() {
  try {
    await testConnection();

    app.listen(PORT, () => {
      logger.info(`🚀 Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();