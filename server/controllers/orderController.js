import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import Razorpay from 'razorpay';

const getRazorpay = () => process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

export const getPaymentConfig = (req, res) => {
  res.json({ enabled: Boolean(getRazorpay()), keyId: process.env.RAZORPAY_KEY_ID || '' });
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot access this order' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch order' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, couponCode, source = 'cart' } = req.body;
    const paymentMethod = req.body.paymentMethod || 'Cash on Delivery';

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!['Cash on Delivery', 'Razorpay'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Select a supported payment method' });
    }
    if (!['cart', 'buy-now'].includes(source)) {
      return res.status(400).json({ message: 'Invalid checkout source' });
    }
    if (paymentMethod === 'Razorpay' && !getRazorpay()) {
      return res.status(503).json({ message: 'Online payment is not configured. Choose Cash on Delivery.' });
    }

    const requiredAddressFields = ['fullName', 'phone', 'street', 'city', 'state', 'pincode'];
    const normalizedAddress = Object.fromEntries(requiredAddressFields.map((field) => [field, String(shippingAddress?.[field] || '').trim()]));
    if (requiredAddressFields.some((field) => !normalizedAddress[field])) {
      return res.status(400).json({ message: 'Complete all required delivery address fields' });
    }
    if (!/^\d{10}$/.test(normalizedAddress.phone)) {
      return res.status(400).json({ message: 'Enter a valid 10-digit phone number' });
    }
    if (!/^\d{6}$/.test(normalizedAddress.pincode)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit pincode' });
    }

    let subtotal = 0;
    const normalizedItems = new Map();

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Each item must have a positive whole-number quantity' });
      }
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: 'An order item has an invalid product ID' });
      }

      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (!product.isActive) return res.status(400).json({ message: `${product.name} is no longer available` });

      const size = String(item.size || '');
      const color = String(item.color || '');
      if (product.sizes.length && (!size || !product.sizes.includes(size))) {
        return res.status(400).json({ message: `Choose an available size for ${product.name}` });
      }
      if (product.colors.length && (!color || !product.colors.includes(color))) {
        return res.status(400).json({ message: `Choose an available color for ${product.name}` });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Only ${product.stock} units left for ${product.name}` });
      }

      const key = `${product._id}:${size}:${color}`;
      const currentItem = normalizedItems.get(key);
      const combinedQuantity = (currentItem?.quantity || 0) + quantity;
      if (combinedQuantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} units left for ${product.name}` });
      }
      normalizedItems.set(key, {
        product,
        quantity: combinedQuantity,
        size,
        color,
      });
    }

    const orderItems = [...normalizedItems.values()].map(({ product, quantity, size, color }) => {
      subtotal += product.price * quantity;
      return { product: product._id, name: product.name, image: product.images[0], size, color, quantity, price: product.price };
    });

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
      if (new Date(coupon.expiry) < new Date()) {
        return res.status(400).json({ message: 'Coupon expired' });
      }
      if (subtotal < coupon.minimumOrderValue) {
        return res.status(400).json({ message: `Minimum order value for this coupon is ₹${coupon.minimumOrderValue}` });
      }
      discount = coupon.discountType === 'percentage'
        ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || subtotal)
        : Math.min(coupon.discountValue, subtotal);
    }

    const deliveryFee = subtotal > 500 ? 0 : 49;
    const total = Math.max(subtotal - discount + deliveryFee, 0);
    const orderId = `URB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const order = await Order.create({
      user: req.user._id,
      orderId,
      items: orderItems,
      shippingAddress: { ...normalizedAddress, country: String(shippingAddress.country || 'India').trim(), landmark: String(shippingAddress.landmark || '').trim() },
      subtotal,
      discount,
      deliveryFee,
      total,
      couponCode,
      paymentMethod,
      source,
      paymentStatus: 'Pending',
      orderStatus: paymentMethod === 'Cash on Delivery' ? 'Confirmed' : 'Pending',
    });

    const userUpdate = { $push: { orders: order._id } };
    if (source === 'cart' && paymentMethod === 'Cash on Delivery') userUpdate.$set = { cart: [] };
    await User.findByIdAndUpdate(req.user._id, userUpdate);

    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to create order' });
  }
};

export const initiatePayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: 'Online payment is not configured' });
    }
    const order = await Order.findOne({ orderId: req.body.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'Razorpay') return res.status(400).json({ message: 'This order does not use online payment' });
    if (order.paymentStatus === 'Paid') return res.status(400).json({ message: 'This order is already paid' });

    const options = {
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: order.orderId,
    };

    const paymentOrder = await razorpay.orders.create(options);
    order.razorpayOrderId = paymentOrder.id;
    await order.save();
    res.json({ paymentOrder, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to initiate payment' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ message: 'Online payment is not configured' });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: 'Invalid order ID' });
    const updatedOrder = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    if (updatedOrder.paymentStatus === 'Paid') return res.json({ success: true, message: 'Payment was already verified' });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || updatedOrder.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment details do not match this order' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);
    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    updatedOrder.paymentStatus = 'Paid';
    updatedOrder.orderStatus = 'Confirmed';
    updatedOrder.razorpayOrderId = razorpay_order_id;
    updatedOrder.razorpayPaymentId = razorpay_payment_id;
    updatedOrder.razorpaySignature = razorpay_signature;
    await updatedOrder.save();
    if (updatedOrder.source === 'cart') {
      await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update order status' });
  }
};

export const getAllOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  res.json(orders);
};
