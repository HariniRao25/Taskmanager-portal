const Task = require('../models/Task');
const Project = require('../models/Project');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const notificationEmitter = require('../events/notificationEmitter');

// @desc Get tasks (with filters)
const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignee, search } = req.query;
    let query = {};
    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignees = assignee;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate('project', 'name status')
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('reviewer', 'name email avatar')
      .populate('dependencies.task', 'title status')
      .sort('-createdAt');
    res.json(tasks);
  } catch (error) { next(error); }
};

// @desc Get single task
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status owner')
      .populate('assignees', 'name email avatar role')
      .populate('reporter', 'name email avatar')
      .populate('reviewer', 'name email avatar')
      .populate('fallbackReviewer', 'name email avatar')
      .populate('parentTask', 'title status')
      .populate('dependencies.task', 'title status priority')
      .populate('comments.author', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) { next(error); }
};

// @desc Create task
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, project, assignees, dueDate,
            estimatedHours, tags, dependencies, parentTask, reviewer, fallbackReviewer } = req.body;

    // Validate dependency tasks are not blocked
    if (dependencies && dependencies.length > 0) {
      for (const dep of dependencies) {
        const depTask = await Task.findById(dep.task);
        if (depTask && depTask.status !== 'done' && dep.type === 'finish_to_start') {
          // Mark new task as blocked if dependency not done
        }
      }
    }

    const task = await Task.create({
      title, description, status, priority, project,
      assignees: assignees || [],
      reporter: req.user._id,
      dueDate, estimatedHours, tags,
      dependencies: dependencies || [],
      parentTask: parentTask || null,
      reviewer: reviewer || null,
      fallbackReviewer: fallbackReviewer || null,
    });

    // Notify assignees
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        notificationEmitter.emit('task_assigned', {
          userId: assigneeId,
          taskId: task._id,
          taskTitle: task.title,
          assignedBy: req.user.name,
        });
      }
    }

    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignees', select: 'name email avatar' },
      { path: 'reporter', select: 'name email avatar' },
    ]);
    res.status(201).json(task);
  } catch (error) { next(error); }
};

// @desc Update task
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const previousStatus = task.status;
    const newStatus = req.body.status;

    // Business Rule: Cannot move to in_progress if finish_to_start dependencies are not done
    if (newStatus === 'in_progress' && task.dependencies.length > 0) {
      for (const dep of task.dependencies) {
        if (dep.type === 'finish_to_start') {
          const depTask = await Task.findById(dep.task);
          if (depTask && depTask.status !== 'done') {
            return res.status(400).json({
              message: `Cannot start task: dependency "${depTask.title}" is not yet completed.`,
              blockedBy: depTask._id
            });
          }
        }
      }
    }

    // Business Rule: Moving to review creates a review record
    if (newStatus === 'review' && previousStatus !== 'review') {
      const reviewerId = req.body.reviewer || task.reviewer;
      if (reviewerId) {
        await Review.create({
          task: task._id,
          reviewer: reviewerId,
          fallbackReviewer: req.body.fallbackReviewer || task.fallbackReviewer,
          requestedBy: req.user._id,
        });
        notificationEmitter.emit('review_requested', {
          userId: reviewerId,
          taskId: task._id,
          taskTitle: task.title,
          requestedBy: req.user.name,
        });
      }
    }

    // Emit status change notification
    if (newStatus && newStatus !== previousStatus) {
      for (const assigneeId of task.assignees) {
        if (assigneeId.toString() !== req.user._id.toString()) {
          notificationEmitter.emit('status_changed', {
            userId: assigneeId,
            taskId: task._id,
            taskTitle: task.title,
            fromStatus: previousStatus,
            toStatus: newStatus,
            changedBy: req.user.name,
          });
        }
      }
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('project', 'name status')
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('reviewer', 'name email avatar')
      .populate('dependencies.task', 'title status');
    res.json(updated);
  } catch (error) { next(error); }
};

// @desc Delete task
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task removed successfully' });
  } catch (error) { next(error); }
};

// @desc Add comment to task
const addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ author: req.user._id, text: req.body.text });
    await task.save();

    // Notify assignees of comment
    for (const assigneeId of task.assignees) {
      if (assigneeId.toString() !== req.user._id.toString()) {
        notificationEmitter.emit('comment_added', {
          userId: assigneeId,
          taskId: task._id,
          taskTitle: task.title,
          commentBy: req.user.name,
        });
      }
    }
    await task.populate('comments.author', 'name email avatar');
    res.json(task.comments);
  } catch (error) { next(error); }
};

// @desc Get blocked tasks
const getBlockedTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ status: 'blocked' })
      .populate('project', 'name')
      .populate('assignees', 'name email avatar')
      .populate('dependencies.task', 'title status');
    res.json(tasks);
  } catch (error) { next(error); }
};

// @desc Get dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const totalTasks = await Task.countDocuments();
    const doneTasks = await Task.countDocuments({ status: 'done' });
    const blockedTasks = await Task.countDocuments({ status: 'blocked' });
    const inProgressTasks = await Task.countDocuments({ status: 'in_progress' });
    const reviewTasks = await Task.countDocuments({ status: 'review' });
    const overdueTasks = await Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $nin: ['done', 'cancelled'] } });

    const recentTasks = await Task.find()
      .sort('-updatedAt')
      .limit(5)
      .populate('project', 'name')
      .populate('assignees', 'name avatar');

    res.json({
      totalTasks, doneTasks, blockedTasks, inProgressTasks, reviewTasks, overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      recentTasks,
    });
  } catch (error) { next(error); }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, addComment, getBlockedTasks, getDashboardStats };
