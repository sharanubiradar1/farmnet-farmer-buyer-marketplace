const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
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
  status: {
    type: String,
    enum: ['active', 'accepted', 'rejected', 'withdrawn', 'expired'],
    default: 'active'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  deliveryPreference: {
    type: String,
    enum: ['pickup', 'delivery', 'negotiable'],
    default: 'negotiable'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'crypto', 'cod'],
    default: 'bank_transfer'
  },
  validUntil: {
    type: Date,
    required: [true, 'Bid validity is required']
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  isHighest: {
    type: Boolean,
    default: false
  },
  previousBidAmount: {
    type: Number,
    default: null
  },
  bidIncrement: {
    type: Number,
    default: 0
  },
  response: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered'],
      default: 'pending'
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Response message cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date
    },
    counterOffer: {
      amount: {
        type: Number,
        min: 0
      },
      message: {
        type: String,
        trim: true
      }
    }
  },
  notification: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bidSchema.index({ product: 1, buyer: 1 });
bidSchema.index({ product: 1, amount: -1 });
bidSchema.index({ buyer: 1, status: 1 });
bidSchema.index({ status: 1, createdAt: -1 });
bidSchema.index({ validUntil: 1, status: 1 });
bidSchema.index({ isHighest: 1, product: 1 });

bidSchema.pre('save', function(next) {
  if (this.isNew) {
    this.validUntil = this.validUntil || new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  if (this.validUntil < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

bidSchema.virtual('isExpired').get(function() {
  return this.validUntil < new Date();
});

bidSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.validUntil);
  return Math.max(0, end - now);
});

bidSchema.methods.accept = async function(message = null) {
  this.status = 'accepted';
  this.response.status = 'accepted';
  this.response.message = message;
  this.response.respondedAt = new Date();
  return await this.save();
};

bidSchema.methods.reject = async function(message = null) {
  this.status = 'rejected';
  this.response.status = 'rejected';
  this.response.message = message;
  this.response.respondedAt = new Date();
  return await this.save();
};

bidSchema.methods.withdraw = async function() {
  this.status = 'withdrawn';
  return await this.save();
};

bidSchema.methods.counterOffer = async function(amount, message = null) {
  this.response.status = 'countered';
  this.response.counterOffer = { amount, message };
  this.response.respondedAt = new Date();
  return await this.save();
};

bidSchema.methods.markAsRead = async function() {
  this.notification.read = true;
  this.notification.readAt = new Date();
  return await this.save();
};

bidSchema.statics.getHighestBid = async function(productId) {
  return await this.findOne({ 
    product: productId, 
    status: 'active' 
  }).sort({ amount: -1 });
};

bidSchema.statics.getBidsByProduct = async function(productId, options = {}) {
  const { limit = 10, skip = 0, sort = '-amount' } = options;
  
  return await this.find({ 
    product: productId,
    status: { $in: ['active', 'accepted'] }
  })
  .populate('buyer', 'name email phone rating')
  .sort(sort)
  .limit(limit)
  .skip(skip);
};

bidSchema.statics.getBidsByBuyer = async function(buyerId, options = {}) {
  const { limit = 10, skip = 0, status = null } = options;
  
  const query = { buyer: buyerId };
  if (status) query.status = status;
  
  return await this.find(query)
  .populate('product', 'name category basePrice currentPrice status')
  .sort('-createdAt')
  .limit(limit)
  .skip(skip);
};

module.exports = mongoose.model('Bid', bidSchema);