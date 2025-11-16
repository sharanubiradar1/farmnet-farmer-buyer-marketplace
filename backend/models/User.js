const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['farmer', 'buyer', 'transporter'],
    required: [true, 'Role is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  profileImage: {
    type: String,
    default: null
  },
  farmerDetails: {
    farmSize: {
      type: Number,
      min: 0
    },
    farmType: {
      type: String,
      enum: ['organic', 'conventional', 'mixed']
    },
    experience: {
      type: Number,
      min: 0
    },
    certifications: [{
      type: String
    }]
  },
  buyerDetails: {
    businessName: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: ['retailer', 'wholesaler', 'restaurant', 'processor', 'other']
    }
  },
  transporterDetails: {
    vehicleType: {
      type: String,
      enum: ['truck', 'van', 'tempo', 'refrigerated']
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      min: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  walletAddress: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'address.city': 1, 'address.state': 1 });
userSchema.index({ verified: 1, active: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

userSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'farmer'
});

userSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'buyer'
});

userSchema.virtual('transports', {
  ref: 'Transport',
  localField: '_id',
  foreignField: 'transporter'
});

module.exports = mongoose.model('User', userSchema);