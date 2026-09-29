import express from 'express';
import { getPaymentConfig, initiatePayment, verifyPayment } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);

export default router;
