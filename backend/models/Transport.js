const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  bid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: [true, 'Bid is required']
  },
  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Transporter is required']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  pickupLocation: {
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Pickup city is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Pickup state is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pickup pincode is required'],
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: {
      name: String,
      phone: String
    }
  },
  deliveryLocation: {
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Delivery city is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Delivery state is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Delivery pincode is required'],
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: {
      name: String,
      phone: String
    }
  },
  vehicleDetails: {
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['truck', 'van', 'tempo', 'refrigerated']
    },
    number: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true
    },
    capacity: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: 0
    }
  },
  cost: {
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: 0
    },
    distanceCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    loadingCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    unloadingCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    additionalCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: 0
    }
  },
  distance: {
    value: {
      type: Number,
      required: [true, 'Distance value is required'],
      min: 0
    },
    unit: {
      type: String,
      default: 'km',
      enum: ['km', 'miles']
    }
  },
  estimatedDuration: {
    value: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: 0
    },
    unit: {
      type: String,
      default: 'hours',
      enum: ['hours', 'days']
    }
  },
  scheduledPickupTime: {
    type: Date,
    required: [true, 'Scheduled pickup time is required']
  },
  scheduledDeliveryTime: {
    type: Date,
    required: [true, 'Scheduled delivery time is required']
  },
  actualPickupTime: {
    type: Date,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'in_transit',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'failed'
    ],
    default: 'pending'
  },
  trackingUpdates: [{
    status: {
      type: String,
      required: true
    },
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    }
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'wallet'],
    default: 'cash'
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true,
      maxlength: 500
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ratedAt: {
      type: Date
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'pod', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

transportSchema.index({ transporter: 1, status: 1 });
transportSchema.index({ farmer: 1, status: 1 });
transportSchema.index({ buyer: 1, status: 1 });
transportSchema.index({ product: 1 });
transportSchema.index({ bid: 1 });
transportSchema.index({ status: 1, scheduledPickupTime: 1 });
transportSchema.index({ paymentStatus: 1 });

transportSchema.pre('save', function(next) {
  if (this.isModified('cost')) {
    this.cost.total = 
      this.cost.baseFare +
      this.cost.distanceCharge +
      this.cost.loadingCharge +
      this.cost.unloadingCharge +
      this.cost.additionalCharges -
      this.cost.discount;
  }
  next();
});

transportSchema.virtual('isDelayed').get(function() {
  if (!this.actualDeliveryTime && this.scheduledDeliveryTime < new Date()) {
    return true;
  }
  if (this.actualDeliveryTime && this.actualDeliveryTime > this.scheduledDeliveryTime) {
    return true;
  }
  return false;
});

transportSchema.methods.updateStatus = async function(status, location = null, note = null) {
  this.status = status;
  
  const update = {
    status,
    timestamp: new Date()
  };
  
  if (location) update.location = location;
  if (note) update.note = note;
  
  this.trackingUpdates.push(update);
  
  if (status === 'picked_up') {
    this.actualPickupTime = new Date();
  } else if (status === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
  
  return await this.save();
};

transportSchema.methods.cancel = async function(userId, reason = null) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return await this.save();
};

transportSchema.methods.addRating = async function(userId, score, review = null) {
  this.rating = {
    score,
    review,
    ratedBy: userId,
    ratedAt: new Date()
  };
  return await this.save();
};

transportSchema.statics.getActiveTransports = function(transporterId) {
  return this.find({
    transporter: transporterId,
    status: { $in: ['confirmed', 'in_transit', 'picked_up', 'out_for_delivery'] }
  })
  .populate('product', 'name category')
  .populate('farmer', 'name phone')
  .populate('buyer', 'name phone')
  .sort('scheduledPickupTime');
};

module.exports = mongoose.model('Transport', transportSchema);