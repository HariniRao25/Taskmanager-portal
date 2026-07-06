const Review = require('../models/Review');
const Task = require('../models/Task');
const User = require('../models/User');
const notificationEmitter = require('../events/notificationEmitter');

// @desc Get reviews
const getReviews = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ reviewer: req.user._id }, { requestedBy: req.user._id }] };
    const reviews = await Review.find(query)
      .populate('task', 'title status priority project')
      .populate('reviewer', 'name email avatar lastActiveAt')
      .populate('fallbackReviewer', 'name email avatar')
      .populate('requestedBy', 'name email avatar')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) { next(error); }
};

// @desc Approve or reject review
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only assigned reviewer can update this review' });
    }

    const { status, feedback } = req.body;
    review.status = status;
    review.feedback = feedback || '';
    review.reviewedAt = new Date();
    await review.save();

    // Update task status based on review outcome
    if (status === 'approved') {
      await Task.findByIdAndUpdate(review.task, { status: 'done' });
    } else if (status === 'rejected') {
      await Task.findByIdAndUpdate(review.task, { status: 'in_progress' });
    }

    // Notify requester
    notificationEmitter.emit('review_completed', {
      userId: review.requestedBy,
      taskId: review.task,
      reviewStatus: status,
      reviewedBy: req.user.name,
    });

    await review.populate('task', 'title status');
    res.json(review);
  } catch (error) { next(error); }
};

// @desc Reassign review (when reviewer unavailable)
const reassignReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Business Rule: Check reviewer inactivity (> 7 days)
    const reviewer = await User.findById(review.reviewer);
    const daysSinceActive = reviewer ? (Date.now() - reviewer.lastActiveAt) / (1000 * 60 * 60 * 24) : 99;

    const newReviewerId = req.body.newReviewerId || review.fallbackReviewer;
    if (!newReviewerId) {
      return res.status(400).json({ message: 'No fallback reviewer available. Please specify a new reviewer.' });
    }

    const previousReviewer = review.reviewer;
    review.reviewer = newReviewerId;
    review.status = 'reassigned';
    review.reassignedAt = new Date();
    review.reassignReason = req.body.reason || (daysSinceActive > 7 ? 'Reviewer inactive for more than 7 days' : 'Manual reassignment');
    await review.save();

    notificationEmitter.emit('review_requested', {
      userId: newReviewerId,
      taskId: review.task,
      requestedBy: req.user.name,
      reassigned: true,
    });

    await review.populate(['task', 'reviewer', 'requestedBy']);
    res.json(review);
  } catch (error) { next(error); }
};

module.exports = { getReviews, updateReview, reassignReview };
