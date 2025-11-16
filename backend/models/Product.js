const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'vegetables',
      'fruits',
      'grains',
      'pulses',
      'spices',
      'dairy',
      'meat',
      'poultry',
      'fish',
      'organic',
      'other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  quantity: {
    value: {
      type: Number,
      required: [true, 'Quantity value is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: ['kg', 'quintal', 'ton', 'litre', 'dozen', 'piece']
    }
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  currentPrice: {
    type: Number,
    required: [true, 'Current price is required'],
    min: [0, 'Price cannot be negative']
  },
  minimumBidIncrement: {
    type: Number,
    default: 10,
    min: [1, 'Minimum bid increment must be at least 1']
  },
  images: [{
    type: String,
    required: true
  }],
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
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
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  quality: {
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C'],
      default: 'B'
    },
    certification: {
      type: String,
      enum: ['organic', 'pesticide-free', 'none'],
      default: 'none'
    }
  },
  harvestDate: {
    type: Date,
    required: [true, 'Harvest date is required']
  },
  availableFrom: {
    type: Date,
    required: [true, 'Available from date is required'],
    default: Date.now
  },
  availableUntil: {
    type: Date,
    required: [true, 'Available until date is required']
  },
  biddingEndTime: {
    type: Date,
    required: [true, 'Bidding end time is required']
  },
  status: {
    type: String,
    enum: ['active', 'bidding', 'sold', 'expired', 'cancelled'],
    default: 'active'
  },
  totalBids: {
    type: Number,
    default: 0,
    min: 0
  },
  highestBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  soldPrice: {
    type: Number,
    default: null,
    min: 0
  },
  soldAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productSchema.index({ farmer: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'location.city': 1, 'location.state': 1 });
productSchema.index({ biddingEndTime: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ currentPrice: 1 });
productSchema.index({ featured: 1, status: 1 });

productSchema.pre('save', function(next) {
  if (this.isNew) {
    this.currentPrice = this.basePrice;
  }
  
  if (this.biddingEndTime < new Date()) {
    this.status = 'expired';
  }
  
  next();
});

productSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'product'
});

productSchema.virtual('isExpired').get(function() {
  return this.biddingEndTime < new Date();
});

productSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.biddingEndTime);
  return Math.max(0, end - now);
});

productSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

productSchema.methods.updatePrice = async function(newPrice) {
  this.currentPrice = newPrice;
  return await this.save();
};

productSchema.statics.getActiveProducts = function(filters = {}) {
  return this.find({
    status: 'active',
    biddingEndTime: { $gt: new Date() },
    ...filters
  }).populate('farmer', 'name email phone rating');
};

module.exports = mongoose.model('Product', productSchema);