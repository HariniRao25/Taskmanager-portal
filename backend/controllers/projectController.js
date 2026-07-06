const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc Get all projects
const getProjects = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort('-createdAt');
    res.json(projects);
  } catch (error) { next(error); }
};

// @desc Get single project
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) { next(error); }
};

// @desc Create project
const createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, members, startDate, endDate, tags } = req.body;
    const project = await Project.create({
      name, description, status, priority,
      owner: req.user._id,
      members: members || [],
      startDate, endDate, tags
    });
    await project.populate('owner', 'name email avatar');
    res.status(201).json(project);
  } catch (error) { next(error); }
};

// @desc Update project
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');
    res.json(updated);
  } catch (error) { next(error); }
};

// @desc Delete project
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.json({ message: 'Project removed successfully' });
  } catch (error) { next(error); }
};

// @desc Get project statistics
const getProjectStats = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.id });
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };
    stats.completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    res.json(stats);
  } catch (error) { next(error); }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, getProjectStats };
