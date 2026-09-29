import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  const loadWishlist = async () => {
    if (!token) {
      setItems([]);
      return;
    }

    try {
      const res = await api.get('/wishlist');
      setItems(res.data);
    } catch (error) {
      console.error('Failed to load wishlist', error);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [token]);

  const addItem = async (productId) => {
    const res = await api.post('/wishlist', { productId });
    setItems(res.data);
    return res.data;
  };

  const removeItem = async (productId) => {
    const res = await api.delete(`/wishlist/${productId}`);
    setItems(res.data);
    return res.data;
  };

  const value = useMemo(() => ({ items, addItem, removeItem, reloadWishlist: loadWishlist }), [items, token]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
