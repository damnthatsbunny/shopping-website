import Coupon from '../models/Coupon.js';

export const getCoupons = async (req, res) => {
  const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(coupons);
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Coupon creation failed' });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    Object.assign(coupon, req.body);
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Coupon update failed' });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    coupon.isActive = false;
    await coupon.save();
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Coupon deletion failed' });
  }
};
