const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getFeaturedProducts
} = require('../controllers/productController');
const { protect, authorize, optional } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../utils/localUpload');

router.get('/featured', optional, getFeaturedProducts);

router.get('/my-products', protect, authorize('farmer'), getMyProducts);

router.post(
  '/',
  protect,
  authorize('farmer'),
  upload.array('productImages', 5),
  handleUploadError,
  createProduct
);

router.get('/', optional, getAllProducts);

router.get('/:id', optional, getProductById);

router.put(
  '/:id',
  protect,
  authorize('farmer'),
  upload.array('productImages', 5),
  handleUploadError,
  updateProduct
);

router.delete('/:id', protect, authorize('farmer'), deleteProduct);

module.exports = router;