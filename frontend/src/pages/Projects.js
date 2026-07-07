import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { projectsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Calendar, X, Loader, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function ProjectModal({ project, users, onClose, onSave }) {
  const [form, setForm] = useState(
    project
      ? {
          ...project,
          // Members arrive populated as user objects; the <select> needs plain IDs.
          members: (project.members || []).map((m) => m._id || m),
        }
      : {
          name: '', description: '', status: 'planning', priority: 'medium',
          members: [], startDate: '', endDate: '', tags: ''
        }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags };
      if (project) {
        await projectsAPI.update(project._id, payload);
        toast.success('Project updated!');
      } else {
        await projectsAPI.create(payload);
        toast.success('Project created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'Create New Project'}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input id="proj-name" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Platform v3 Rewrite" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea id="proj-desc" className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" rows={3} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select id="proj-status" className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select id="proj-priority" className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input id="proj-start" className="form-input" type="date" value={form.startDate ? form.startDate.slice(0,10) : ''} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input id="proj-end" className="form-input" type="date" value={form.endDate ? form.endDate.slice(0,10) : ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Team Members</label>
            <select id="proj-members" className="form-select" multiple value={form.members} onChange={e => setForm({ ...form, members: Array.from(e.target.selectedOptions, o => o.value) })} style={{ minHeight: 90 }}>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_',' ')})</option>)}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple</div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input id="proj-tags" className="form-input" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. backend, api, v2" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="proj-save-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={14} /> : null} {project ? 'Update' : 'Create'} Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | project
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const fetchProjects = async () => {
    try {
      const [pRes, uRes] = await Promise.all([projectsAPI.getAll(), authAPI.getUsers()]);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch (err) { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (err) { toast.error('Failed to delete project'); }
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter ? p.status === filter : true;
    return matchSearch && matchFilter;
  });

  // Anyone signed in can create a project (they become its owner).
  // Editing/deleting a specific project is limited to its owner or an admin,
  // matching what the backend controller enforces.
  const canManageProject = (project) =>
    user?.role === 'admin' || project.owner?._id === user?._id || project.owner === user?._id;

  return (
    <Layout title="Projects">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} total projects</p>
        </div>
        <button id="create-project-btn" className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <span className="search-icon"><Search size={15} /></span>
          <input id="project-search" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="project-status-filter" className="form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderIcon />
          <h3>No Projects Found</h3>
          <p>Create your first project to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(project => (
            <div key={project._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
                  <span className={`badge badge-${project.priority}`} style={{ marginLeft: 6 }}>{project.priority}</span>
                </div>
                {canManageProject(project) && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button id={`edit-proj-${project._id}`} className="btn btn-icon btn-secondary" onClick={() => setModal(project)} title="Edit"><Pencil size={14} /></button>
                    <button id={`del-proj-${project._id}`} className="btn btn-icon btn-danger" onClick={() => handleDelete(project._id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{project.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                {project.description || 'No description provided.'}
              </p>

              {/* Progress */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Progress</span><span>{project.progress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${project.progress}%` }} /></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Members */}
                <div className="avatar-group">
                  {project.members?.slice(0, 4).map(m => (
                    <div key={m._id} className="avatar" title={m.name}>
                      {m.name?.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="avatar" style={{ background: 'var(--bg-3)', color: 'var(--text-muted)' }}>
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                {project.endDate && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {format(new Date(project.endDate), 'MMM dd, yyyy')}
                  </span>
                )}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                  {project.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', borderRadius: 20 }}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal === 'create' ? null : modal}
          users={users}
          onClose={() => setModal(null)}
          onSave={fetchProjects}
        />
      )}
    </Layout>
  );
}

function FolderIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
      <path d="M3 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
