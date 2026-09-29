import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (error) {
        console.error('Failed to fetch order detail', error);
      }
    };

    fetchOrder();
  }, [id]);

  if (!order) return <div className="page-loading">Loading order details...</div>;

  return (
    <div className="container detail-card">
      <h2>{order.orderId}</h2>
      <p>Status: {order.orderStatus}</p>
      <p>Payment status: {order.paymentStatus}</p>
      <p>Total: ₹{order.total}</p>

      <div className="detail-list">
        {order.items.map((item) => (
          <div key={item.product} className="checkout-item">
            <span>{item.name} x {item.quantity}</span>
            <strong>₹{item.price * item.quantity}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetailPage;
