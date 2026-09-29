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

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const resolveReference = async (Model, value, label) => {
  if (!value) throw badRequest(`${label} is required`);

  const query = mongoose.Types.ObjectId.isValid(value)
    ? { _id: value, isActive: true }
    : { name: String(value).trim(), isActive: true };
  const document = await Model.findOne(query);
  if (!document) throw badRequest(`${label} was not found`);
  return document._id;
};

const parseList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const normalizeProductFields = async (body, partial = false) => {
  const fields = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('name')) {
    fields.name = String(body.name || '').trim();
    if (!fields.name) throw badRequest('Product name is required');
    fields.slug = slugify(fields.name);
  }
  if (!partial || has('description')) {
    fields.description = String(body.description || '').trim();
    if (!fields.description) throw badRequest('Product description is required');
  }
  if (!partial || has('category')) fields.category = await resolveReference(Category, body.category, 'Category');
  if (!partial || has('brand')) fields.brand = await resolveReference(Brand, body.brand, 'Brand');

  for (const key of ['price', 'originalPrice', 'stock']) {
    if (!has(key) && partial) continue;
    const value = key === 'originalPrice' && body[key] == null ? body.price : body[key];
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || (key === 'stock' && !Number.isInteger(number))) {
      throw badRequest(`${key} must be a valid ${key === 'stock' ? 'whole number' : 'non-negative number'}`);
    }
    fields[key] = number;
  }

  if (has('images') || !partial) {
    fields.images = parseList(body.images);
    if (!fields.images.length) throw badRequest('At least one image URL is required');
    for (const image of fields.images) {
      let url;
      try {
        url = new URL(image);
      } catch {
        throw badRequest('Image URLs must be absolute HTTP or HTTPS URLs');
      }
      if (url.protocol !== 'https:') {
        throw badRequest('Image URLs must use HTTPS');
      }
    }
  }

  for (const key of ['sizes', 'colors', 'keywords']) {
    if (has(key)) fields[key] = parseList(body[key]);
  }
  for (const key of ['featured', 'trending', 'recommended']) {
    if (has(key)) fields[key] = body[key] === true || body[key] === 'true';
  }

  return fields;
};

const sendProductError = (res, error, fallback) => {
  const status = error.status || (error.code === 11000 ? 409 : error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500);
  res.status(status).json({ message: error.message || fallback });
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
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
    const product = await Product.create(await normalizeProductFields(req.body));

    res.status(201).json(product);
  } catch (error) {
    sendProductError(res, error, 'Product creation failed');
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, await normalizeProductFields(req.body, true));

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    sendProductError(res, error, 'Product update failed');
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isActive = false;
    await product.save();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    sendProductError(res, error, 'Product deletion failed');
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
