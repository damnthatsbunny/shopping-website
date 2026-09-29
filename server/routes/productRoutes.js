import express from 'express';
import { createProduct, deleteProduct, getFeaturedProducts, getHomeProducts, getProductById, getProducts, getRecommendedProducts, getTrendingProducts, updateProduct } from '../controllers/productController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/home', getHomeProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/recommended', getRecommendedProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
