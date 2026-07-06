const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.get('/users', protect, getUsers);

module.exports = router;
