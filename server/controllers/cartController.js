import User from '../models/User.js';
import Product from '../models/Product.js';

const parseQuantity = (value) => {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
};

const validateVariants = (product, size, color) => {
  if (size && !product.sizes.includes(size)) return `Size ${size} is not available for ${product.name}`;
  if (color && !product.colors.includes(color)) return `Color ${color} is not available for ${product.name}`;
  return '';
};

export const getCart = async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json(user.cart || []);
};

export const addToCart = async (req, res) => {
  try {
    const { productId, size = '', color = '' } = req.body;
    const quantity = parseQuantity(req.body.quantity ?? 1);
    if (!quantity) return res.status(400).json({ message: 'Quantity must be a positive whole number' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.isActive) return res.status(400).json({ message: 'This product is no longer available' });
    if (product.stock < quantity) return res.status(400).json({ message: `Only ${product.stock} units left for ${product.name}` });
    const variantError = validateVariants(product, size, color);
    if (variantError) return res.status(400).json({ message: variantError });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const existingItem = user.cart.find((item) =>
      item.product.toString() === productId && (item.size || '') === size && (item.color || '') === color
    );

    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} units left for ${product.name}` });
      }
      existingItem.quantity += Number(quantity);
    } else {
      user.cart.push({ product: productId, quantity: Number(quantity), size, color });
    }

    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('cart.product');
    res.status(201).json(populatedUser.cart);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to add item to cart' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const quantity = parseQuantity(req.body.quantity);
    if (!quantity) return res.status(400).json({ message: 'Quantity must be a positive whole number' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const item = user.cart.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ message: 'Product no longer exists' });
    if (!product.isActive) return res.status(400).json({ message: 'This product is no longer available' });
    if (quantity > product.stock) return res.status(400).json({ message: `Only ${product.stock} units left for ${product.name}` });

    item.quantity = quantity;
    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('cart.product');
    res.json(populatedUser.cart);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update cart item' });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter((item) => item._id.toString() !== req.params.itemId);
    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('cart.product');
    res.json(populatedUser.cart);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to remove cart item' });
  }
};

export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to clear cart' });
  }
};
