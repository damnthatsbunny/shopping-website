import express from 'express';
import { adminOnly, protect } from '../middleware/authMiddleware.js';
import { getAdminBrands, getAdminCategories, getAdminCoupons, getAdminDashboard, getAdminOrders, getAdminProducts, getAdminUsers } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.get('/orders', getAdminOrders);
router.get('/products', getAdminProducts);
router.get('/categories', getAdminCategories);
router.get('/brands', getAdminBrands);
router.get('/coupons', getAdminCoupons);

export default router;
