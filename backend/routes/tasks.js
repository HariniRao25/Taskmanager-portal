const express = require('express');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask, deleteTask,
  addComment, getBlockedTasks, getDashboardStats
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.get('/stats/dashboard', protect, getDashboardStats);
router.get('/blocked', protect, getBlockedTasks);

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.post('/:id/comments', protect, addComment);

module.exports = router;
