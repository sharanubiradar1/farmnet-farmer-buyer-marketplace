const express = require('express');
const router = express.Router();
const {
  createTransport,
  getAllTransports,
  getTransportById,
  getMyTransports,
  updateTransportStatus,
  cancelTransport,
  addTransportRating,
  getActiveTransports
} = require('../controllers/transportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('transporter'), createTransport);

router.get('/my-transports', protect, getMyTransports);

router.get('/active', protect, authorize('transporter'), getActiveTransports);

router.get('/', protect, getAllTransports);

router.get('/:id', protect, getTransportById);

router.put('/:id/status', protect, authorize('transporter'), updateTransportStatus);

router.put('/:id/cancel', protect, cancelTransport);

router.post('/:id/rating', protect, authorize('farmer', 'buyer'), addTransportRating);

module.exports = router;