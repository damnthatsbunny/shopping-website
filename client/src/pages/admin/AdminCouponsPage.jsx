import { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: 10, minimumOrderValue: 1000, expiry: '', isActive: true });

  const fetchCoupons = async () => {
    const res = await api.get('/admin/coupons');
    setCoupons(res.data);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/coupons', form);
    setForm({ code: '', discountType: 'percentage', discountValue: 10, minimumOrderValue: 1000, expiry: '', isActive: true });
    fetchCoupons();
  };

  return (
    <div className="container admin-page">
      <h2>Coupons</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Coupon code" required />
        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
          <option value="percentage">Percentage</option>
          <option value="flat">Flat</option>
        </select>
        <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} placeholder="Discount value" />
        <input type="number" value={form.minimumOrderValue} onChange={(e) => setForm({ ...form, minimumOrderValue: Number(e.target.value) })} placeholder="Minimum order value" />
        <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
        <button type="submit" className="primary-button">Create coupon</button>
      </form>

      <div className="admin-list">
        {coupons.map((coupon) => (
          <div key={coupon._id} className="order-item-card">
            <strong>{coupon.code}</strong>
            <p>{coupon.discountType} • {coupon.discountValue}</p>
            <p>{coupon.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCouponsPage;
