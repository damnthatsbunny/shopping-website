import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { clearBuyNowDraft, readBuyNowDraft } from '../utils/checkoutDraft';

const emptyAddress = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

const formatPrice = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buy-now';
  const { user } = useAuth();
  const { items: cartItems, loading: cartLoading, error: cartError, reloadCart } = useCart();
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(isBuyNow);
  const [address, setAddress] = useState({ ...emptyAddress, fullName: user?.name || '', phone: user?.phone || '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [paymentConfig, setPaymentConfig] = useState({ enabled: false, keyId: '' });
  const [orderError, setOrderError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    setAddress((current) => ({
      ...current,
      fullName: current.fullName || user?.name || '',
      phone: current.phone || user?.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    api.get('/payments/config')
      .then((response) => setPaymentConfig(response.data))
      .catch(() => setPaymentConfig({ enabled: false, keyId: '' }));
  }, []);

  useEffect(() => {
    if (!isBuyNow) {
      setBuyNowLoading(false);
      setBuyNowItem(null);
      return undefined;
    }

    const draft = readBuyNowDraft();
    if (!draft?.productId) {
      setOrderError('Your Buy Now selection could not be found. Please choose the product again.');
      setBuyNowLoading(false);
      return undefined;
    }

    let cancelled = false;
    setBuyNowLoading(true);
    api.get(`/products/${draft.productId}`)
      .then((response) => {
        if (!cancelled) setBuyNowItem({ ...draft, product: response.data.product });
      })
      .catch((error) => {
        if (!cancelled) setOrderError(error.response?.data?.message || 'The selected product could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setBuyNowLoading(false);
      });

    return () => { cancelled = true; };
  }, [isBuyNow]);

  const checkoutItems = useMemo(() => {
    if (isBuyNow) return buyNowItem ? [buyNowItem] : [];
    return cartItems;
  }, [buyNowItem, cartItems, isBuyNow]);

  const totals = useMemo(() => {
    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const quantity = checkoutItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const delivery = subtotal > 500 ? 0 : checkoutItems.length ? 49 : 0;
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.discountType === 'percentage'
        ? Math.min((subtotal * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || subtotal)
        : Math.min(appliedCoupon.discountValue, subtotal);
    }
    return { subtotal, quantity, delivery, discount, total: Math.max(subtotal - discount + delivery, 0) };
  }, [appliedCoupon, checkoutItems]);

  const applyCoupon = async () => {
    setCouponError('');
    setCouponLoading(true);
    try {
      const response = await api.get('/coupons');
      const coupon = response.data.find((item) => item.code.toUpperCase() === couponCode.trim().toUpperCase());
      if (!coupon) throw new Error('That coupon code is not valid.');
      if (coupon.expiry && new Date(coupon.expiry) < new Date()) throw new Error('That coupon has expired.');
      if (totals.subtotal < coupon.minimumOrderValue) {
        throw new Error(`Add items worth ₹${formatPrice(coupon.minimumOrderValue)} to use this coupon.`);
      }
      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(error.message || error.response?.data?.message || 'Could not validate this coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const finishOrder = async (orderId) => {
    if (isBuyNow) clearBuyNowDraft();
    else await reloadCart();
    navigate(`/confirmation/${orderId}`);
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setOrderError('');
    if (!checkoutItems.length) {
      setOrderError('There are no items to order.');
      return;
    }
    if (checkoutItems.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      setOrderError('Each item must have a valid quantity.');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderResponse = await api.post('/orders', {
        items: checkoutItems.map((item) => ({
          product: item.product?._id || item.productId,
          quantity: Number(item.quantity),
          size: item.size || '',
          color: item.color || '',
        })),
        shippingAddress: { ...address, country: 'India' },
        couponCode: appliedCoupon?.code || '',
        paymentMethod,
        source: isBuyNow ? 'buy-now' : 'cart',
      });
      const { order } = orderResponse.data;

      if (paymentMethod === 'Cash on Delivery') {
        await finishOrder(order._id);
        return;
      }

      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) throw new Error('Online payment could not be loaded. Your cart is unchanged; please try again or choose cash on delivery.');
      const paymentResponse = await api.post('/payments/initiate', { orderId: order.orderId });
      const paymentOrder = paymentResponse.data.paymentOrder;
      const payment = new window.Razorpay({
        key: paymentResponse.data.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Urbancart',
        description: `Order ${order.orderId}`,
        order_id: paymentOrder.id,
        handler: async (result) => {
          try {
            await api.post('/payments/verify', { ...result, orderId: order._id });
            await finishOrder(order._id);
          } catch (error) {
            setOrderError(error.response?.data?.message || 'Payment verification failed. Your cart is unchanged.');
            setPlacingOrder(false);
          }
        },
        modal: { ondismiss: () => setPlacingOrder(false) },
        prefill: { name: address.fullName, contact: address.phone, email: user?.email || '' },
        theme: { color: '#ff6b3d' },
      });
      payment.open();
    } catch (error) {
      setOrderError(error.response?.data?.message || error.message || 'Checkout failed. Please try again.');
      setPlacingOrder(false);
    }
  };

  const waitingForItems = isBuyNow ? buyNowLoading : cartLoading;
  if (waitingForItems && !checkoutItems.length) return <div className="page-loading">Loading checkout...</div>;
  if (!isBuyNow && cartError && !checkoutItems.length) return <div className="container page-error" role="alert">{cartError} <button className="secondary-button small" onClick={reloadCart}>Retry</button></div>;
  if (!checkoutItems.length) {
    return <div className="container empty-state large">{orderError || 'Your cart is empty.'} <Link to="/products">Browse products</Link></div>;
  }

  return (
    <div className="container checkout-page">
      <form id="checkout-form" className="checkout-form" onSubmit={handlePlaceOrder}>
        <h2>Delivery address</h2>
        <div className="address-grid">
          <label>Full name<input autoComplete="name" value={address.fullName} onChange={(event) => setAddress({ ...address, fullName: event.target.value })} required /></label>
          <label>Phone number<input type="tel" inputMode="numeric" autoComplete="tel" pattern="[0-9]{10}" title="Enter a 10-digit phone number" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} required /></label>
          <label className="address-wide">Street address<input autoComplete="street-address" value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} required /></label>
          <label>City<input autoComplete="address-level2" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} required /></label>
          <label>State<input autoComplete="address-level1" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} required /></label>
          <label>Pincode<input inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" title="Enter a 6-digit pincode" value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value })} required /></label>
          <label className="address-wide">Landmark (optional)<input value={address.landmark} onChange={(event) => setAddress({ ...address, landmark: event.target.value })} /></label>
        </div>

        <h3>Payment method</h3>
        <div className="payment-options">
          <label><input type="radio" name="paymentMethod" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={(event) => setPaymentMethod(event.target.value)} /> Cash on Delivery</label>
          <label className={!paymentConfig.enabled ? 'payment-unavailable' : ''}>
            <input type="radio" name="paymentMethod" value="Razorpay" checked={paymentMethod === 'Razorpay'} onChange={(event) => setPaymentMethod(event.target.value)} disabled={!paymentConfig.enabled} />
            Online payment {!paymentConfig.enabled && <span>(not configured)</span>}
          </label>
        </div>

        <div className="coupon-box">
          <input aria-label="Coupon code" value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setAppliedCoupon(null); setCouponError(''); }} placeholder="Coupon code" />
          <button className="secondary-button small" type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>{couponLoading ? 'Checking...' : appliedCoupon ? 'Applied' : 'Apply'}</button>
        </div>
        {couponError && <p className="form-error" role="alert">{couponError}</p>}
        {orderError && <div className="form-error" role="alert">{orderError}</div>}
      </form>

      <aside className="summary-card">
        <h3>Order summary</h3>
        <div className="checkout-summary-items">
          {checkoutItems.map((item, index) => (
            <div key={item._id || `${item.product?._id}-${index}`} className="checkout-item">
              <img src={item.product?.images?.[0]} alt="" />
              <div>
                <strong>{item.product?.name}</strong>
                <span>Qty {item.quantity}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}</span>
              </div>
              <strong>₹{formatPrice((item.product?.price || 0) * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="summary-row"><span>Subtotal ({totals.quantity} items)</span><strong>₹{formatPrice(totals.subtotal)}</strong></div>
        {appliedCoupon && <div className="summary-row"><span>Discount</span><strong>-₹{formatPrice(totals.discount)}</strong></div>}
        <div className="summary-row"><span>Delivery</span><strong>{totals.delivery ? `₹${formatPrice(totals.delivery)}` : 'Free'}</strong></div>
        <div className="summary-row total"><span>Total</span><strong>₹{formatPrice(totals.total)}</strong></div>
        <button className="primary-button wide" type="submit" form="checkout-form" disabled={placingOrder || (paymentMethod === 'Razorpay' && !paymentConfig.enabled)}>
          {placingOrder ? 'Processing...' : paymentMethod === 'Razorpay' ? 'Continue to payment' : 'Place order'}
        </button>
      </aside>
    </div>
  );
};

export default CheckoutPage;
