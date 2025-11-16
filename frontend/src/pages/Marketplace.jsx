import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSeedling, FaSearch, FaFilter, FaUser, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { productApi } from '../api/productApi';
import ProductCard from '../components/ProductCard';

const Marketplace = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: '',
    status: 'active',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };
      
      const response = await productApi.getAllProducts(params);
      
      if (response.success) {
        setProducts(response.data.products);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      // Don't show error toast if it's just an empty result
      if (error.message && !error.message.includes('Network')) {
        toast.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDashboard = () => {
    if (user) {
      const dashboardPath = user.role === 'farmer' ? '/farmer/dashboard' :
                           user.role === 'buyer' ? '/buyer/dashboard' :
                           '/transporter/dashboard';
      navigate(dashboardPath);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/marketplace" className="navbar-logo">
            <FaSeedling /> FarmNet
          </Link>
          
          <div className="navbar-menu">
            <Link to="/marketplace" className="navbar-link active">
              Marketplace
            </Link>
            
            {user ? (
              <>
                <button onClick={handleDashboard} className="navbar-link">
                  <FaUser /> Dashboard
                </button>
                <button onClick={onLogout} className="navbar-link">
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Discover Fresh Produce
          </h1>
          <p style={{ color: 'var(--text-light)' }}>
            Browse products from verified farmers across the country
          </p>
        </div>

        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
            <div>
              <label className="form-label">
                <FaSearch /> Search
              </label>
              <input
                type="text"
                name="search"
                className="input"
                placeholder="Search products..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label className="form-label">
                <FaFilter /> Category
              </label>
              <select
                name="category"
                className="select"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="pulses">Pulses</option>
                <option value="spices">Spices</option>
                <option value="dairy">Dairy</option>
                <option value="organic">Organic</option>
              </select>
            </div>

            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="input"
                placeholder="Enter city..."
                value={filters.city}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                name="status"
                className="select"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="active">Active</option>
                <option value="bidding">Bidding</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-3">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={pagination.page === page ? 'active' : ''}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-light)' }}>
              No products found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;