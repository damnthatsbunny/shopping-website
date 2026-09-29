import express from 'express';
import { createOrder, getAllOrders, getOrderById, getUserOrders, initiatePayment, updateOrderStatus, verifyPayment } from '../controllers/orderController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, adminOnly, getAllOrders);
router.post('/', protect, createOrder);
router.post('/payment/initiate', protect, initiatePayment);
router.post('/payment/verify', protect, verifyPayment);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
