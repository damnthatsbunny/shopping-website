import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiHeart, FiMinus, FiPlus, FiShoppingCart, FiStar } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { saveBuyNowDraft } from '../utils/checkoutDraft';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { items: wishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, review: '' });
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [actionError, setActionError] = useState('');
  const [adding, setAdding] = useState(false);

  const isWishlisted = wishlist.some((item) => item._id === id || item === id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
        setRelated(res.data.related || []);
        setSelectedSize(res.data.product.sizes?.[0] || '');
        setSelectedColor(res.data.product.colors?.[0] || '');
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/${id}`);
        setReviews(res.data);
      } catch (error) {
        console.error('Failed to fetch reviews', error);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleAddCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setActionError('');
    setAdding(true);
    try {
      await addItem(id, quantity, selectedSize, selectedColor);
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not add this item to your cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    saveBuyNowDraft({ productId: id, quantity, size: selectedSize, color: selectedColor });
    navigate('/checkout?mode=buy-now');
  };

  const handleWishlistToggle = async () => {
    if (!user) return;
    if (isWishlisted) {
      await removeFromWishlist(id);
      return;
    }
    await addToWishlist(id);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    await api.post('/reviews', { productId: id, ...newReview });
    const res = await api.get(`/reviews/${id}`);
    setReviews(res.data);
    setNewReview({ rating: 5, review: '' });
    const updatedProduct = await api.get(`/products/${id}`);
    setProduct(updatedProduct.data.product);
  };

  if (loading) return <div className="page-loading">Loading product...</div>;
  if (!product) return <div className="page-error">Product not found</div>;

  return (
    <div className="container detail-page">
      <div className="product-gallery">
        <img src={product.images?.[0]} alt={product.name} />
      </div>

      <div className="product-info">
        <span className="eyebrow">{product.brand?.name || 'Brand'}</span>
        <h1>{product.name}</h1>
        <div className="rating-row">
          <span><FiStar /> {product.rating || 4.5}</span>
          <span>{reviews.length} reviews</span>
        </div>
        <div className="price-row">
          <strong>₹{product.price}</strong>
          <span className="line-through">₹{product.originalPrice || product.price}</span>
          <em>{product.discount || 0}% off</em>
        </div>
        <p>{product.description}</p>
        <div className="stock-row">
          <span className={product.stock > 0 ? 'in-stock' : 'out-stock'}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
        </div>
        {(product.sizes?.length > 0 || product.colors?.length > 0) && (
          <div className="variant-selectors">
            {product.sizes?.length > 0 && <label>Size
              <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
                {product.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>}
            {product.colors?.length > 0 && <label>Color
              <select value={selectedColor} onChange={(event) => setSelectedColor(event.target.value)}>
                {product.colors.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>}
          </div>
        )}
        <div className="quantity-row">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}><FiMinus /></button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}><FiPlus /></button>
        </div>

        {actionError && <div className="form-error" role="alert">{actionError}</div>}
        <div className="cta-row large">
          <button className="primary-button" onClick={handleAddCart} disabled={adding || product.stock < 1}><FiShoppingCart /> {adding ? 'Adding...' : 'Add to cart'}</button>
          <button className="secondary-button" onClick={handleBuyNow} disabled={product.stock < 1}>Buy now <FiPlus /></button>
          <button className="secondary-button" onClick={handleWishlistToggle}><FiHeart fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#111827'} /> Wishlist</button>
        </div>

        <div className="detail-specs">
          <div><strong>Category:</strong> {product.category?.name}</div>
          <div><strong>Sizes:</strong> {product.sizes?.length ? product.sizes.join(', ') : 'One size'}</div>
          <div><strong>Colors:</strong> {product.colors?.length ? product.colors.join(', ') : 'Standard'}</div>
        </div>
      </div>

      <div className="reviews-panel">
        <h3>Customer reviews</h3>
        {reviews.length === 0 ? <p className="empty-state">No reviews yet. Be the first to review.</p> : reviews.map((review) => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <strong>{review.user?.name || 'Customer'}</strong>
              <span>{review.rating}/5</span>
            </div>
            <p>{review.review}</p>
          </div>
        ))}

        {user && (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h4>Write a review</h4>
            <select value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}>
              <option value={5}>5 stars</option>
              <option value={4}>4 stars</option>
              <option value={3}>3 stars</option>
              <option value={2}>2 stars</option>
              <option value={1}>1 star</option>
            </select>
            <textarea value={newReview.review} onChange={(e) => setNewReview({ ...newReview, review: e.target.value })} placeholder="Share your experience" required />
            <button type="submit" className="primary-button small">Submit review</button>
          </form>
        )}
      </div>

      <div className="related-section container">
        <div className="section-header">
          <h2>Related products</h2>
          <Link to="/products">Explore more</Link>
        </div>
        <div className="product-grid">
          {related.map((item) => <ProductCard key={item._id} product={item} />)}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
