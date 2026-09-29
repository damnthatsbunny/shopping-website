import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Order details could not be loaded.');
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  if (error) return <div className="container page-error" role="alert">{error} <Link to="/orders">View your orders</Link></div>;
  if (!order) return <div className="page-loading">Loading order details...</div>;

  return (
    <div className="container confirmation-box">
      <h2>Order confirmed</h2>
      <p>Your order <strong>{order.orderId}</strong> has been placed successfully.</p>
      <p>Status: {order.orderStatus} · Payment: {order.paymentMethod} ({order.paymentStatus})</p>
      <h3>Items</h3>
      {order.items.map((item) => (
        <div className="confirmation-item" key={item._id}>
          <span>{item.name} x {item.quantity}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}</span>
          <strong>₹{(item.price * item.quantity).toLocaleString('en-IN')}</strong>
        </div>
      ))}
      <h3>Delivering to</h3>
      <p>{order.shippingAddress.fullName}<br />{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />Phone: {order.shippingAddress.phone}</p>
      <p>Total paid / due: <strong>₹{order.total.toLocaleString('en-IN')}</strong></p>
      <Link to="/orders" className="primary-button">View orders</Link>
    </div>
  );
};

export default OrderConfirmationPage;
