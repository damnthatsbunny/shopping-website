import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { connectDB, memoryServer } from '../config/db.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const additionalProducts = [
  {
    name: 'Pulse Noise-Cancelling Headphones',
    description: 'Over-ear wireless headphones with active noise cancellation and a 30-hour battery.',
    category: 'Electronics', brand: 'PixelOne', price: 4299, originalPrice: 5999, stock: 24,
    colors: ['Black', 'Ivory'], images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
    featured: true, trending: true, recommended: true, rating: 4.7, keywords: ['headphones', 'audio', 'wireless', 'noise cancelling'],
  },
  {
    name: 'Orbit 20,000mAh Power Bank',
    description: 'Pocket-ready fast charging with dual USB ports and a clear battery display.',
    category: 'Electronics', brand: 'PixelOne', price: 1799, originalPrice: 2499, stock: 38,
    colors: ['Graphite', 'Blue'], images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80'],
    trending: true, recommended: true, rating: 4.5, keywords: ['power bank', 'charger', 'mobile', 'travel'],
  },
  {
    name: 'Everyday Oxford Shirt',
    description: 'A breathable cotton button-down made for weekday plans and easy weekends.',
    category: 'Fashion', brand: 'UrbanNest', price: 1399, originalPrice: 1999, stock: 34,
    sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Blue'], images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80'],
    featured: true, recommended: true, rating: 4.4, keywords: ['shirt', 'cotton', 'fashion', 'everyday'],
  },
  {
    name: 'Metro Crossbody Bag',
    description: 'A lightweight everyday crossbody with secure pockets and adjustable strap.',
    category: 'Fashion', brand: 'UrbanNest', price: 1599, originalPrice: 2299, stock: 21,
    colors: ['Black', 'Olive'], images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80'],
    trending: true, rating: 4.6, keywords: ['bag', 'crossbody', 'travel', 'fashion'],
  },
  {
    name: 'Aster Compact Air Fryer',
    description: 'Space-saving 4-litre air fryer with simple temperature and timer controls.',
    category: 'Home & Kitchen', brand: 'Aster', price: 5499, originalPrice: 7499, stock: 13,
    colors: ['Black', 'Cream'], images: ['https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80'],
    featured: true, trending: true, rating: 4.6, keywords: ['air fryer', 'kitchen', 'appliance', 'cooking'],
  },
  {
    name: 'Stoneware Tableware Set',
    description: 'A four-piece glazed stoneware set that brings an easy, considered feel to the table.',
    category: 'Home & Kitchen', brand: 'Aster', price: 1899, originalPrice: 2699, stock: 29,
    colors: ['Sage', 'White'], images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80'],
    recommended: true, rating: 4.5, keywords: ['tableware', 'ceramic', 'dining', 'home'],
  },
  {
    name: 'Daily Dew Vitamin C Moisturizer',
    description: 'Lightweight daily moisturizer with vitamin C and SPF 30 for a fresh, hydrated finish.',
    category: 'Beauty', brand: 'Lumière', price: 749, originalPrice: 999, stock: 46,
    images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80'],
    featured: true, recommended: true, rating: 4.4, keywords: ['moisturizer', 'vitamin c', 'skincare', 'beauty'],
  },
  {
    name: 'Soft Matte Lip Color Set',
    description: 'A trio of comfortable, richly pigmented everyday shades in a soft matte finish.',
    category: 'Beauty', brand: 'Lumière', price: 899, originalPrice: 1299, stock: 35,
    colors: ['Rose', 'Berry', 'Nude'], images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80'],
    trending: true, rating: 4.3, keywords: ['lipstick', 'makeup', 'beauty', 'lip color'],
  },
  {
    name: 'Classic Black T-Shirt',
    description: 'A soft, midweight cotton crew-neck tee with a clean fit for everyday wear.',
    category: 'Fashion', brand: 'UrbanNest', price: 899, originalPrice: 1299, stock: 42,
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Black'],
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'],
    featured: true, trending: true, recommended: true, rating: 4.6, keywords: ['t-shirt', 'tee', 'cotton', 'black', 'fashion'],
  },
  {
    name: 'Premium White Sneakers',
    description: 'Cushioned low-top sneakers with a versatile silhouette and durable rubber outsole.',
    category: 'Fashion', brand: 'UrbanNest', price: 3899, originalPrice: 4999, stock: 19,
    sizes: ['6', '7', '8', '9', '10'], colors: ['White'],
    images: ['https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=900&q=80'],
    featured: true, trending: true, rating: 4.5, keywords: ['sneakers', 'shoes', 'white', 'footwear'],
  },
  {
    name: 'Minimal Black Hoodie',
    description: 'A relaxed-fit fleece hoodie with a soft brushed interior and understated detailing.',
    category: 'Fashion', brand: 'UrbanNest', price: 2199, originalPrice: 2999, stock: 26,
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Black'],
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'],
    trending: true, recommended: true, rating: 4.7, keywords: ['hoodie', 'fleece', 'black', 'fashion'],
  },
  {
    name: 'Everyday Backpack',
    description: 'A lightweight 20-litre backpack with a padded laptop sleeve and organized pockets.',
    category: 'Fashion', brand: 'UrbanNest', price: 2499, originalPrice: 3299, stock: 23,
    colors: ['Black', 'Olive'],
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'],
    featured: true, recommended: true, rating: 4.5, keywords: ['backpack', 'bag', 'laptop', 'travel'],
  },
  {
    name: 'Classic Wrist Watch',
    description: 'A refined everyday watch with a clear dial, stainless-steel case, and comfortable strap.',
    category: 'Fashion', brand: 'UrbanNest', price: 3299, originalPrice: 4499, stock: 15,
    colors: ['Black', 'Silver'],
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'],
    trending: true, rating: 4.4, keywords: ['watch', 'wristwatch', 'accessory', 'classic'],
  },
  {
    name: 'Wireless Headphones',
    description: 'Comfortable over-ear wireless headphones with clear sound and up to 30 hours of battery life.',
    category: 'Electronics', brand: 'PixelOne', price: 4299, originalPrice: 5999, stock: 24,
    colors: ['Black', 'Ivory'],
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
    featured: true, trending: true, recommended: true, rating: 4.7, keywords: ['headphones', 'audio', 'wireless', 'music'],
  },
];

export const ensureDemoProducts = async () => {
  const categoryDetails = {
    Electronics: { description: 'Smart devices and gadgets', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
    Fashion: { description: 'Fresh looks for every day', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
    'Home & Kitchen': { description: 'Everyday essentials for living spaces', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80' },
    Beauty: { description: 'Self care and grooming essentials', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80' },
  };
  const brandDetails = {
    PixelOne: 'Premium electronics for everyday living',
    UrbanNest: 'Minimal and modern lifestyle brand',
    Aster: 'Functional essentials with premium finishes',
    'Lumière': 'Beauty with a glow-up approach',
  };
  const categoryMap = new Map();
  const brandMap = new Map();

  for (const [name, details] of Object.entries(categoryDetails)) {
    const category = await Category.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), ...details } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryMap.set(name, category._id);
  }

  for (const [name, description] of Object.entries(brandDetails)) {
    const brand = await Brand.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), description } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    brandMap.set(name, brand._id);
  }

  for (const item of additionalProducts) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const product = {
      ...item,
      slug,
      category: categoryMap.get(item.category),
      brand: brandMap.get(item.brand),
      discount: Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100),
    };

    await Product.updateOne({ slug }, { $setOnInsert: product }, { upsert: true });
  }

  return additionalProducts.length;
};

const seedProducts = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required for standalone seeding. Local in-memory demo products load automatically when the server starts.');
  }

  await connectDB();

  try {
    const count = await ensureDemoProducts();
    console.log(`Product seed complete: ${count} catalog items available (existing items preserved).`);
  } finally {
    await mongoose.disconnect();
    if (memoryServer) await memoryServer.stop();
  }
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  seedProducts().catch((error) => {
    console.error('Product seeding error:', error.message);
    process.exitCode = 1;
  });
}