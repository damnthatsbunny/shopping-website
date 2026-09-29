import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { items, loading, error: cartError, reloadCart, updateItem, removeItem } = useCart();
  const [busyItem, setBusyItem] = useState('');
  const [actionError, setActionError] = useState('');

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const delivery = subtotal > 500 ? 0 : items.length ? 49 : 0;
    return { subtotal, quantity, delivery, total: subtotal + delivery };
  }, [items]);

  const updateQuantity = async (item, quantity) => {
    setActionError('');
    setBusyItem(item._id);
    try {
      await updateItem(item._id, quantity);
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not update your cart.');
    } finally {
      setBusyItem('');
    }
  };

  const handleRemove = async (itemId) => {
    setActionError('');
    setBusyItem(itemId);
    try {
      await removeItem(itemId);
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not remove this item.');
    } finally {
      setBusyItem('');
    }
  };

  if (loading && !items.length) return <div className="page-loading">Loading your cart...</div>;
  if (cartError && !items.length) return <div className="container page-error" role="alert">{cartError} <button className="secondary-button small" onClick={reloadCart}>Retry</button></div>;

  if (!items.length) {
    return <div className="container empty-state large">Your cart is empty. <Link to="/products">Continue shopping</Link></div>;
  }

  return (
    <div className="container cart-page">
      <div className="cart-items">
        <h1>Your cart ({totals.quantity})</h1>
        {actionError && <div className="form-error" role="alert">{actionError}</div>}
        {items.map((item) => (
          <div className="cart-item" key={item._id}>
            <img src={item.product?.images?.[0]} alt={item.product?.name || 'Product'} />
            <div className="cart-item__info">
              <h3>{item.product?.name}</h3>
              <p>{item.product?.brand?.name || 'Brand'}</p>
              {(item.size || item.color) && <p className="cart-item__variant">{[item.size, item.color].filter(Boolean).join(' · ')}</p>}
              <div className="qty-box">
                <button aria-label={`Decrease ${item.product?.name} quantity`} disabled={item.quantity <= 1 || busyItem === item._id} onClick={() => updateQuantity(item, item.quantity - 1)}><FiMinus /></button>
                <span>{item.quantity}</span>
                <button aria-label={`Increase ${item.product?.name} quantity`} disabled={busyItem === item._id || item.quantity >= (item.product?.stock || 0)} onClick={() => updateQuantity(item, item.quantity + 1)}><FiPlus /></button>
              </div>
            </div>
            <div className="cart-item__price">
              <strong>₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</strong>
              <button className="text-button" disabled={busyItem === item._id} onClick={() => handleRemove(item._id)}><FiTrash2 /> Remove</button>
            </div>
          </div>
        ))}
      </div>

      <aside className="summary-card">
        <h3>Order summary</h3>
        <div className="summary-row"><span>Items ({totals.quantity})</span><strong>₹{totals.subtotal.toLocaleString('en-IN')}</strong></div>
        <div className="summary-row"><span>Delivery</span><strong>₹{totals.delivery}</strong></div>
        <div className="summary-row total"><span>Total</span><strong>₹{totals.total.toLocaleString('en-IN')}</strong></div>
        <Link to="/checkout" className="primary-button wide">Proceed to checkout</Link>
      </aside>
    </div>
  );
};

export default CartPage;
