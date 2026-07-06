const express = require('express');
const router = express.Router();
const { getReviews, updateReview, reassignReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getReviews);
router.put('/:id', protect, updateReview);
router.post('/:id/reassign', protect, reassignReview);

module.exports = router;
