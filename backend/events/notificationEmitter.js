const EventEmitter = require('events');
const Notification = require('../models/Notification');

class NotificationEmitter extends EventEmitter {}
const notificationEmitter = new NotificationEmitter();

// Task Assigned
notificationEmitter.on('task_assigned', async ({ userId, taskId, taskTitle, assignedBy }) => {
  try {
    await Notification.create({
      user: userId,
      title: 'Task Assigned',
      message: `You have been assigned to task: "${taskTitle}" by ${assignedBy}`,
      type: 'task_assigned',
      link: `/tasks/${taskId}`,
      relatedEntity: { entityType: 'Task', entityId: taskId }
    });
  } catch (err) { console.error('Notification error:', err.message); }
});

// Status Changed
notificationEmitter.on('status_changed', async ({ userId, taskId, taskTitle, fromStatus, toStatus, changedBy }) => {
  try {
    await Notification.create({
      user: userId,
      title: 'Task Status Updated',
      message: `"${taskTitle}" moved from ${fromStatus} to ${toStatus} by ${changedBy}`,
      type: 'status_changed',
      link: `/tasks/${taskId}`,
      relatedEntity: { entityType: 'Task', entityId: taskId }
    });
  } catch (err) { console.error('Notification error:', err.message); }
});

// Review Requested
notificationEmitter.on('review_requested', async ({ userId, taskId, taskTitle, requestedBy, reassigned }) => {
  try {
    await Notification.create({
      user: userId,
      title: reassigned ? 'Review Reassigned to You' : 'Review Requested',
      message: reassigned
        ? `A review has been reassigned to you for task: "${taskTitle}"`
        : `Review requested for task: "${taskTitle}" by ${requestedBy}`,
      type: 'review_requested',
      link: `/tasks/${taskId}`,
      relatedEntity: { entityType: 'Task', entityId: taskId }
    });
  } catch (err) { console.error('Notification error:', err.message); }
});

// Review Completed
notificationEmitter.on('review_completed', async ({ userId, taskId, reviewStatus, reviewedBy }) => {
  try {
    await Notification.create({
      user: userId,
      title: 'Review Completed',
      message: `Your task review was ${reviewStatus} by ${reviewedBy}`,
      type: 'review_completed',
      link: `/tasks/${taskId}`,
      relatedEntity: { entityType: 'Task', entityId: taskId }
    });
  } catch (err) { console.error('Notification error:', err.message); }
});

// Incident Raised
notificationEmitter.on('incident_raised', async ({ userId, incidentId, incidentTitle, severity, reportedBy }) => {
  try {
    await Notification.create({
      user: userId,
      title: `${severity.toUpperCase()} Incident Assigned`,
      message: `You are the investigator for incident: "${incidentTitle}" reported by ${reportedBy}`,
      type: 'incident_raised',
      link: `/incidents/${incidentId}`,
      relatedEntity: { entityType: 'Incident', entityId: incidentId }
    });
  } catch (err) { console.error('Notification error:', err.message); }
});

// Comment Added
notificationEmitter.on('comment_added', async ({ userId, taskId, taskTitle, commentBy }) => {
  try {
    await Notification.create({
      user: userId,
      title: 'New Comment',
      message: `${commentBy} commented on task: "${taskTitle}"`,
      type: 'comment_added',
      link: `/tasks/${taskId}`,
      relatedEntity: { entityType: 'Task', entityId: taskId }
    });
  } catch (err) { console.error('Notification error:', err.message); }
});

module.exports = notificationEmitter;
