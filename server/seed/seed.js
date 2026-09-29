import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { connectDB } from '../config/db.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const demoCategories = [
  { name: 'Fashion', description: 'Fresh looks for every day', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
  { name: 'Electronics', description: 'Smart devices and gadgets', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { name: 'Home & Kitchen', description: 'Everyday essentials for living spaces', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80' },
  { name: 'Beauty', description: 'Self care and grooming essentials', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80' },
];

const demoBrands = [
  { name: 'UrbanNest', description: 'Minimal and modern lifestyle brand' },
  { name: 'PixelOne', description: 'Premium electronics for everyday living' },
  { name: 'Lumière', description: 'Beauty with a glow-up approach' },
  { name: 'Aster', description: 'Functional essentials with premium finishes' },
];

const demoProducts = [
  {
    name: 'Classic Comfort Hoodie',
    description: 'Soft fleece hoodie for relaxed everyday wear',
    category: 'Fashion',
    brand: 'UrbanNest',
    price: 1799,
    originalPrice: 2499,
    stock: 26,
    sizes: ['S','M','L','XL'],
    colors: ['Navy','Sand','Black'],
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    trending: true,
    recommended: true,
    rating: 4.6,
    keywords: ['hoodie','fashion','winter','comfort'],
  },
  {
    name: 'Aurora Wireless Earbuds',
    description: 'Deep bass earbuds with a compact charging case',
    category: 'Electronics',
    brand: 'PixelOne',
    price: 2499,
    originalPrice: 3999,
    stock: 18,
    colors: ['White','Black'],
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    trending: true,
    recommended: true,
    rating: 4.7,
    keywords: ['earbuds','audio','wireless','tech'],
  },
  {
    name: 'Luna Glow Serum',
    description: 'Hydrating skincare serum rich in vitamins and peptides',
    category: 'Beauty',
    brand: 'Lumière',
    price: 899,
    originalPrice: 1299,
    stock: 44,
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    rating: 4.4,
    keywords: ['serum','beauty','skin','glow'],
  },
  {
    name: 'Aster Smart Lamp',
    description: 'Ambient lighting with touch controls and warm white mode',
    category: 'Home & Kitchen',
    brand: 'Aster',
    price: 1899,
    originalPrice: 2799,
    stock: 12,
    colors: ['Cream','Oak'],
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'],
    trending: true,
    recommended: true,
    rating: 4.5,
    keywords: ['lamp','home','lighting','decor'],
  },
  {
    name: 'Velvet Run Sneakers',
    description: 'Lightweight breathable sneakers for city movement',
    category: 'Fashion',
    brand: 'UrbanNest',
    price: 2299,
    originalPrice: 3299,
    stock: 31,
    sizes: ['6','7','8','9','10'],
    colors: ['Gray','Black','White'],
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    rating: 4.3,
    keywords: ['running','sneakers','fashion','sport'],
  },
  {
    name: 'ChefPro Stainless Set',
    description: 'Complete cookware set built for daily Indian meals',
    category: 'Home & Kitchen',
    brand: 'Aster',
    price: 3499,
    originalPrice: 4999,
    stock: 8,
    images: ['https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=800&q=80'],
    recommended: true,
    rating: 4.6,
    keywords: ['kitchen','cookware','steel','home'],
  },
  {
    name: 'Noir Leather Tote',
    description: 'Structured tote bag with polished hardware and roomy interior.',
    category: 'Fashion',
    brand: 'UrbanNest',
    price: 2699,
    originalPrice: 3499,
    stock: 16,
    colors: ['Black','Tan'],
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    recommended: true,
    rating: 4.5,
    keywords: ['bags','fashion','office','travel'],
  },
  {
    name: 'Zen Air Speaker',
    description: 'Compact wireless speaker with rich stereo sound and voice control.',
    category: 'Electronics',
    brand: 'PixelOne',
    price: 4599,
    originalPrice: 5299,
    stock: 14,
    colors: ['Charcoal','Rose'],
    images: ['https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=800&q=80'],
    trending: true,
    recommended: true,
    rating: 4.8,
    keywords: ['speaker','audio','smart home','wireless'],
  },
  {
    name: 'Bloom Essentials Kit',
    description: 'Beauty essentials kit for hydration, glow, and daily care.',
    category: 'Beauty',
    brand: 'Lumière',
    price: 1499,
    originalPrice: 2199,
    stock: 32,
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80'],
    trending: true,
    rating: 4.7,
    keywords: ['skincare','beauty','kit','self care'],
  },
  {
    name: 'Breeze Ceramic Set',
    description: 'Minimal ceramic tableware set for everyday dining moments.',
    category: 'Home & Kitchen',
    brand: 'Aster',
    price: 2199,
    originalPrice: 2899,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    rating: 4.4,
    keywords: ['kitchen','dining','ceramic','home'],
  },
  {
    name: 'Nova Smartwatch',
    description: 'Elegant fitness tracking smartwatch with AMOLED display.',
    category: 'Electronics',
    brand: 'PixelOne',
    price: 6999,
    originalPrice: 8999,
    stock: 9,
    colors: ['Midnight','Silver'],
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'],
    featured: true,
    trending: true,
    rating: 4.9,
    keywords: ['watch','smartwatch','fitness','tech'],
  },
  {
    name: 'Velvet Silk Scarf',
    description: 'Lightweight luxe scarf that adds an instant signature touch.',
    category: 'Fashion',
    brand: 'UrbanNest',
    price: 1299,
    originalPrice: 1799,
    stock: 27,
    colors: ['Blush','Olive','Plum'],
    images: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80'],
    recommended: true,
    rating: 4.3,
    keywords: ['scarf','fashion','accessory','style'],
  },
];

const seedData = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the root .env before seeding.');
  }

  await connectDB();

  await mongoose.connection.db.dropDatabase();

  const categoryDocs = await Category.insertMany(demoCategories);
  const brandDocs = await Brand.insertMany(demoBrands);

  const categoryMap = Object.fromEntries(categoryDocs.map((c) => [c.name, c._id]));
  const brandMap = Object.fromEntries(brandDocs.map((b) => [b.name, b._id]));

  const products = demoProducts.map((item) => ({
    ...item,
    category: categoryMap[item.category],
    brand: brandMap[item.brand],
    discount: Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100),
  }));

  await Product.insertMany(products);

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: 'Admin User',
    email: adminEmail,
    password: hashedAdminPassword,
    role: 'admin',
  });

  await Coupon.create({
    code: 'SAVE10',
    description: '10% off on selected orders',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderValue: 1000,
    maxDiscount: 500,
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    isActive: true,
  });

  console.log('Seed complete: categories, brands, products, admin account, coupon created');
  console.log('Admin account created using ADMIN_EMAIL from .env');
  process.exit(0);
};

seedData().catch((error) => {
  console.error('Seeding error:', error);
  process.exit(1);
});
