import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Coupon from '../models/Coupon.js';

export const getAdminDashboard = async (req, res) => {
  try {
    const [usersCount, productsCount, ordersCount, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      usersCount,
      productsCount,
      ordersCount,
      revenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load admin dashboard' });
  }
};

export const getAdminUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
};

export const getAdminOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  res.json(orders);
};

export const getAdminProducts = async (req, res) => {
  const products = await Product.find().populate('category').populate('brand').sort({ createdAt: -1 });
  res.json(products);
};

export const getAdminCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json(categories);
};

export const getAdminBrands = async (req, res) => {
  const brands = await Brand.find().sort({ createdAt: -1 });
  res.json(brands);
};

export const getAdminCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
};
