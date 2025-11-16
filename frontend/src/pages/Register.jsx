import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaSeedling } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { userApi } from '../api/userApi';
import './Auth.css';

const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    transporterDetails: {
      vehicleType: '',
      vehicleNumber: '',
      capacity: '',
    },
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else if (name.startsWith('transporterDetails.')) {
      const detailField = name.split('.')[1];
      setFormData({
        ...formData,
        transporterDetails: {
          ...formData.transporterDetails,
          [detailField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      
      // Only include transporterDetails if role is transporter
      if (registerData.role === 'transporter') {
        if (!registerData.transporterDetails.vehicleType || 
            !registerData.transporterDetails.vehicleNumber || 
            !registerData.transporterDetails.capacity) {
          toast.error('Please fill all transporter details');
          setLoading(false);
          return;
        }
        registerData.transporterDetails.capacity = parseInt(registerData.transporterDetails.capacity);
      } else {
        delete registerData.transporterDetails;
      }
      
      const response = await userApi.register(registerData);
      
      if (response.success) {
        toast.success('Registration successful!');
        onRegister(response.data.user, response.data.token);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Display detailed error messages
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => toast.error(err));
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <div className="auth-header">
          <div className="auth-logo">
            <FaSeedling />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join FarmNet marketplace today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  className="input input-with-padding"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Email Address</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="input input-with-padding"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Password</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="password"
                  className="input input-with-padding"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Confirm Password</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  className="input input-with-padding"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Role</label>
              <select
                name="role"
                className="select"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="buyer">Buyer</option>
                <option value="farmer">Farmer</option>
                <option value="transporter">Transporter</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Phone Number</label>
              <div className="input-with-icon">
                <FaPhone className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  className="input input-with-padding"
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <div className="input-with-icon">
              <FaMapMarkerAlt className="input-icon" />
              <input
                type="text"
                name="address.street"
                className="input input-with-padding"
                placeholder="House no., Street name"
                value={formData.address.street}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">City</label>
              <input
                type="text"
                name="address.city"
                className="input"
                placeholder="City"
                value={formData.address.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">State</label>
              <input
                type="text"
                name="address.state"
                className="input"
                placeholder="State"
                value={formData.address.state}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Pincode</label>
              <input
                type="text"
                name="address.pincode"
                className="input"
                placeholder="6-digit pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                pattern="[0-9]{6}"
                required
              />
            </div>
          </div>

          {formData.role === 'transporter' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Vehicle Type</label>
                  <select
                    name="transporterDetails.vehicleType"
                    className="select"
                    value={formData.transporterDetails.vehicleType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="tempo">Tempo</option>
                    <option value="refrigerated">Refrigerated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Vehicle Number</label>
                  <input
                    type="text"
                    name="transporterDetails.vehicleNumber"
                    className="input"
                    placeholder="KA01AB1234"
                    value={formData.transporterDetails.vehicleNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Capacity (in kg)</label>
                <input
                  type="number"
                  name="transporterDetails.capacity"
                  className="input"
                  placeholder="e.g., 1000"
                  value={formData.transporterDetails.capacity}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;