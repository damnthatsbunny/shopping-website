import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const WishlistPage = () => {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (!items.length) {
    return <div className="container empty-state large">No items saved yet. <Link to="/products">Explore products</Link></div>;
  }

  return (
    <div className="container products-panel">
      <div className="section-header">
        <h2>Wishlist</h2>
      </div>
      <div className="product-grid">
        {items.map((item) => (
          <article key={item._id} className="product-card">
            <img src={item.images?.[0]} alt={item.name} className="product-card__image" />
            <div className="product-card__body">
              <Link to={`/products/${item._id}`} className="product-name">{item.name}</Link>
              <div className="product-card__price-row">
                <strong>₹{item.price}</strong>
                <span>₹{item.originalPrice || item.price}</span>
              </div>
              <div className="cta-row">
                <button className="primary-button small" onClick={() => addItem(item._id, 1)}>Move to cart</button>
                <button className="secondary-button small" onClick={() => removeItem(item._id)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
