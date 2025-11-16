const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { deleteFile, getFileUrl } = require('../utils/localUpload');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Parse address - handle both JSON and FormData formats
    let address;
    if (req.body.address && typeof req.body.address === 'object') {
      // JSON format
      address = req.body.address;
    } else {
      // FormData format
      address = {
        street: req.body['address[street]'] || '',
        city: req.body['address[city]'],
        state: req.body['address[state]'],
        pincode: req.body['address[pincode]'],
        country: req.body['address[country]'] || 'India'
      };
    }

    const userData = {
      name,
      email,
      password,
      role,
      phone,
      address
    };

    // Parse role-specific details - handle both JSON and FormData
    if (role === 'farmer') {
      if (req.body.farmerDetails && typeof req.body.farmerDetails === 'object') {
        userData.farmerDetails = req.body.farmerDetails;
      } else {
        userData.farmerDetails = {
          farmSize: req.body['farmerDetails[farmSize]'] || undefined,
          farmType: req.body['farmerDetails[farmType]'] || undefined,
          experience: req.body['farmerDetails[experience]'] || undefined,
          certifications: req.body['farmerDetails[certifications]'] || []
        };
      }
    } else if (role === 'buyer') {
      if (req.body.buyerDetails && typeof req.body.buyerDetails === 'object') {
        userData.buyerDetails = req.body.buyerDetails;
      } else {
        userData.buyerDetails = {
          businessName: req.body['buyerDetails[businessName]'] || undefined,
          gstNumber: req.body['buyerDetails[gstNumber]'] || undefined,
          businessType: req.body['buyerDetails[businessType]'] || undefined
        };
      }
    } else if (role === 'transporter') {
      if (req.body.transporterDetails && typeof req.body.transporterDetails === 'object') {
        userData.transporterDetails = req.body.transporterDetails;
      } else {
        userData.transporterDetails = {
          vehicleType: req.body['transporterDetails[vehicleType]'],
          vehicleNumber: req.body['transporterDetails[vehicleNumber]'],
          licenseNumber: req.body['transporterDetails[licenseNumber]'] || undefined,
          capacity: req.body['transporterDetails[capacity]'] ? 
                     parseFloat(req.body['transporterDetails[capacity]']) : undefined
        };
      }
    }

    if (req.file) {
      userData.profileImage = req.file.path;
    }

    const user = await User.create(userData);
    
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          verified: user.verified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (req.file) {
      deleteFile(req.file.path);
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.profileImage) {
      user.profileImage = getFileUrl(req, user.profileImage);
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, farmerDetails, buyerDetails, transporterDetails } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };

    if (user.role === 'farmer' && farmerDetails) {
      user.farmerDetails = { ...user.farmerDetails, ...farmerDetails };
    } else if (user.role === 'buyer' && buyerDetails) {
      user.buyerDetails = { ...user.buyerDetails, ...buyerDetails };
    } else if (user.role === 'transporter' && transporterDetails) {
      user.transporterDetails = { ...user.transporterDetails, ...transporterDetails };
    }

    if (req.file) {
      if (user.profileImage) {
        deleteFile(user.profileImage);
      }
      user.profileImage = req.file.path;
    }

    await user.save();

    if (user.profileImage) {
      user.profileImage = getFileUrl(req, user.profileImage);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (req.file) {
      deleteFile(req.file.path);
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.profileImage) {
      user.profileImage = getFileUrl(req, user.profileImage);
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, city, state, verified, page = 1, limit = 10 } = req.query;

    const query = { active: true };
    
    if (role) query.role = role;
    if (verified !== undefined) query.verified = verified === 'true';
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (state) query['address.state'] = new RegExp(state, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};