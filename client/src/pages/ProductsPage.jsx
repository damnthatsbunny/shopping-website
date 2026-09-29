import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    sort: 'newest',
    category: searchParams.get('category') || '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    discount: '',
    inStock: false,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.brand) params.set('brand', filters.brand);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.rating) params.set('rating', filters.rating);
        if (filters.discount) params.set('discount', filters.discount);
        if (filters.inStock) params.set('inStock', 'true');
        if (filters.sort) params.set('sort', filters.sort);
        const res = await api.get(`/products?${params.toString()}`);
        setProducts(res.data);
      } catch (err) {
        setError('Products could not be loaded');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const totalProducts = products.length;

  return (
    <div className="container page-grid">
      <aside className="filters-panel">
        <h3>Filters</h3>
        <div className="filter-group">
          <label>Category</label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            <option value="Fashion">Fashion</option>
            <option value="Electronics">Electronics</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Beauty">Beauty</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Brand</label>
          <select value={filters.brand} onChange={(e) => setFilters({ ...filters, brand: e.target.value })}>
            <option value="">All</option>
            <option value="UrbanNest">UrbanNest</option>
            <option value="PixelOne">PixelOne</option>
            <option value="Lumière">Lumière</option>
            <option value="Aster">Aster</option>
          </select>
        </div>
        <div className="filter-group inline">
          <input type="number" placeholder="Min price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
          <input type="number" placeholder="Max price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
        <div className="filter-group">
          <label>Rating</label>
          <select value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: e.target.value })}>
            <option value="">Any</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Discount</label>
          <select value={filters.discount} onChange={(e) => setFilters({ ...filters, discount: e.target.value })}>
            <option value="">Any</option>
            <option value="10">10%+</option>
            <option value="20">20%+</option>
            <option value="30">30%+</option>
          </select>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={filters.inStock} onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })} /> In stock only</label>
      </aside>

      <section className="products-panel">
        <div className="results-header">
          <h2>Products</h2>
          <div className="sort-box">
            <label>Sort by</label>
            <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>

        {loading ? <div className="page-loading">Loading products...</div> : error ? <div className="page-error">{error}</div> : (
          <>
            <p className="results-summary">{totalProducts} products found</p>
            {products.length === 0 ? <div className="empty-state">No products match your filters.</div> : <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}
          </>
        )}
      </section>
    </div>
  );
};

export default ProductsPage;
