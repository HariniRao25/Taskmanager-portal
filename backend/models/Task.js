const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  dependencies: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: { type: String, enum: ['finish_to_start', 'start_to_start', 'finish_to_finish'], default: 'finish_to_start' }
  }],
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  loggedHours: { type: Number, default: 0 },
  tags: [{ type: String }],
  attachments: [{ filename: String, path: String, uploadedAt: Date }],
  comments: [commentSchema],
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  fallbackReviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isCrossProject: { type: Boolean, default: false },
  blockedReason: { type: String, default: '' },
  completedAt: { type: Date },
}, { timestamps: true });

// Detect circular dependencies before save
taskSchema.pre('save', async function (next) {
  if (this.dependencies && this.dependencies.length > 0) {
    const Task = mongoose.model('Task');
    const visited = new Set();
    const detectCycle = async (taskId) => {
      if (visited.has(taskId.toString())) return true;
      visited.add(taskId.toString());
      const task = await Task.findById(taskId).select('dependencies');
      if (!task) return false;
      for (const dep of task.dependencies) {
        if (dep.task.toString() === this._id.toString()) return true;
        if (await detectCycle(dep.task)) return true;
      }
      return false;
    };
    for (const dep of this.dependencies) {
      if (await detectCycle(dep.task)) {
        return next(new Error('Circular dependency detected. Cannot save task.'));
      }
    }
  }
  if (this.isModified('status') && this.status === 'done') {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
