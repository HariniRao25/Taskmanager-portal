const express = require('express');
const router = express.Router();
const { getReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getReport);

module.exports = router;
