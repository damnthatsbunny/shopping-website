import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const HomePage = () => {
  const [homeData, setHomeData] = useState({ featured: [], trending: [], recommended: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/products/home');
        setHomeData(res.data);
      } catch (err) {
        setError('Unable to load homepage products');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) return <div className="page-loading">Loading products...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <>
      <section className="hero-section container">
        <div className="hero-copy">
          <span className="eyebrow">The Urbancart edit</span>
          <h1>Good finds. Better everyday.</h1>
          <p>Shop thoughtful picks across tech, fashion, home and self-care, all in one place.</p>
          <div className="cta-row">
            <Link to="/products" className="primary-button">Shop all products</Link>
            <Link to="/products?category=Electronics" className="secondary-button">Explore tech</Link>
          </div>
          <div className="hero-benefits">
            <span>Free delivery over ₹999</span>
            <span>Easy 7-day returns</span>
          </div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85" alt="Curated fashion and lifestyle collection" />
          <div className="hero-note"><strong>Find your next favourite</strong><span>New season picks, picked for you</span></div>
        </div>
      </section>

      <section className="container category-section">
        <div className="section-header">
          <h2>Shop by category</h2>
          <Link to="/products">Browse everything</Link>
        </div>
        <div className="category-grid">
          <Link to="/products?category=Electronics" className="category-tile">
            <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" alt="" />
            <span>Electronics</span>
          </Link>
          <Link to="/products?category=Fashion" className="category-tile">
            <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80" alt="" />
            <span>Fashion</span>
          </Link>
          <Link to="/products?category=Home%20%26%20Kitchen" className="category-tile">
            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80" alt="" />
            <span>Home &amp; Kitchen</span>
          </Link>
          <Link to="/products?category=Beauty" className="category-tile">
            <img src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80" alt="" />
            <span>Beauty &amp; care</span>
          </Link>
        </div>
      </section>

      <section className="container">
        <div className="section-header">
          <div><span className="section-kicker">Handpicked for you</span><h2>Featured picks</h2></div>
          <Link to="/products">View all</Link>
        </div>
        <div className="product-grid">
          {homeData.featured.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section className="container promo-strip">
        <div className="promo-copy">
          <span className="eyebrow">The everyday upgrade</span>
          <h2>Small upgrades. Big difference.</h2>
          <p>Discover smart finds for your home, routine and weekend plans.</p>
          <Link to="/products" className="primary-button small">Shop the collection</Link>
        </div>
        <img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85" alt="Warm, considered home interior" />
      </section>

      <section className="container">
        <div className="section-header">
          <div><span className="section-kicker">Popular right now</span><h2>Trending now</h2></div>
          <Link to="/products">Shop trending</Link>
        </div>
        <div className="product-grid">
          {homeData.trending.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section className="container">
        <div className="section-header">
          <div><span className="section-kicker">A little inspiration</span><h2>Worth a look</h2></div>
          <Link to="/products">Personalized picks</Link>
        </div>
        <div className="product-grid">
          {homeData.recommended.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
