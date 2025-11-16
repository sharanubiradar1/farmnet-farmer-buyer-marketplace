const Transport = require('../models/Transport');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const { emitToUser } = require('../socket');

exports.createTransport = async (req, res) => {
  try {
    const {
      productId,
      bidId,
      pickupLocation,
      deliveryLocation,
      vehicleDetails,
      cost,
      distance,
      estimatedDuration,
      scheduledPickupTime,
      scheduledDeliveryTime,
      notes
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Bid must be accepted before creating transport'
      });
    }

    const transportData = {
      product: productId,
      bid: bidId,
      transporter: req.user._id,
      farmer: product.farmer,
      buyer: bid.buyer,
      pickupLocation,
      deliveryLocation,
      vehicleDetails,
      cost,
      distance,
      estimatedDuration,
      scheduledPickupTime,
      scheduledDeliveryTime,
      notes
    };

    const transport = await Transport.create(transportData);

    const populatedTransport = await Transport.findById(transport._id)
      .populate('farmer', 'name email phone')
      .populate('buyer', 'name email phone')
      .populate('transporter', 'name email phone transporterDetails')
      .populate('product', 'name category quantity');

    emitToUser(product.farmer.toString(), 'transport_created', {
      message: 'Transport has been arranged for your product',
      transport: populatedTransport
    });

    emitToUser(bid.buyer.toString(), 'transport_created', {
      message: 'Transport has been arranged for your order',
      transport: populatedTransport
    });

    res.status(201).json({
      success: true,
      message: 'Transport created successfully',
      data: { transport: populatedTransport }
    });
  } catch (error) {
    console.error('Create transport error:', error);

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
      message: 'Error creating transport',
      error: error.message
    });
  }
};

exports.getAllTransports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transports = await Transport.find(query)
      .populate('farmer', 'name phone')
      .populate('buyer', 'name phone')
      .populate('transporter', 'name phone vehicleDetails')
      .populate('product', 'name category')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all transports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transports',
      error: error.message
    });
  }
};

exports.getTransportById = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id)
      .populate('farmer', 'name email phone address')
      .populate('buyer', 'name email phone address')
      .populate('transporter', 'name email phone transporterDetails')
      .populate('product', 'name category quantity images')
      .populate('bid', 'amount quantity');

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { transport }
    });
  } catch (error) {
    console.error('Get transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transport',
      error: error.message
    });
  }
};

exports.getMyTransports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;

    const query = {};
    if (status) query.status = status;

    if (userRole === 'farmer') {
      query.farmer = req.user._id;
    } else if (userRole === 'buyer') {
      query.buyer = req.user._id;
    } else if (userRole === 'transporter') {
      query.transporter = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transports = await Transport.find(query)
      .populate('farmer', 'name phone')
      .populate('buyer', 'name phone')
      .populate('transporter', 'name phone vehicleDetails')
      .populate('product', 'name category images')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my transports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transports',
      error: error.message
    });
  }
};

exports.updateTransportStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;

    const transport = await Transport.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    if (transport.transporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this transport'
      });
    }

    await transport.updateStatus(status, location, note);

    const populatedTransport = await Transport.findById(transport._id)
      .populate('farmer', 'name phone')
      .populate('buyer', 'name phone')
      .populate('product', 'name');

    emitToUser(transport.farmer.toString(), 'transport_update', {
      message: `Transport status updated to: ${status}`,
      transport: populatedTransport
    });

    emitToUser(transport.buyer.toString(), 'transport_update', {
      message: `Transport status updated to: ${status}`,
      transport: populatedTransport
    });

    res.status(200).json({
      success: true,
      message: 'Transport status updated successfully',
      data: { transport: populatedTransport }
    });
  } catch (error) {
    console.error('Update transport status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transport status',
      error: error.message
    });
  }
};

exports.cancelTransport = async (req, res) => {
  try {
    const { reason } = req.body;

    const transport = await Transport.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    const canCancel = [
      transport.farmer.toString(),
      transport.buyer.toString(),
      transport.transporter.toString()
    ].includes(req.user._id.toString());

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this transport'
      });
    }

    if (!['pending', 'confirmed'].includes(transport.status)) {
      return res.status(400).json({
        success: false,
        message: 'Transport cannot be cancelled in current status'
      });
    }

    await transport.cancel(req.user._id, reason);

    emitToUser(transport.farmer.toString(), 'transport_cancelled', {
      message: 'Transport has been cancelled',
      transport
    });

    emitToUser(transport.buyer.toString(), 'transport_cancelled', {
      message: 'Transport has been cancelled',
      transport
    });

    emitToUser(transport.transporter.toString(), 'transport_cancelled', {
      message: 'Transport has been cancelled',
      transport
    });

    res.status(200).json({
      success: true,
      message: 'Transport cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling transport',
      error: error.message
    });
  }
};

exports.addTransportRating = async (req, res) => {
  try {
    const { score, review } = req.body;

    const transport = await Transport.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    const canRate = [
      transport.farmer.toString(),
      transport.buyer.toString()
    ].includes(req.user._id.toString());

    if (!canRate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this transport'
      });
    }

    if (transport.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed transports'
      });
    }

    if (transport.rating && transport.rating.ratedBy) {
      return res.status(400).json({
        success: false,
        message: 'Transport already rated'
      });
    }

    await transport.addRating(req.user._id, score, review);

    res.status(200).json({
      success: true,
      message: 'Rating added successfully',
      data: { transport }
    });
  } catch (error) {
    console.error('Add transport rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding rating',
      error: error.message
    });
  }
};

exports.getActiveTransports = async (req, res) => {
  try {
    if (req.user.role !== 'transporter') {
      return res.status(403).json({
        success: false,
        message: 'Only transporters can access this endpoint'
      });
    }

    const transports = await Transport.getActiveTransports(req.user._id);

    res.status(200).json({
      success: true,
      data: { transports }
    });
  } catch (error) {
    console.error('Get active transports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active transports',
      error: error.message
    });
  }
};