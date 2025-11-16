import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaRupeeSign, FaEye } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'badge-success', text: 'Active' },
      bidding: { class: 'badge-warning', text: 'Bidding' },
      sold: { class: 'badge-danger', text: 'Sold' },
      expired: { class: 'badge-info', text: 'Expired' },
      cancelled: { class: 'badge-danger', text: 'Cancelled' },
    };
    return badges[status] || badges.active;
  };

  const getTimeRemaining = () => {
    const endTime = new Date(product.biddingEndTime);
    const now = new Date();
    
    if (endTime < now) {
      return 'Expired';
    }
    
    return formatDistanceToNow(endTime, { addSuffix: true });
  };

  const statusBadge = getStatusBadge(product.status);

  return (
    <div 
      className="product-card" 
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="product-image-container">
        <img 
          src={product.images?.[0] || '/placeholder.jpg'} 
          alt={product.name}
          className="product-image"
        />
        <span className={`product-badge ${statusBadge.class}`}>
          {statusBadge.text}
        </span>
        {product.quality?.grade && (
          <span className="product-grade">Grade {product.quality.grade}</span>
        )}
      </div>
      
      <div className="product-card-body">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        
        <p className="product-description">
          {product.description.length > 80 
            ? `${product.description.substring(0, 80)}...` 
            : product.description}
        </p>
        
        <div className="product-info">
          <div className="info-item">
            <FaMapMarkerAlt />
            <span>{product.location?.city}, {product.location?.state}</span>
          </div>
          
          <div className="info-item">
            <FaClock />
            <span>{getTimeRemaining()}</span>
          </div>
        </div>
        
        <div className="product-quantity">
          <span className="quantity-label">Quantity:</span>
          <span className="quantity-value">
            {product.quantity?.value} {product.quantity?.unit}
          </span>
        </div>
        
        <div className="product-footer">
          <div className="product-price">
            <span className="price-label">Current Price</span>
            <div className="price-value">
              <FaRupeeSign />
              <span>{product.currentPrice?.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div className="product-stats">
            <div className="stat-item">
              <FaEye />
              <span>{product.views || 0}</span>
            </div>
            <div className="stat-item">
              <span className="bid-count">{product.totalBids || 0} bids</span>
            </div>
          </div>
        </div>
        
        {product.farmer && (
          <div className="product-farmer">
            <span>By: {product.farmer.name}</span>
            {product.farmer.verified && (
              <span className="verified-badge">✓ Verified</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;