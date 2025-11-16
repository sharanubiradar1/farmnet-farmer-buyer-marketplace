const Bid = require('../models/Bid');
const Product = require('../models/Product');
const { emitToProduct, emitToUser } = require('../socket');

exports.createBid = async (req, res) => {
  try {
    const { productId, amount, quantity, message, deliveryPreference, paymentMethod } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'active' && product.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for bidding'
      });
    }

    if (product.biddingEndTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Bidding period has ended'
      });
    }

    if (product.farmer.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own product'
      });
    }

    if (amount < product.currentPrice + product.minimumBidIncrement) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be at least ₹${product.currentPrice + product.minimumBidIncrement}`
      });
    }

    const existingBid = await Bid.findOne({
      product: productId,
      buyer: req.user._id,
      status: 'active'
    });

    let previousBidAmount = null;
    if (existingBid) {
      previousBidAmount = existingBid.amount;
      existingBid.status = 'withdrawn';
      await existingBid.save();
    }

    const bidData = {
      product: productId,
      buyer: req.user._id,
      amount,
      quantity: quantity || product.quantity,
      message,
      deliveryPreference,
      paymentMethod,
      previousBidAmount,
      bidIncrement: previousBidAmount ? amount - previousBidAmount : amount - product.basePrice,
      validUntil: product.biddingEndTime,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    const bid = await Bid.create(bidData);

    await Bid.updateMany(
      { product: productId, _id: { $ne: bid._id } },
      { isHighest: false }
    );

    bid.isHighest = true;
    await bid.save();

    product.currentPrice = amount;
    product.totalBids += 1;
    product.highestBid = bid._id;
    product.status = 'bidding';
    await product.save();

    const populatedBid = await Bid.findById(bid._id)
      .populate('buyer', 'name email phone rating')
      .populate('product', 'name category farmer');

    emitToProduct(productId, 'new_bid', {
      bid: populatedBid,
      newPrice: amount,
      totalBids: product.totalBids
    });

    emitToUser(product.farmer.toString(), 'bid_notification', {
      message: `New bid of ₹${amount} received on ${product.name}`,
      bid: populatedBid
    });

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: { bid: populatedBid }
    });
  } catch (error) {
    console.error('Create bid error:', error);

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
      message: 'Error creating bid',
      error: error.message
    });
  }
};

exports.getBidsByProduct = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bids = await Bid.find({
      product: req.params.productId,
      status: { $in: ['active', 'accepted'] }
    })
      .populate('buyer', 'name email phone rating verified')
      .sort('-amount -createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Bid.countDocuments({
      product: req.params.productId,
      status: { $in: ['active', 'accepted'] }
    });

    res.status(200).json({
      success: true,
      data: {
        bids,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bids',
      error: error.message
    });
  }
};

exports.getMyBids = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { buyer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bids = await Bid.find(query)
      .populate({
        path: 'product',
        select: 'name category basePrice currentPrice status images farmer',
        populate: { path: 'farmer', select: 'name email phone' }
      })
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Bid.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bids,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bids',
      error: error.message
    });
  }
};

exports.getBidsOnMyProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const products = await Product.find({ farmer: req.user._id }).select('_id');
    const productIds = products.map(p => p._id);

    const query = { product: { $in: productIds } };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bids = await Bid.find(query)
      .populate('buyer', 'name email phone rating verified')
      .populate('product', 'name category currentPrice status')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Bid.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bids,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bids on my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bids',
      error: error.message
    });
  }
};

exports.acceptBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('product');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this bid'
      });
    }

    if (bid.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bid is not active'
      });
    }

    await bid.accept(req.body.message);

    const product = await Product.findById(bid.product._id);
    product.status = 'sold';
    product.winner = bid.buyer;
    product.soldPrice = bid.amount;
    product.soldAt = new Date();
    await product.save();

    await Bid.updateMany(
      { 
        product: bid.product._id,
        _id: { $ne: bid._id },
        status: 'active'
      },
      { status: 'rejected' }
    );

    const populatedBid = await Bid.findById(bid._id)
      .populate('buyer', 'name email phone')
      .populate('product', 'name category');

    emitToUser(bid.buyer.toString(), 'bid_accepted', {
      message: 'Your bid has been accepted!',
      bid: populatedBid
    });

    res.status(200).json({
      success: true,
      message: 'Bid accepted successfully',
      data: { bid: populatedBid }
    });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting bid',
      error: error.message
    });
  }
};

exports.rejectBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('product');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this bid'
      });
    }

    if (bid.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bid is not active'
      });
    }

    await bid.reject(req.body.message);

    emitToUser(bid.buyer.toString(), 'bid_rejected', {
      message: 'Your bid has been rejected',
      bid
    });

    res.status(200).json({
      success: true,
      message: 'Bid rejected successfully'
    });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting bid',
      error: error.message
    });
  }
};

exports.withdrawBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this bid'
      });
    }

    if (bid.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bid is not active'
      });
    }

    await bid.withdraw();

    res.status(200).json({
      success: true,
      message: 'Bid withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing bid',
      error: error.message
    });
  }
};