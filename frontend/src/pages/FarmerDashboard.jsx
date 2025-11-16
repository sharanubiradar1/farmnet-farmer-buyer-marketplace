import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSeedling, FaBox, FaGavel, FaTruck, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { productApi } from '../api/productApi';
import { bidApi } from '../api/bidApi';
import { userApi } from '../api/userApi';
import { formatDistanceToNow } from 'date-fns';

const FarmerDashboard = ({ user, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [bids, setBids] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, bids: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: {
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      pincode: user.address?.pincode || '',
    }
  });
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetables',
    description: '',
    quantity: { value: '', unit: 'kg' },
    basePrice: '',
    minimumBidIncrement: 10,
    harvestDate: '',
    biddingEndTime: '',
    images: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, bidsRes] = await Promise.all([
        productApi.getMyProducts(),
        bidApi.getBidsOnMyProducts()
      ]);

      if (productsRes.success) {
        setProducts(productsRes.data.products);
        setStats({
          total: productsRes.data.products.length,
          active: productsRes.data.products.filter(p => p.status === 'active').length,
          sold: productsRes.data.products.filter(p => p.status === 'sold').length,
          bids: bidsRes.data?.bids?.length || 0,
        });
      }

      if (bidsRes.success) {
        setBids(bidsRes.data.bids);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('quantity.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        quantity: { ...prev.quantity, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, images: e.target.files }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await userApi.updateProfile(profileData);
      if (response.success) {
        toast.success('Profile updated successfully!');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setShowUpdateProfile(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.quantity.value || !formData.basePrice) {
      toast.error('Please fill all required fields: Name, Description, Quantity, and Price');
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    if (!user.address || !user.address.city || !user.address.state || !user.address.pincode) {
      toast.error('Your profile address is incomplete. Please update your profile first.');
      return;
    }
    
    try {
      const productData = {
        ...formData,
        location: {
          address: user.address.street || '',
          city: user.address.city,
          state: user.address.state,
          pincode: user.address.pincode,
        },
        availableFrom: new Date().toISOString(),
        availableUntil: formData.biddingEndTime,
      };

      console.log('Submitting product data:', productData);
      const response = await productApi.createProduct(productData);
      
      if (response.success) {
        toast.success('Product created successfully!');
        setShowAddProduct(false);
        fetchDashboardData();
        // Reset form
        setFormData({
          name: '',
          category: 'vegetables',
          description: '',
          quantity: { value: '', unit: 'kg' },
          basePrice: '',
          minimumBidIncrement: 10,
          harvestDate: '',
          biddingEndTime: '',
          images: null,
        });
      }
    } catch (error) {
      console.error('Create product error:', error);
      
      // Show detailed error messages
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => toast.error(err));
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create product. Please check all fields.');
      }
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to accept this bid?')) return;
    
    try {
      const response = await bidApi.acceptBid(bidId);
      if (response.success) {
        toast.success('Bid accepted successfully!');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to accept bid');
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
                <FaBox /> My Products
              </a>
            </li>
            <li className="sidebar-item">
              <a href="#bids" className="sidebar-link">
                <FaGavel /> Received Bids
              </a>
            </li>
            <li className="sidebar-item">
              <a href="#transports" className="sidebar-link">
                <FaTruck /> Transports
              </a>
            </li>
          </ul>
        </aside>

        <main className="dashboard-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Farmer Dashboard</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowUpdateProfile(true)} className="btn btn-outline">
                Update Profile
              </button>
              <button onClick={() => setShowAddProduct(true)} className="btn btn-primary">
                <FaPlus /> Add Product
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary">
                <FaBox />
              </div>
              <div className="stat-content">
                <h3>Total Products</h3>
                <p>{stats.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <FaBox />
              </div>
              <div className="stat-content">
                <h3>Active Listings</h3>
                <p>{stats.active}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <FaGavel />
              </div>
              <div className="stat-content">
                <h3>Total Bids</h3>
                <p>{stats.bids}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon secondary">
                <FaBox />
              </div>
              <div className="stat-content">
                <h3>Sold Products</h3>
                <p>{stats.sold}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="card">
                <h2 style={{ marginBottom: '1rem' }}>My Products</h2>
                {products.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Bids</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product._id}>
                            <td>{product.name}</td>
                            <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                            <td>₹{product.currentPrice?.toLocaleString('en-IN')}</td>
                            <td>{product.totalBids || 0}</td>
                            <td>
                              <span className={`badge badge-${product.status === 'active' ? 'success' : product.status === 'sold' ? 'danger' : 'warning'}`}>
                                {product.status}
                              </span>
                            </td>
                            <td>{formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                    No products yet. Add your first product!
                  </p>
                )}
              </div>

              <div className="card" style={{ marginTop: '2rem' }} id="bids">
                <h2 style={{ marginBottom: '1rem' }}>Received Bids</h2>
                {bids.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Buyer</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.map(bid => (
                          <tr key={bid._id}>
                            <td>{bid.product?.name}</td>
                            <td>{bid.buyer?.name}</td>
                            <td>₹{bid.amount?.toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge badge-${bid.status === 'active' ? 'success' : 'info'}`}>
                                {bid.status}
                              </span>
                            </td>
                            <td>{formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}</td>
                            <td>
                              {bid.status === 'active' && (
                                <button onClick={() => handleAcceptBid(bid._id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                  Accept
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
                    No bids received yet
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Product</h2>
              <button className="modal-close" onClick={() => setShowAddProduct(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Product Name</label>
                  <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Category</label>
                  <select name="category" className="select" value={formData.category} onChange={handleChange} required>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="pulses">Pulses</option>
                    <option value="spices">Spices</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Description</label>
                  <textarea name="description" className="textarea" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Quantity</label>
                    <input type="number" name="quantity.value" className="input" value={formData.quantity.value} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Unit</label>
                    <select name="quantity.unit" className="select" value={formData.quantity.unit} onChange={handleChange}>
                      <option value="kg">Kg</option>
                      <option value="quintal">Quintal</option>
                      <option value="ton">Ton</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label required">Base Price (₹)</label>
                  <input type="number" name="basePrice" className="input" value={formData.basePrice} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Harvest Date</label>
                  <input type="date" name="harvestDate" className="input" value={formData.harvestDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Bidding End Time</label>
                  <input type="datetime-local" name="biddingEndTime" className="input" value={formData.biddingEndTime} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Product Images</label>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddProduct(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateProfile && (
        <div className="modal-overlay" onClick={() => setShowUpdateProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Update Profile</h2>
              <button className="modal-close" onClick={() => setShowUpdateProfile(false)}>×</button>
            </div>
            <form onSubmit={handleProfileUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Full Name</label>
                  <input type="text" name="name" className="input" value={profileData.name} onChange={handleProfileChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Phone Number</label>
                  <input type="tel" name="phone" className="input" value={profileData.phone} onChange={handleProfileChange} pattern="[0-9]{10}" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input type="text" name="address.street" className="input" value={profileData.address.street} onChange={handleProfileChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">City</label>
                    <input type="text" name="address.city" className="input" value={profileData.address.city} onChange={handleProfileChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">State</label>
                    <input type="text" name="address.state" className="input" value={profileData.address.state} onChange={handleProfileChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Pincode</label>
                    <input type="text" name="address.pincode" className="input" value={profileData.address.pincode} onChange={handleProfileChange} pattern="[0-9]{6}" required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowUpdateProfile(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;