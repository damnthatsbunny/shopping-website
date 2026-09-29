import { useEffect, useState } from 'react';
import api from '../../services/api';

const emptyForm = {
  name: '',
  description: '',
  category: 'Fashion',
  brand: 'UrbanNest',
  price: '',
  originalPrice: '',
  stock: 0,
  images: '',
  sizes: '',
  colors: '',
  keywords: '',
  featured: false,
  trending: false,
  recommended: false,
};

const toList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const [productResponse, categoryResponse, brandResponse] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories'),
        api.get('/admin/brands'),
      ]);
      setProducts(productResponse.data);
      setCategories(categoryResponse.data.filter((category) => category.isActive));
      setBrands(brandResponse.data.filter((brand) => brand.isActive));
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Products could not be loaded. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || form.price),
      stock: Number(form.stock),
      images: toList(form.images),
      sizes: toList(form.sizes),
      colors: toList(form.colors),
      keywords: toList(form.keywords),
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage('Product updated.');
      } else {
        await api.post('/products', payload);
        setMessage('Product added.');
      }
      setForm(emptyForm);
      setEditingId('');
      await fetchProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Product could not be saved. Please retry.');
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setMessage('');
    setError('');
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category?.name || '',
      brand: product.brand?.name || '',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? product.price ?? '',
      stock: product.stock ?? 0,
      images: (product.images || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      keywords: (product.keywords || []).join(', '),
      featured: Boolean(product.featured),
      trending: Boolean(product.trending),
      recommended: Boolean(product.recommended),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId('');
    setForm(emptyForm);
    setError('');
    setMessage('');
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? It will no longer appear in the storefront.`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/products/${product._id}`);
      if (editingId === product._id) cancelEdit();
      setMessage('Product deleted.');
      await fetchProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Product could not be deleted. Please retry.');
    }
  };

  const addStock = async (product) => {
    setError('');
    setMessage('');
    try {
      await api.patch(`/products/${product._id}`, { stock: Number(product.stock) + 1 });
      setMessage(`Stock updated for ${product.name}.`);
      await fetchProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Stock could not be updated. Please retry.');
    }
  };

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="container admin-page">
      <h2>Manage products</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Product name" required />
        <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Description" required />
        <div className="two-col">
          <select value={form.category} onChange={(e) => updateField('category', e.target.value)} required>
            <option value="" disabled>Select category</option>
            {categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}
          </select>
          <select value={form.brand} onChange={(e) => updateField('brand', e.target.value)} required>
            <option value="" disabled>Select brand</option>
            {brands.map((brand) => <option key={brand._id} value={brand.name}>{brand.name}</option>)}
          </select>
        </div>
        <div className="two-col">
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="Price" required />
          <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => updateField('originalPrice', e.target.value)} placeholder="Original price" />
        </div>
        <div className="two-col">
          <input type="number" min="0" step="1" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} placeholder="Stock" required />
          <input type="text" value={form.images} onChange={(e) => updateField('images', e.target.value)} placeholder="Image URLs (comma separated)" required />
        </div>
        <div className="two-col">
          <input value={form.sizes} onChange={(e) => updateField('sizes', e.target.value)} placeholder="Sizes (comma separated)" />
          <input value={form.colors} onChange={(e) => updateField('colors', e.target.value)} placeholder="Colors (comma separated)" />
        </div>
        <input value={form.keywords} onChange={(e) => updateField('keywords', e.target.value)} placeholder="Keywords (comma separated)" />
        <div className="checkbox-row">
          <label><input type="checkbox" checked={form.featured} onChange={(e) => updateField('featured', e.target.checked)} /> Featured</label>
          <label><input type="checkbox" checked={form.trending} onChange={(e) => updateField('trending', e.target.checked)} /> Trending</label>
          <label><input type="checkbox" checked={form.recommended} onChange={(e) => updateField('recommended', e.target.checked)} /> Recommended</label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <div className="cta-row">
          <button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Add product'}</button>
          {editingId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel edit</button>}
        </div>
      </form>

      <div className="admin-list">
        {loading ? <p className="page-loading">Loading products...</p> : null}
        {!loading && products.length === 0 && <p className="empty-state">No products have been added yet.</p>}
        {products.map((product) => (
          <div key={product._id} className="order-item-card">
            {product.images?.[0] && <img src={product.images[0]} alt="" loading="lazy" width="96" height="96" />}
            <strong>{product.name} {!product.isActive && '(deleted)'}</strong>
            <p>{product.category?.name} · {product.brand?.name}</p>
            <p>{product.description}</p>
            <p>Stock: {product.stock}</p>
            <p>Price: ₹{product.price}</p>
            <div className="cta-row">
              <button type="button" className="secondary-button small" onClick={() => startEdit(product)}>Edit</button>
              <button type="button" className="secondary-button small" onClick={() => addStock(product)} disabled={!product.isActive}>Add stock</button>
              {product.isActive && <button type="button" className="secondary-button small" onClick={() => deleteProduct(product)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProductsPage;
