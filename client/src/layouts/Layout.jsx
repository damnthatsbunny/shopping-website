import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHeart, FiSearch, FiShoppingCart, FiUser, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { totalQuantity: cartQuantity } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="site-header">
        <div className="topbar">
          <div className="container topbar-inner">
            <span>Free shipping on orders above ₹999</span>
            <span>New season launch: up to 60% off</span>
          </div>
        </div>
        <div className="container nav-wrap">
          <div className="logo-block">
            <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><FiMenu /></button>
            <Link to="/" className="brand-logo">
              <span className="brand-mark">U</span>
              Urbancart
            </Link>
          </div>

          <form className="search-box" onSubmit={handleSearch}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search products, brands, categories"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            {user ? (
              <>
                <NavLink to="/profile">{user.name}</NavLink>
                {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
                <button className="link-button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            )}
            <NavLink to="/wishlist" className="nav-icon-link">
              <FiHeart />
              <span>{wishlistItems.length}</span>
            </NavLink>
            <NavLink to="/cart" className="nav-icon-link">
              <FiShoppingCart />
              <span>{cartQuantity}</span>
            </NavLink>
            <NavLink to="/profile" className="nav-icon-link"><FiUser /></NavLink>
          </nav>
        </div>
      </header>

      <div className="category-bar">
        <div className="container category-links">
          <NavLink to="/products?category=Fashion">Fashion</NavLink>
          <NavLink to="/products?category=Electronics">Electronics</NavLink>
          <NavLink to="/products?category=Home%20%26%20Kitchen">Home & Kitchen</NavLink>
          <NavLink to="/products?category=Beauty">Beauty</NavLink>
        </div>
      </div>

      <main className="page-shell">{children}</main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h4>Urbancart</h4>
            <p>Shop smarter for the way you live.</p>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li>About us</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h5>Help</h5>
            <ul>
              <li>Shipping</li>
              <li>Returns</li>
              <li>FAQs</li>
            </ul>
          </div>
          <div>
            <h5>Categories</h5>
            <ul>
              <li>Fashion</li>
              <li>Electronics</li>
              <li>Home</li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;
