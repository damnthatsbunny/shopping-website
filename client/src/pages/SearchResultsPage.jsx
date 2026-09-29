import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        setError('Search failed');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="container search-page">
      <div className="section-header">
        <h2>Search results</h2>
        <Link to="/products">Browse products</Link>
      </div>

      {loading ? <div className="page-loading">Searching...</div> : error ? <div className="page-error">{error}</div> : (
        <>
          {query ? <p className="results-summary">Showing results for “{query}”</p> : <p className="results-summary">Enter a search term</p>}
          {results.length === 0 ? <div className="empty-state">No results found. Try a different keyword or category.</div> : <div className="product-grid">{results.map((product) => <ProductCard key={product._id} product={product} />)}</div>}
        </>
      )}
    </div>
  );
};

export default SearchResultsPage;
