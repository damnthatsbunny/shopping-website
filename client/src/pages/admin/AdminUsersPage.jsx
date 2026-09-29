import { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    };

    fetchUsers();
  }, []);

  return (
    <div className="container admin-page">
      <h2>Users</h2>
      <div className="admin-list">
        {users.map((user) => (
          <div key={user._id} className="order-item-card">
            <strong>{user.name}</strong>
            <p>{user.email}</p>
            <p>{user.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;
