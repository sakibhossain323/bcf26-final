import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';

const router = Router();

router.post('/', orderController.createOrder);
router.post('/:orderId/ship', orderController.shipOrder);
router.get('/:orderId', orderController.getOrder);
router.get('/health', orderController.healthCheck);

export default router;