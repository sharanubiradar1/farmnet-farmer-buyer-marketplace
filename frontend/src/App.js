import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import ProductDetails from './pages/ProductDetails';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import TransporterDashboard from './pages/TransporterDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to={
                  user.role === 'farmer' ? '/farmer/dashboard' :
                  user.role === 'buyer' ? '/buyer/dashboard' :
                  '/transporter/dashboard'
                } />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          
          <Route 
            path="/register" 
            element={
              user ? (
                <Navigate to={
                  user.role === 'farmer' ? '/farmer/dashboard' :
                  user.role === 'buyer' ? '/buyer/dashboard' :
                  '/transporter/dashboard'
                } />
              ) : (
                <Register onRegister={handleLogin} />
              )
            } 
          />
          
          <Route 
            path="/marketplace" 
            element={<Marketplace user={user} onLogout={handleLogout} />} 
          />
          
          <Route 
            path="/product/:id" 
            element={<ProductDetails user={user} onLogout={handleLogout} />} 
          />
          
          <Route 
            path="/farmer/dashboard" 
            element={
              user && user.role === 'farmer' ? (
                <FarmerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          <Route 
            path="/buyer/dashboard" 
            element={
              user && user.role === 'buyer' ? (
                <BuyerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          <Route 
            path="/transporter/dashboard" 
            element={
              user && user.role === 'transporter' ? (
                <TransporterDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          <Route 
            path="/" 
            element={<Navigate to="/marketplace" />} 
          />
          
          <Route 
            path="*" 
            element={<Navigate to="/marketplace" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;