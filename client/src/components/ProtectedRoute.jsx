import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, authError, retryAuth } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Loading account...</div>;
  }

  if (authError) {
    return <div className="container page-error" role="alert">{authError} <button className="secondary-button small" onClick={retryAuth}>Retry</button></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
