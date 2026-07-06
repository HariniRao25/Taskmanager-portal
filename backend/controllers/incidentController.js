const Incident = require('../models/Incident');
const notificationEmitter = require('../events/notificationEmitter');

// @desc Get all incidents
const getIncidents = async (req, res, next) => {
  try {
    const { project, status, severity } = req.query;
    let query = {};
    if (project) query.project = project;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const incidents = await Incident.find(query)
      .populate('project', 'name status')
      .populate('investigator', 'name email avatar')
      .populate('reportedBy', 'name email avatar')
      .populate('linkedTask', 'title status')
      .sort('-createdAt');
    res.json(incidents);
  } catch (error) { next(error); }
};

// @desc Get single incident
const getIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('project', 'name status')
      .populate('investigator', 'name email avatar role')
      .populate('reportedBy', 'name email avatar')
      .populate('linkedTask', 'title status priority')
      .populate('timeline.performedBy', 'name email avatar');
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (error) { next(error); }
};

// @desc Create incident
const createIncident = async (req, res, next) => {
  try {
    const { title, description, severity, project, linkedTask, investigator, tags } = req.body;
    const incident = await Incident.create({
      title, description, severity, project,
      linkedTask: linkedTask || null,
      investigator: investigator || null,
      reportedBy: req.user._id,
      tags,
      timeline: [{ action: 'Incident Created', performedBy: req.user._id, note: description }]
    });

    // Notify investigator
    if (investigator) {
      notificationEmitter.emit('incident_raised', {
        userId: investigator,
        incidentId: incident._id,
        incidentTitle: incident.title,
        severity: incident.severity,
        reportedBy: req.user.name,
      });
    }

    await incident.populate([
      { path: 'project', select: 'name' },
      { path: 'reportedBy', select: 'name email avatar' },
      { path: 'investigator', select: 'name email avatar' },
    ]);
    res.status(201).json(incident);
  } catch (error) { next(error); }
};

// @desc Update incident
const updateIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    if (req.body.status === 'resolved' && incident.status !== 'resolved') {
      req.body.resolvedAt = new Date();
      req.body.$push = {
        timeline: { action: 'Incident Resolved', performedBy: req.user._id, note: req.body.resolution || 'Marked as resolved' }
      };
    }

    const updated = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('investigator', 'name email avatar')
      .populate('reportedBy', 'name email avatar')
      .populate('linkedTask', 'title status');
    res.json(updated);
  } catch (error) { next(error); }
};

// @desc Add timeline entry
const addTimelineEntry = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    incident.timeline.push({
      action: req.body.action,
      performedBy: req.user._id,
      note: req.body.note
    });
    await incident.save();
    await incident.populate('timeline.performedBy', 'name email avatar');
    res.json(incident.timeline);
  } catch (error) { next(error); }
};

// @desc Delete incident
const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    await incident.deleteOne();
    res.json({ message: 'Incident removed successfully' });
  } catch (error) { next(error); }
};

module.exports = { getIncidents, getIncident, createIncident, updateIncident, addTimelineEntry, deleteIncident };
