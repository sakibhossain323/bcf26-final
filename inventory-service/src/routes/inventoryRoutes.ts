import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { gremlinLatencyMiddleware } from '../middleware/gremlinLatency.js';

const router = Router();

router.post('/update', gremlinLatencyMiddleware, inventoryController.updateInventory);
router.get('/health', inventoryController.healthCheck);
router.get('/:productId', inventoryController.getInventory);

export default router;