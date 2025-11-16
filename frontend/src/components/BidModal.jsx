import React, { useState } from 'react';
import { FaTimes, FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { bidApi } from '../api/bidApi';
import './BidModal.css';

const BidModal = ({ product, onClose, onBidPlaced }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: product.currentPrice + product.minimumBidIncrement,
    message: '',
    deliveryPreference: 'negotiable',
    paymentMethod: 'bank_transfer',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.amount < product.currentPrice + product.minimumBidIncrement) {
      toast.error(`Bid amount must be at least ₹${product.currentPrice + product.minimumBidIncrement}`);
      return;
    }

    setLoading(true);
    
    try {
      const bidData = {
        productId: product._id,
        amount: parseFloat(formData.amount),
        message: formData.message,
        deliveryPreference: formData.deliveryPreference,
        paymentMethod: formData.paymentMethod,
      };

      const response = await bidApi.createBid(bidData);
      
      if (response.success) {
        toast.success('Bid placed successfully!');
        onBidPlaced(response.data.bid);
        onClose();
      }
    } catch (error) {
      console.error('Bid error:', error);
      toast.error(error.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Place Your Bid</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="bid-product-info">
            <img 
              src={product.images?.[0] || '/placeholder.jpg'} 
              alt={product.name}
              className="bid-product-image"
            />
            <div>
              <h3>{product.name}</h3>
              <p className="current-price">
                Current Price: <FaRupeeSign /> {product.currentPrice.toLocaleString('en-IN')}
              </p>
              <p className="min-increment">
                Min Increment: <FaRupeeSign /> {product.minimumBidIncrement}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Your Bid Amount</label>
              <div className="input-with-icon">
                <FaRupeeSign className="input-icon" />
                <input
                  type="number"
                  name="amount"
                  className="input input-with-padding"
                  value={formData.amount}
                  onChange={handleChange}
                  min={product.currentPrice + product.minimumBidIncrement}
                  step="1"
                  required
                />
              </div>
              <p className="form-help">
                Minimum bid: ₹{(product.currentPrice + product.minimumBidIncrement).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Preference</label>
              <select
                name="deliveryPreference"
                className="select"
                value={formData.deliveryPreference}
                onChange={handleChange}
              >
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                name="paymentMethod"
                className="select"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="crypto">Crypto</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message (Optional)</label>
              <textarea
                name="message"
                className="textarea"
                value={formData.message}
                onChange={handleChange}
                placeholder="Add any additional notes..."
                rows="3"
              />
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Placing Bid...' : 'Place Bid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BidModal;