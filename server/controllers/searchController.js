import Product from '../models/Product.js';

export const searchProducts = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } },
      ],
    }).populate('brand').populate('category').limit(50);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Search failed' });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ],
    }).select('name brand category').limit(10);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Suggestions failed' });
  }
};
