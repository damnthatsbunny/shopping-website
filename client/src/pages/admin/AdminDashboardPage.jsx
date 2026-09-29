import { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    };

    fetchStats();
  }, []);

  if (!stats) return <div className="page-loading">Loading admin dashboard...</div>;

  return (
    <div className="container admin-page">
      <h2>Admin dashboard</h2>
      <div className="stats-grid">
        <div className="stat-box"><span>Users</span><strong>{stats.usersCount}</strong></div>
        <div className="stat-box"><span>Products</span><strong>{stats.productsCount}</strong></div>
        <div className="stat-box"><span>Orders</span><strong>{stats.ordersCount}</strong></div>
        <div className="stat-box"><span>Revenue</span><strong>₹{stats.revenue}</strong></div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
