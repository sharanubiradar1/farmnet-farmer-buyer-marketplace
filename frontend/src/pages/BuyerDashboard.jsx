import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSeedling, FaGavel, FaTruck, FaCheckCircle, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { bidApi } from '../api/bidApi';
import { formatDistanceToNow } from 'date-fns';

const BuyerDashboard = ({ user, onLogout }) => {
  const [bids, setBids] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await bidApi.getMyBids();
      
      if (response.success) {
        setBids(response.data.bids);
        setStats({
          total: response.data.bids.length,
          active: response.data.bids.filter(b => b.status === 'active').length,
          accepted: response.data.bids.filter(b => b.status === 'accepted').length,
          rejected: response.data.bids.filter(b => b.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to withdraw this bid?')) return;
    
    try {
      const response = await bidApi.withdrawBid(bidId);
      if (response.success) {
        toast.success('Bid withdrawn successfully!');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to withdraw bid');
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
            <Link to="/marketplace" className="navbar-link">Marketplace</Link>
            <span className="navbar-link">Welcome, {user.name}</span>
            <button onClick={onLogout} className="navbar-link">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <a href="#" className="sidebar-link active">
                <FaGavel /> My Bids
              </a>
            </li>
            <li className="sidebar-item">
              <a href="#accepted" className="sidebar-link">
                <FaCheckCircle /> Accepted Bids
              </a>
            </li>
            <li className="sidebar-item">
              <a href="#transports" className="sidebar-link">
                <FaTruck /> My Orders
              </a>
            </li>
          </ul>
        </aside>

        <main className="dashboard-content">
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Buyer Dashboard</h1>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary">
                <FaGavel />
              </div>
              <div className="stat-content">
                <h3>Total Bids</h3>
                <p>{stats.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <FaGavel />
              </div>
              <div className="stat-content">
                <h3>Active Bids</h3>
                <p>{stats.active}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <h3>Accepted</h3>
                <p>{stats.accepted}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon secondary">
                <FaGavel />
              </div>
              <div className="stat-content">
                <h3>Rejected</h3>
                <p>{stats.rejected}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="card">
                <h2 style={{ marginBottom: '1rem' }}>My Bids</h2>
                {bids.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>My Bid</th>
                          <th>Current Price</th>
                          <th>Status</th>
                          <th>Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.map(bid => (
                          <tr key={bid._id}>
                            <td>
                              <Link to={`/product/${bid.product?._id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                {bid.product?.name}
                              </Link>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>{bid.product?.category}</td>
                            <td style={{ fontWeight: 'bold' }}>₹{bid.amount?.toLocaleString('en-IN')}</td>
                            <td>₹{bid.product?.currentPrice?.toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge badge-${
                                bid.status === 'active' ? 'success' :
                                bid.status === 'accepted' ? 'info' :
                                bid.status === 'rejected' ? 'danger' : 'warning'
                              }`}>
                                {bid.status}
                              </span>
                            </td>
                            <td>{formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}</td>
                            <td>
                              {bid.status === 'active' && (
                                <button onClick={() => handleWithdrawBid(bid._id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                  Withdraw
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                    No bids yet. Visit the marketplace to start bidding!
                  </p>
                )}
              </div>

              <div className="card" style={{ marginTop: '2rem' }} id="accepted">
                <h2 style={{ marginBottom: '1rem' }}>Accepted Bids</h2>
                {bids.filter(b => b.status === 'accepted').length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Amount</th>
                          <th>Farmer</th>
                          <th>Contact</th>
                          <th>Accepted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.filter(b => b.status === 'accepted').map(bid => (
                          <tr key={bid._id}>
                            <td>{bid.product?.name}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                              ₹{bid.amount?.toLocaleString('en-IN')}
                            </td>
                            <td>{bid.product?.farmer?.name}</td>
                            <td>{bid.product?.farmer?.phone}</td>
                            <td>{formatDistanceToNow(new Date(bid.response?.respondedAt || bid.updatedAt), { addSuffix: true })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                    No accepted bids yet
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default BuyerDashboard;