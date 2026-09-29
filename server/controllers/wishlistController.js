import User from '../models/User.js';

export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user.wishlist || []);
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('wishlist');
    res.status(201).json(populatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to add item to wishlist' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((item) => item.toString() !== req.params.productId);
    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json(populatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to remove item from wishlist' });
  }
};
