import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      }
    };

    fetchOrders();
  }, []);

  if (!orders.length) {
    return <div className="container empty-state large">You have no orders yet. <Link to="/products">Shop now</Link></div>;
  }

  return (
    <div className="container">
      <h2>Your orders</h2>
      <div className="order-list">
        {orders.map((order) => (
          <div key={order._id} className="order-item-card">
            <div className="order-head">
              <strong>{order.orderId}</strong>
              <span>{order.orderStatus}</span>
            </div>
            <p>Total: ₹{order.total}</p>
            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
            <Link to={`/orders/${order._id}`} className="secondary-button small">View details</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
