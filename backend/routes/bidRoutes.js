const express = require('express');
const router = express.Router();
const {
  createBid,
  getBidsByProduct,
  getMyBids,
  getBidsOnMyProducts,
  acceptBid,
  rejectBid,
  withdrawBid
} = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('buyer'), createBid);

router.get('/my-bids', protect, authorize('buyer'), getMyBids);

router.get('/received-bids', protect, authorize('farmer'), getBidsOnMyProducts);

router.get('/product/:productId', protect, getBidsByProduct);

router.put('/:id/accept', protect, authorize('farmer'), acceptBid);

router.put('/:id/reject', protect, authorize('farmer'), rejectBid);

router.put('/:id/withdraw', protect, authorize('buyer'), withdrawBid);

module.exports = router;