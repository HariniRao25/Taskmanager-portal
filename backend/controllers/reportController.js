const Task = require('../models/Task');
const Project = require('../models/Project');
const Incident = require('../models/Incident');
const User = require('../models/User');

// @desc Get system-wide report data
const getReport = async (req, res, next) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    let taskQuery = {};
    let incidentQuery = {};
    if (projectId) { taskQuery.project = projectId; incidentQuery.project = projectId; }
    if (startDate && endDate) {
      taskQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      incidentQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const tasks = await Task.find(taskQuery).populate('project', 'name').populate('assignees', 'name');
    const incidents = await Incident.find(incidentQuery).populate('project', 'name');
    const projects = await Project.find({}).populate('owner', 'name');
    const users = await User.find({}).select('-password');

    // Task by status breakdown
    const taskByStatus = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'].map(s => ({
      status: s,
      count: tasks.filter(t => t.status === s).length
    }));

    // Task by priority
    const taskByPriority = ['low', 'medium', 'high', 'critical'].map(p => ({
      priority: p,
      count: tasks.filter(t => t.priority === p).length
    }));

    // Incident by severity
    const incidentBySeverity = ['low', 'medium', 'high', 'critical'].map(s => ({
      severity: s,
      count: incidents.filter(i => i.severity === s).length
    }));

    // Incident by status
    const incidentByStatus = ['open', 'investigating', 'resolved', 'escalated'].map(s => ({
      status: s,
      count: incidents.filter(i => i.status === s).length
    }));

    // Team velocity (tasks completed per user)
    const teamVelocity = users.map(u => ({
      name: u.name,
      completed: tasks.filter(t => t.status === 'done' && t.assignees.some(a => a._id.toString() === u._id.toString())).length,
      inProgress: tasks.filter(t => t.status === 'in_progress' && t.assignees.some(a => a._id.toString() === u._id.toString())).length,
    })).filter(u => u.completed + u.inProgress > 0);

    // Project health
    const projectHealth = projects.map(p => ({
      name: p.name,
      status: p.status,
      progress: p.progress,
      taskCount: tasks.filter(t => t.project?._id?.toString() === p._id.toString()).length,
    }));

    res.json({
      summary: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        totalIncidents: incidents.length,
        totalUsers: users.length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0,
        openIncidents: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
      },
      taskByStatus,
      taskByPriority,
      incidentBySeverity,
      incidentByStatus,
      teamVelocity,
      projectHealth,
    });
  } catch (error) { next(error); }
};

module.exports = { getReport };
