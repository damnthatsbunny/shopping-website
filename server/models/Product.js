import mongoose from 'mongoose';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String, required: true }],
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [reviewSchema],
    stock: { type: Number, default: 0, min: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    keywords: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  next();
});

productSchema.pre('save', function (next) {
  if (!this.originalPrice || this.originalPrice < this.price) {
    this.originalPrice = this.price;
  }
  if (this.originalPrice > 0 && this.discount === 0) {
    this.discount = Math.max(0, Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100));
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
