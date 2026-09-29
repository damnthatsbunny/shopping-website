import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { saveBuyNowDraft } from '../utils/checkoutDraft';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { items: wishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [size, setSize] = useState(product.sizes?.[0] || '');
  const [color, setColor] = useState(product.colors?.[0] || '');
  const [actionError, setActionError] = useState('');
  const [adding, setAdding] = useState(false);

  const isWishlisted = wishlist.some((item) => item._id === product._id || item === product._id);
  const formatPrice = (price) => Number(price || 0).toLocaleString('en-IN');

  const handleWishlistToggle = async () => {
    if (!user) return;
    if (isWishlisted) {
      await removeFromWishlist(product._id);
      return;
    }
    await addToWishlist(product._id);
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setActionError('');
    setAdding(true);
    try {
      await addItem(product._id, 1, size, color);
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not add this item to your cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    saveBuyNowDraft({ productId: product._id, quantity: 1, size, color });
    navigate('/checkout?mode=buy-now');
  };

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <img src={product.images?.[0]} alt={product.name} className="product-card__image" loading="lazy" />
        {product.discount ? <span className="product-badge">-{product.discount}%</span> : null}
        <button className="icon-button wishlist" onClick={handleWishlistToggle} aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'} title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
          <FiHeart fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#111827'} />
        </button>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.brand?.name || 'Brand'}</span>
          <span className="rating"><FiStar /> {product.rating || 4.3}</span>
        </div>
        <Link to={`/products/${product._id}`} className="product-name">{product.name}</Link>
        <div className="product-card__price-row">
          <strong>₹{formatPrice(product.price)}</strong>
          <span>₹{formatPrice(product.originalPrice || product.price)}</span>
          {product.discount ? <em>{product.discount}% off</em> : null}
        </div>
        {(product.sizes?.length > 0 || product.colors?.length > 0) && (
          <div className="product-card__variants">
            {product.sizes?.length > 0 && <select aria-label={`Size for ${product.name}`} value={size} onChange={(event) => setSize(event.target.value)}>
              {product.sizes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>}
            {product.colors?.length > 0 && <select aria-label={`Color for ${product.name}`} value={color} onChange={(event) => setColor(event.target.value)}>
              {product.colors.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>}
          </div>
        )}
        {actionError && <p className="product-card__error" role="alert">{actionError}</p>}
        <div className="product-card__actions">
          <button className="primary-button small" onClick={handleAddToCart} disabled={adding || product.stock < 1}>
            <FiShoppingCart /> {adding ? 'Adding...' : 'Add to cart'}
          </button>
          <button className="secondary-button small" onClick={handleBuyNow} disabled={product.stock < 1}>
            Buy now <FiArrowRight />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
