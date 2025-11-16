import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSeedling, FaMapMarkerAlt, FaClock, FaRupeeSign, FaUser, FaGavel, FaArrowLeft } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { productApi } from '../api/productApi';
import { bidApi } from '../api/bidApi';
import BidModal from '../components/BidModal';
import { initializeSocket, joinProductRoom, leaveProductRoom, onBidUpdate } from '../socket/bidSocket';

const ProductDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProductDetails();
    fetchBids();

    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);
      if (socket) {
        joinProductRoom(id);
        
        onBidUpdate((data) => {
          if (data.productId === id) {
            setProduct(prev => ({
              ...prev,
              currentPrice: data.newPrice || prev.currentPrice,
              totalBids: data.totalBids || prev.totalBids,
            }));
            fetchBids();
            toast.success('New bid placed!');
          }
        });
      }
    }

    return () => {
      leaveProductRoom(id);
    };
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await productApi.getProductById(id);
      if (response.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    if (!user) return;
    
    try {
      const response = await bidApi.getBidsByProduct(id);
      if (response.success) {
        setBids(response.data.bids);
      }
    } catch (error) {
      console.error('Fetch bids error:', error);
    }
  };

  const handleBidPlaced = () => {
    fetchProductDetails();
    fetchBids();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ paddingTop: '2rem', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const canPlaceBid = user && user.role === 'buyer' && product.status === 'active' && new Date(product.biddingEndTime) > new Date();

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/marketplace" className="navbar-logo">
            <FaSeedling /> FarmNet
          </Link>
          <div className="navbar-menu">
            <Link to="/marketplace" className="navbar-link">
              Marketplace
            </Link>
            {user && (
              <button onClick={onLogout} className="navbar-link">
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem' }}>
          <FaArrowLeft /> Back
        </button>

        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <img
                src={product.images?.[selectedImage]}
                alt={product.name}
                style={{ width: '100%', height: '400px', objectFit: 'cover' }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      border: selectedImage === idx ? '3px solid var(--primary)' : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="card">
              <span className="badge badge-success">{product.status}</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>
                {product.name}
              </h1>
              <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
                {product.description}
              </p>

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Current Price</div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', gap: '0.5rem' }}>
                  <FaRupeeSign />
                  <span>{product.currentPrice?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  Base Price: ₹{product.basePrice?.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Quantity</div>
                  <div style={{ fontWeight: '600' }}>{product.quantity?.value} {product.quantity?.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Total Bids</div>
                  <div style={{ fontWeight: '600' }}>{product.totalBids || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Category</div>
                  <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{product.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Quality Grade</div>
                  <div style={{ fontWeight: '600' }}>{product.quality?.grade || 'N/A'}</div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FaMapMarkerAlt />
                  <span>{product.location?.city}, {product.location?.state} - {product.location?.pincode}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaClock />
                  <span>Bidding ends {formatDistanceToNow(new Date(product.biddingEndTime), { addSuffix: true })}</span>
                </div>
              </div>

              {canPlaceBid && (
                <button
                  onClick={() => setShowBidModal(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.5rem' }}
                >
                  <FaGavel /> Place Bid
                </button>
              )}

              {!user && (
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', textAlign: 'center', display: 'block' }}>
                  Login to Place Bid
                </Link>
              )}
            </div>

            {product.farmer && (
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Farmer Details</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaUser style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{product.farmer.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{product.farmer.email}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{product.farmer.phone}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {user && bids.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Recent Bids</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map(bid => (
                    <tr key={bid._id}>
                      <td>{bid.buyer?.name}</td>
                      <td>₹{bid.amount?.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge badge-${bid.status === 'active' ? 'success' : 'info'}`}>
                          {bid.status}
                        </span>
                      </td>
                      <td>{formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showBidModal && (
        <BidModal
          product={product}
          onClose={() => setShowBidModal(false)}
          onBidPlaced={handleBidPlaced}
        />
      )}
    </div>
  );
};

export default ProductDetails;