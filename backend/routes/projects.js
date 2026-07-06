const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject, deleteProject, getProjectStats
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin', 'project_manager'), createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, authorize('admin', 'project_manager'), updateProject)
  .delete(protect, authorize('admin', 'project_manager'), deleteProject);

router.get('/:id/stats', protect, getProjectStats);

module.exports = router;
