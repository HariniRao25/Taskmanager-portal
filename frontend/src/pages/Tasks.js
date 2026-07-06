import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { tasksAPI, projectsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader, MessageSquare, Link2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function TaskModal({ task, projects, users, allTasks, onClose, onSave }) {
  const [form, setForm] = useState(task || {
    title: '', description: '', status: 'todo', priority: 'medium',
    project: '', assignees: [], dueDate: '', estimatedHours: 0,
    tags: '', dependencies: [], reviewer: '', fallbackReviewer: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags,
        dependencies: form.dependencies?.map(d => typeof d === 'object' ? d : { task: d, type: 'finish_to_start' }) || [],
      };
      if (task) {
        await tasksAPI.update(task._id, payload);
        toast.success('Task updated!');
      } else {
        await tasksAPI.create(payload);
        toast.success('Task created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const availableTasks = allTasks.filter(t => t._id !== task?._id);

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input id="task-title" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea id="task-desc" className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the task..." />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select id="task-project" className="form-select" value={form.project?._id || form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select id="task-status" className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select id="task-priority" className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input id="task-due" className="form-input" type="date" value={form.dueDate ? form.dueDate.slice(0, 10) : ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assignees</label>
            <select id="task-assignees" className="form-select" multiple value={form.assignees?.map(a => a._id || a) || []}
              onChange={e => setForm({ ...form, assignees: Array.from(e.target.selectedOptions, o => o.value) })}
              style={{ minHeight: 80 }}>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Reviewer</label>
              <select id="task-reviewer" className="form-select" value={form.reviewer?._id || form.reviewer || ''}
                onChange={e => setForm({ ...form, reviewer: e.target.value })}>
                <option value="">None</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fallback Reviewer</label>
              <select id="task-fallback" className="form-select" value={form.fallbackReviewer?._id || form.fallbackReviewer || ''}
                onChange={e => setForm({ ...form, fallbackReviewer: e.target.value })}>
                <option value="">None</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dependencies (Finish-to-Start)</label>
            <select id="task-deps" className="form-select" multiple
              value={form.dependencies?.map(d => d.task?._id || d.task || d) || []}
              onChange={e => setForm({ ...form, dependencies: Array.from(e.target.selectedOptions, o => ({ task: o.value, type: 'finish_to_start' })) })}
              style={{ minHeight: 80 }}>
              {availableTasks.map(t => <option key={t._id} value={t._id}>[{t.status}] {t.title}</option>)}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              ⚠️ Circular dependencies are automatically rejected
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Hours</label>
            <input id="task-hours" className="form-input" type="number" min="0" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <input id="task-tags" className="form-input" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. frontend, urgent" />
          </div>

          {form.status === 'blocked' && (
            <div className="form-group">
              <label className="form-label">Blocked Reason</label>
              <input id="task-blocked-reason" className="form-input" value={form.blockedReason || ''} onChange={e => setForm({ ...form, blockedReason: e.target.value })} placeholder="Why is this task blocked?" />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="task-save-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={14} /> : null} {task ? 'Update' : 'Create'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose, onSave }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [taskData, setTaskData] = useState(task);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await tasksAPI.addComment(task._id, { text: comment });
      toast.success('Comment added');
      const { data } = await tasksAPI.getOne(task._id);
      setTaskData(data);
      setComment('');
    } catch (err) { toast.error('Failed to add comment'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg animate-slide-up" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className={`badge badge-${taskData.status}`}>{taskData.status?.replace('_', ' ')}</span>
              <span className={`badge badge-${taskData.priority}`}>{taskData.priority}</span>
              {taskData.isCrossProject && <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>Cross-Project</span>}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{taskData.title}</h2>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {taskData.description && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{taskData.description}</p>
          )}

          {taskData.blockedReason && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
              <div><div style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>Blocked</div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{taskData.blockedReason}</div></div>
            </div>
          )}

          <div className="grid-2">
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Project</div>
              <div className="text-sm">{taskData.project?.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Due Date</div>
              <div className="text-sm">{taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : 'Not set'}</div>
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Assignees</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {taskData.assignees?.map(a => (
                  <div key={a._id} style={{ fontSize: 11, background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 20, color: 'var(--text-secondary)' }}>{a.name}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Reviewer</div>
              <div className="text-sm">{taskData.reviewer?.name || 'None'}</div>
            </div>
          </div>

          {taskData.dependencies?.length > 0 && (
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 8 }}>Dependencies</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {taskData.dependencies.map((dep, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-3)', borderRadius: 6 }}>
                    <Link2 size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 12 }}>{dep.task?.title}</span>
                    <span className={`badge badge-${dep.task?.status}`} style={{ marginLeft: 'auto', fontSize: 10 }}>{dep.task?.status?.replace('_',' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
              <MessageSquare size={14} style={{ display: 'inline', marginRight: 6 }} />
              Comments ({taskData.comments?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, maxHeight: 200, overflowY: 'auto' }}>
              {taskData.comments?.map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-3)', padding: '10px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.author?.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
              <input id="comment-input" className="form-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." style={{ flex: 1 }} />
              <button id="add-comment-btn" className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? <Loader size={14} /> : 'Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const KANBAN_COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#64748b' },
  { key: 'in_progress', label: 'In Progress', color: '#0ea5e9' },
  { key: 'review', label: 'In Review', color: '#a855f7' },
  { key: 'done', label: 'Done', color: '#22c55e' },
  { key: 'blocked', label: 'Blocked', color: '#ef4444' },
];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [view, setView] = useState('kanban');
  const [filter, setFilter] = useState({ project: '', priority: '', status: '', search: '' });

  const fetchTasks = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        tasksAPI.getAll(filter),
        projectsAPI.getAll(),
        authAPI.getUsers()
      ]);
      setTasks(tRes.data);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch (err) { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const s = filter.search.toLowerCase();
    return (
      (!s || t.title.toLowerCase().includes(s)) &&
      (!filter.project || t.project?._id === filter.project) &&
      (!filter.priority || t.priority === filter.priority) &&
      (!filter.status || t.status === filter.status)
    );
  });

  const getColumnTasks = (status) => filteredTasks.filter(t => t.status === status);

  return (
    <Layout title="Tasks">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} total tasks</p>
        </div>
        <button id="create-task-btn" className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* View Toggle + Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button id="kanban-view-btn" className={`tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
          <button id="list-view-btn" className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
        </div>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input id="task-search" placeholder="Search tasks..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </div>
          <select id="task-project-filter" className="form-select" style={{ width: 160 }} value={filter.project} onChange={e => setFilter({ ...filter, project: e.target.value })}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select id="task-priority-filter" className="form-select" style={{ width: 130 }} value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      ) : view === 'kanban' ? (
        // Kanban Board
        <div className="kanban-board">
          {KANBAN_COLUMNS.map(col => (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: col.color }}>{col.label}</span>
                <span className="kanban-count">{getColumnTasks(col.key).length}</span>
              </div>
              {getColumnTasks(col.key).map(task => (
                <div key={task._id} className="kanban-card" onClick={() => setDetailTask(task)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <button
                      className="btn btn-icon"
                      style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10 }}
                      onClick={e => { e.stopPropagation(); setModal(task); }}
                    >✎</button>
                  </div>
                  <div className="kanban-card-title">{task.title}</div>
                  <div className="kanban-card-meta">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.project?.name}</span>
                    <div className="avatar-group">
                      {task.assignees?.slice(0, 2).map(a => (
                        <div key={a._id} className="avatar" title={a.name} style={{ width: 20, height: 20, fontSize: 8 }}>{a.name?.slice(0,2)}</div>
                      ))}
                    </div>
                  </div>
                  {task.dueDate && (
                    <div style={{ fontSize: 10, color: new Date(task.dueDate) < new Date() ? '#f87171' : 'var(--text-muted)', marginTop: 6 }}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.dependencies?.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>🔗 {task.dependencies.length} deps</div>
                  )}
                  {/* Quick status change */}
                  <select
                    className="form-select"
                    style={{ fontSize: 11, padding: '3px 6px', marginTop: 8 }}
                    value={task.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); handleStatusChange(task._id, e.target.value); }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignees</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task._id}>
                    <td>
                      <div style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--primary-light)' }} onClick={() => setDetailTask(task)}>
                        {task.title}
                        {task.dependencies?.length > 0 && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--text-muted)' }}>🔗{task.dependencies.length}</span>}
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.project?.name}</span></td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      <div className="avatar-group">
                        {task.assignees?.slice(0, 3).map(a => (
                          <div key={a._id} className="avatar" title={a.name}>{a.name?.slice(0,2)}</div>
                        ))}
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12, color: task.dueDate && new Date(task.dueDate) < new Date() ? '#f87171' : 'var(--text-muted)' }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button id={`edit-task-${task._id}`} className="btn btn-icon btn-secondary btn-sm" onClick={() => setModal(task)} title="Edit">✎</button>
                        <button id={`del-task-${task._id}`} className="btn btn-icon btn-danger btn-sm" onClick={() => handleDelete(task._id)} title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <div className="empty-state"><h3>No tasks found</h3><p>Create your first task or adjust filters</p></div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          projects={projects}
          users={users}
          allTasks={tasks}
          onClose={() => setModal(null)}
          onSave={fetchTasks}
        />
      )}
      {detailTask && (
        <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} onSave={fetchTasks} />
      )}
    </Layout>
  );
}
