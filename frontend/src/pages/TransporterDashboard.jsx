import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSeedling, FaTruck, FaMapMarkerAlt, FaSignOutAlt, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { transportApi } from '../api/transportApi';
import { formatDistanceToNow } from 'date-fns';

const TransporterDashboard = ({ user, onLogout }) => {
  const [transports, setTransports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await transportApi.getMyTransports();
      
      if (response.success) {
        setTransports(response.data.transports);
        setStats({
          total: response.data.transports.length,
          pending: response.data.transports.filter(t => t.status === 'pending').length,
          inTransit: response.data.transports.filter(t => t.status === 'in_transit').length,
          delivered: response.data.transports.filter(t => t.status === 'delivered').length,
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transportId, newStatus) => {
    try {
      const response = await transportApi.updateTransportStatus(transportId, { status: newStatus });
      if (response.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'warning',
      confirmed: 'info',
      in_transit: 'primary',
      picked_up: 'success',
      delivered: 'success',
      cancelled: 'danger',
    };
    return badges[status] || 'info';
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
                <FaTruck /> All Transports
              </a>
            </li>
            <li className="sidebar-item">
              <a href="#active" className="sidebar-link">
                <FaClock /> Active Deliveries
              </a>
            </li>
            <li className="sidebar-item">
              <a href="#completed" className="sidebar-link">
                <FaMapMarkerAlt /> Completed
              </a>
            </li>
          </ul>
        </aside>

        <main className="dashboard-content">
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Transporter Dashboard</h1>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary">
                <FaTruck />
              </div>
              <div className="stat-content">
                <h3>Total Transports</h3>
                <p>{stats.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <FaClock />
              </div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p>{stats.pending}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon secondary">
                <FaTruck />
              </div>
              <div className="stat-content">
                <h3>In Transit</h3>
                <p>{stats.inTransit}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <FaMapMarkerAlt />
              </div>
              <div className="stat-content">
                <h3>Delivered</h3>
                <p>{stats.delivered}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="card">
                <h2 style={{ marginBottom: '1rem' }}>All Transports</h2>
                {transports.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Cost</th>
                          <th>Status</th>
                          <th>Pickup Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transports.map(transport => (
                          <tr key={transport._id}>
                            <td>{transport.product?.name}</td>
                            <td>{transport.pickupLocation?.city}</td>
                            <td>{transport.deliveryLocation?.city}</td>
                            <td style={{ fontWeight: 'bold' }}>₹{transport.cost?.total?.toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge badge-${getStatusBadge(transport.status)}`}>
                                {transport.status}
                              </span>
                            </td>
                            <td>{formatDistanceToNow(new Date(transport.scheduledPickupTime), { addSuffix: true })}</td>
                            <td>
                              {transport.status === 'confirmed' && (
                                <button onClick={() => handleUpdateStatus(transport._id, 'in_transit')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                  Start
                                </button>
                              )}
                              {transport.status === 'in_transit' && (
                                <button onClick={() => handleUpdateStatus(transport._id, 'delivered')} className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                  Deliver
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
                    No transports assigned yet
                  </p>
                )}
              </div>

              <div className="card" style={{ marginTop: '2rem' }} id="active">
                <h2 style={{ marginBottom: '1rem' }}>Active Deliveries</h2>
                {transports.filter(t => ['confirmed', 'in_transit', 'picked_up'].includes(t.status)).length > 0 ? (
                  <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    {transports.filter(t => ['confirmed', 'in_transit', 'picked_up'].includes(t.status)).map(transport => (
                      <div key={transport._id} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{transport.product?.name}</h3>
                          <span className={`badge badge-${getStatusBadge(transport.status)}`}>
                            {transport.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Pickup</div>
                            <div style={{ fontWeight: '500' }}>
                              {transport.pickupLocation?.address}, {transport.pickupLocation?.city}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Delivery</div>
                            <div style={{ fontWeight: '500' }}>
                              {transport.deliveryLocation?.address}, {transport.deliveryLocation?.city}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                            <div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Distance</div>
                              <div style={{ fontWeight: '600' }}>{transport.distance?.value} {transport.distance?.unit}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Cost</div>
                              <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                ₹{transport.cost?.total?.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                    No active deliveries
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

export default TransporterDashboard;