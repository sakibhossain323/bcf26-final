import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { gremlinLatencyMiddleware } from '../middleware/gremlinLatency.js';

const router = Router();

router.post('/update', gremlinLatencyMiddleware, inventoryController.updateInventory);
router.get('/:productId', inventoryController.getInventory);
router.get('/health', inventoryController.healthCheck);

export default router;