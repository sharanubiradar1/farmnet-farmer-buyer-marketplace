const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. No token provided.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.'
        });
      }

      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Token is invalid or expired.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route.`,
        requiredRoles: roles
      });
    }

    next();
  };
};

const optional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.active) {
        req.user = user;
      }
    } catch (error) {
      console.log('Optional auth: Invalid token, continuing as guest');
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

const verifyOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resourceId = req.params.id;
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }

      const ownerField = modelName.toLowerCase() === 'product' ? 'farmer' : 
                        modelName.toLowerCase() === 'bid' ? 'buyer' : 'transporter';
      
      if (resource[ownerField].toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to modify this ${modelName.toLowerCase()}`
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying ownership'
      });
    }
  };
};

const rateLimitByUser = (maxRequests, windowMs) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }

    recentRequests.push(now);
    requests.set(userId, recentRequests);

    setTimeout(() => {
      const userReqs = requests.get(userId);
      if (userReqs) {
        const filtered = userReqs.filter(time => now - time < windowMs);
        if (filtered.length === 0) {
          requests.delete(userId);
        } else {
          requests.set(userId, filtered);
        }
      }
    }, windowMs);

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optional,
  verifyOwnership,
  rateLimitByUser
};