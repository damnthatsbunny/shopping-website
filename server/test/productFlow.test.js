import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import cartRoutes from '../routes/cartRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import { ensureDemoProducts } from '../seed/addProducts.js';

let mongo;
let listener;
let baseUrl;
let adminHeaders;
let customerHeaders;

before(async () => {
  process.env.JWT_SECRET = 'isolated-product-flow-test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin@test.invalid',
    password: 'testpass123',
    role: 'admin',
  });
  const customer = await User.create({
    name: 'Test Customer',
    email: 'customer@test.invalid',
    password: 'testpass123',
    role: 'user',
  });
  adminHeaders = { Authorization: `Bearer ${jwt.sign({ id: admin._id }, process.env.JWT_SECRET)}` };
  customerHeaders = { Authorization: `Bearer ${jwt.sign({ id: customer._id }, process.env.JWT_SECRET)}` };

  const app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  listener = app.listen(0);
  await new Promise((resolve) => listener.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${listener.address().port}/api`;
});

after(async () => {
  if (listener) await new Promise((resolve) => listener.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('samples seed idempotently and product admin-to-cart flow works', async () => {
  await ensureDemoProducts();
  const sampleNames = [
    'Classic Black T-Shirt',
    'Premium White Sneakers',
    'Minimal Black Hoodie',
    'Everyday Backpack',
    'Classic Wrist Watch',
    'Wireless Headphones',
  ];
  const firstCount = await Product.countDocuments();
  const sampleCount = await Product.countDocuments({ name: { $in: sampleNames } });
  await ensureDemoProducts();
  assert.equal(sampleCount, sampleNames.length);
  assert.equal(await Product.countDocuments(), firstCount);

  const category = await Category.findOne({ name: 'Fashion' });
  const brand = await Brand.findOne({ name: 'UrbanNest' });
  const payload = {
    name: 'Flow Test Tee',
    description: 'A testable everyday cotton shirt.',
    category: category.name,
    brand: brand.name,
    price: 900,
    originalPrice: 1200,
    stock: 5,
    images: ['https://example.com/test-shirt.jpg'],
    sizes: ['M'],
    colors: ['Black'],
  };

  let response = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 201, await response.clone().text());
  const created = await response.json();
  assert.equal(String(created.category), String(category._id));
  assert.equal(String(created.brand), String(brand._id));

  response = await fetch(`${baseUrl}/products/${created._id}`);
  assert.equal(response.status, 200);
  const detail = await response.json();
  assert.equal(detail.product.name, payload.name);
  assert.equal(detail.product.category.name, category.name);

  response = await fetch(`${baseUrl}/products/${created._id}`, {
    method: 'PATCH',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock: 7 }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).stock, 7);

  response = await fetch(`${baseUrl}/cart`, {
    method: 'POST',
    headers: { ...customerHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: created._id, quantity: 2, size: 'M', color: 'Black' }),
  });
  assert.equal(response.status, 201, await response.clone().text());
  const cart = await response.json();
  assert.equal(cart[0].quantity, 2);
  assert.equal(cart[0].product.name, payload.name);

  response = await fetch(`${baseUrl}/products/${created._id}`, {
    method: 'PUT',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Updated Test Tee' }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, 'Updated Test Tee');

  response = await fetch(`${baseUrl}/products/${created._id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  assert.equal(response.status, 200);
  response = await fetch(`${baseUrl}/products/${created._id}`);
  assert.equal(response.status, 404);

  response = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { ...customerHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 403);

  response = await fetch(`${baseUrl}/cart`, {
    method: 'POST',
    headers: { ...customerHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: created._id, quantity: 1 }),
  });
  assert.equal(response.status, 400);
});