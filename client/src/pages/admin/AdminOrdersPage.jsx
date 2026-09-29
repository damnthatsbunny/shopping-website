import { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await api.get('/admin/orders');
    setOrders(res.data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="container admin-page">
      <h2>Orders</h2>
      <div className="admin-list">
        {orders.map((order) => (
          <div key={order._id} className="order-item-card">
            <strong>{order.orderId}</strong>
            <p>{order.user?.name}</p>
            <p>{order.orderStatus}</p>
            <select value={order.orderStatus} onChange={async (e) => { await api.patch(`/orders/${order._id}/status`, { status: e.target.value }); fetchOrders(); }}>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Out for Delivery</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
