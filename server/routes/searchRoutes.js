import express from 'express';
import { getSuggestions, searchProducts } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchProducts);
router.get('/suggestions', getSuggestions);

export default router;
