import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCart = async () => {
    if (!token) {
      setItems([]);
      setError('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.get('/cart');
      setItems(res.data);
    } catch (error) {
      console.error('Failed to load cart', error);
      setError(error.response?.data?.message || 'Your cart could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [token]);

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [items]
  );

  const addItem = async (productId, quantity = 1, size = '', color = '') => {
    const res = await api.post('/cart', { productId, quantity, size, color });
    setItems(res.data);
    return res.data;
  };

  const updateItem = async (itemId, quantity) => {
    const res = await api.put(`/cart/${itemId}`, { quantity });
    setItems(res.data);
    return res.data;
  };

  const removeItem = async (itemId) => {
    const res = await api.delete(`/cart/${itemId}`);
    setItems(res.data);
    return res.data;
  };

  const value = useMemo(() => ({ items, loading, error, totalQuantity, addItem, updateItem, removeItem, reloadCart: loadCart, setItems }), [items, loading, error, totalQuantity, token]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
