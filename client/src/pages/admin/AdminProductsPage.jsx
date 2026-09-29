import { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Fashion',
    brand: 'UrbanNest',
    price: 1999,
    originalPrice: 2999,
    stock: 10,
    images: '',
    sizes: 'S,M,L',
    colors: 'Black,White',
    keywords: 'fashion, new',
    featured: false,
    trending: false,
    recommended: false,
  });

  const fetchProducts = async () => {
    const res = await api.get('/admin/products');
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/products', {
      ...form,
      images: form.images ? form.images.split(',').map((item) => item.trim()) : [],
      sizes: form.sizes.split(',').map((item) => item.trim()),
      colors: form.colors.split(',').map((item) => item.trim()),
      keywords: form.keywords.split(',').map((item) => item.trim()),
    });
    setForm({
      name: '',
      description: '',
      category: 'Fashion',
      brand: 'UrbanNest',
      price: 1999,
      originalPrice: 2999,
      stock: 10,
      images: '',
      sizes: 'S,M,L',
      colors: 'Black,White',
      keywords: 'fashion, new',
      featured: false,
      trending: false,
      recommended: false,
    });
    fetchProducts();
  };

  return (
    <div className="container admin-page">
      <h2>Manage products</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" required />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" required />
        <div className="two-col">
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand" />
        </div>
        <div className="two-col">
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" />
          <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} placeholder="Original price" />
        </div>
        <div className="two-col">
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" />
          <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="Image URLs (comma separated)" />
        </div>
        <div className="two-col">
          <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="Sizes" />
          <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Colors" />
        </div>
        <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="Keywords" />
        <div className="checkbox-row">
          <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <label><input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} /> Trending</label>
          <label><input type="checkbox" checked={form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} /> Recommended</label>
        </div>
        <button type="submit" className="primary-button">Add product</button>
      </form>

      <div className="admin-list">
        {products.map((product) => (
          <div key={product._id} className="order-item-card">
            <strong>{product.name}</strong>
            <p>Stock: {product.stock}</p>
            <p>Price: ₹{product.price}</p>
            <button className="secondary-button small" onClick={async () => { await api.put(`/products/${product._id}`, { stock: Number(product.stock) + 1 }); fetchProducts(); }}>Add stock</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProductsPage;
