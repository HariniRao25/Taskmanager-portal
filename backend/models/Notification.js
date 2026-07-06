const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['task_assigned', 'status_changed', 'review_requested', 'review_completed',
           'incident_raised', 'deadline_approaching', 'comment_added', 'project_update', 'general'],
    default: 'general'
  },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  relatedEntity: {
    entityType: { type: String, enum: ['Task', 'Project', 'Incident', 'Review'] },
    entityId: { type: mongoose.Schema.Types.ObjectId }
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
