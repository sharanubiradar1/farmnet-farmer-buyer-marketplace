const Product = require('../models/Product');
const { deleteFiles, getFilesUrls } = require('../utils/localUpload');

exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      farmer: req.user._id
    };

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.path);
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    if (typeof productData.quantity === 'string') {
      try {
        productData.quantity = JSON.parse(productData.quantity);
      } catch (e) {}
    }

    if (typeof productData.location === 'string') {
      try {
        productData.location = JSON.parse(productData.location);
      } catch (e) {}
    }

    if (typeof productData.quality === 'string') {
      try {
        productData.quality = JSON.parse(productData.quality);
      } catch (e) {}
    }

    const product = await Product.create(productData);
    
    const populatedProduct = await Product.findById(product._id)
      .populate('farmer', 'name email phone address rating');

    if (populatedProduct.images) {
      populatedProduct.images = getFilesUrls(req, populatedProduct.images);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: populatedProduct }
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (req.files) {
      const filePaths = req.files.map(file => file.path);
      deleteFiles(filePaths);
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
      message: 'Error creating product',
      error: error.message
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      city,
      state,
      minPrice,
      maxPrice,
      status = 'active',
      search,
      sort = '-createdAt',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    
    if (minPrice || maxPrice) {
      query.currentPrice = {};
      if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    if (status === 'active') {
      query.biddingEndTime = { $gt: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('farmer', 'name email phone rating verified')
      .populate('highestBid')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    products.forEach(product => {
      if (product.images) {
        product.images = getFilesUrls(req, product.images);
      }
    });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name email phone address rating verified farmerDetails')
      .populate({
        path: 'highestBid',
        populate: { path: 'buyer', select: 'name email rating' }
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.incrementViews();

    if (product.images) {
      product.images = getFilesUrls(req, product.images);
    }

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    if (product.status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a sold product'
      });
    }

    const updateData = { ...req.body };
    delete updateData.farmer;
    delete updateData.status;
    delete updateData.totalBids;
    delete updateData.highestBid;

    if (req.files && req.files.length > 0) {
      deleteFiles(product.images);
      updateData.images = req.files.map(file => file.path);
    }

    if (typeof updateData.quantity === 'string') {
      try {
        updateData.quantity = JSON.parse(updateData.quantity);
      } catch (e) {}
    }

    if (typeof updateData.location === 'string') {
      try {
        updateData.location = JSON.parse(updateData.location);
      } catch (e) {}
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('farmer', 'name email phone rating');

    if (product.images) {
      product.images = getFilesUrls(req, product.images);
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (req.files) {
      const filePaths = req.files.map(file => file.path);
      deleteFiles(filePaths);
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
      message: 'Error updating product',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    if (product.status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a sold product'
      });
    }

    if (product.totalBids > 0) {
      product.status = 'cancelled';
      await product.save();
    } else {
      deleteFiles(product.images);
      await Product.findByIdAndDelete(req.params.id);
    }

    res.status(200).json({
      success: true,
      message: product.totalBids > 0 
        ? 'Product cancelled successfully' 
        : 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { farmer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('highestBid')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    products.forEach(product => {
      if (product.images) {
        product.images = getFilesUrls(req, product.images);
      }
    });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const products = await Product.find({
      featured: true,
      status: 'active',
      biddingEndTime: { $gt: new Date() }
    })
      .populate('farmer', 'name rating verified')
      .limit(parseInt(limit))
      .sort('-createdAt');

    products.forEach(product => {
      if (product.images) {
        product.images = getFilesUrls(req, product.images);
      }
    });

    res.status(200).json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};