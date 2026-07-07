const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject, deleteProject, getProjectStats
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// Any authenticated user can create a project (they become its owner).
// updateProject/deleteProject enforce owner-or-admin access in the controller.
router.route('/')
  .get(protect, getProjects)
  .post(protect, createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.get('/:id/stats', protect, getProjectStats);

module.exports = router;
