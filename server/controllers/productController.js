import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

const buildQuery = (req) => {
  const query = { isActive: true };

  if (req.query.category) query.category = req.query.category;
  if (req.query.brand) query.brand = req.query.brand;
  if (req.query.inStock === 'true') query.stock = { $gt: 0 };
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.rating) query.rating = { $gte: Number(req.query.rating) };
  if (req.query.discount) query.discount = { $gte: Number(req.query.discount) };

  if (req.query.q) {
    const search = req.query.q.trim();
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { keywords: { $regex: search, $options: 'i' } },
    ];
  }

  return query;
};

const sortProducts = (sort) => {
  const map = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'rating': { rating: -1 },
    'newest': { createdAt: -1 },
    'popularity': { rating: -1, reviews: -1 },
  };

  return map[sort] || { createdAt: -1 };
};

export const getProducts = async (req, res) => {
  try {
    const query = buildQuery(req);
    if (req.query.category && !mongoose.Types.ObjectId.isValid(req.query.category)) {
      const category = await Category.findOne({ name: req.query.category, isActive: true });
      if (!category) return res.json([]);
      query.category = category._id;
    }
    if (req.query.brand && !mongoose.Types.ObjectId.isValid(req.query.brand)) {
      const brand = await Brand.findOne({ name: req.query.brand, isActive: true });
      if (!brand) return res.json([]);
      query.brand = brand._id;
    }
    const sort = sortProducts(req.query.sort);
    const products = await Product.find(query)
      .populate('category')
      .populate('brand')
      .sort(sort)
      .limit(200);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('brand')
      .populate('reviews.user', 'name avatar');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(4).populate('brand');

    res.json({ product, related });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, category, brand, price, originalPrice, stock, images, sizes, colors, keywords, featured, trending, recommended } = req.body;

    const sanitizedName = name?.trim();
    if (!sanitizedName || !description || !category || !brand || !price) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    const product = await Product.create({
      name: sanitizedName,
      slug: sanitizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      category,
      brand,
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      stock: Number(stock || 0),
      images: images || ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
      sizes: sizes || [],
      colors: colors || [],
      keywords: keywords || [],
      featured: Boolean(featured),
      trending: Boolean(trending),
      recommended: Boolean(recommended),
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Product creation failed' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, req.body);
    if (req.body.name) {
      product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Product update failed' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isActive = false;
    await product.save();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Product deletion failed' });
  }
};

export const getFeaturedProducts = async (req, res) => {
  const products = await Product.find({ featured: true, isActive: true }).populate('brand').limit(8);
  res.json(products);
};

export const getTrendingProducts = async (req, res) => {
  const products = await Product.find({ trending: true, isActive: true }).populate('brand').limit(8);
  res.json(products);
};

export const getRecommendedProducts = async (req, res) => {
  const products = await Product.find({ recommended: true, isActive: true }).populate('brand').limit(8);
  res.json(products);
};

export const getHomeProducts = async (req, res) => {
  try {
    const [featured, trending, recommended] = await Promise.all([
      Product.find({ featured: true, isActive: true }).populate('brand').limit(6),
      Product.find({ trending: true, isActive: true }).populate('brand').limit(6),
      Product.find({ recommended: true, isActive: true }).populate('brand').limit(6),
    ]);

    res.json({ featured, trending, recommended });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch homepage products' });
  }
};
