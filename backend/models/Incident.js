const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'escalated'],
    default: 'open'
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  linkedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  investigator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resolvedAt: { type: Date },
  timeline: [{
    action: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
