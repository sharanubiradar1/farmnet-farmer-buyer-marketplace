const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  getAllUsers
} = require('../controllers/userController');
const { protect, optional } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../utils/localUpload');

router.post('/register', upload.single('profileImage'), handleUploadError, register);

router.post('/login', login);

router.get('/profile', protect, getProfile);

router.put('/profile', protect, upload.single('profileImage'), handleUploadError, updateProfile);

router.put('/change-password', protect, changePassword);

router.get('/all', optional, getAllUsers);

router.get('/:id', optional, getUserById);

module.exports = router;