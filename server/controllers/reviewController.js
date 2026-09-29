import Review from '../models/Review.js';
import Product from '../models/Product.js';

const recalculateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  if (!reviews.length) {
    await Product.findByIdAndUpdate(productId, { rating: 0, reviews: [] });
    return;
  }

  const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    rating: Number(avg.toFixed(1)),
  });
};

export const getProductReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name avatar').sort({ createdAt: -1 });
  res.json(reviews);
};

export const createReview = async (req, res) => {
  try {
    const { productId, rating, review } = req.body;
    if (!productId || !rating || !review) return res.status(400).json({ message: 'Product, rating and review are required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const newReview = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      review,
    });

    await recalculateProductRating(productId);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to save review' });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot edit another user\'s review' });
    }

    review.rating = Number(req.body.rating || review.rating);
    review.review = req.body.review || review.review;
    await review.save();
    await recalculateProductRating(review.product);
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update review' });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot delete another user\'s review' });
    }

    await review.deleteOne();
    await recalculateProductRating(review.product);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to delete review' });
  }
};
