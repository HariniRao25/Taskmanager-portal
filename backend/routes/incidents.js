const express = require('express');
const router = express.Router();
const {
  getIncidents, getIncident, createIncident, updateIncident, addTimelineEntry, deleteIncident
} = require('../controllers/incidentController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getIncidents)
  .post(protect, createIncident);

router.route('/:id')
  .get(protect, getIncident)
  .put(protect, updateIncident)
  .delete(protect, deleteIncident);

router.post('/:id/timeline', protect, addTimelineEntry);

module.exports = router;
