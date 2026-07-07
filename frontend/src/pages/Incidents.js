import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { incidentsAPI, projectsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader, AlertTriangle, Clock, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'investigating', 'resolved', 'escalated'];

const SEVERITY_CONFIG = {
  low: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)', label: 'Low' },
  medium: { color: '#38bdf8', bg: 'rgba(14,165,233,0.1)', label: 'Medium' },
  high: { color: '#fb923c', bg: 'rgba(249,115,22,0.1)', label: 'High' },
  critical: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', label: 'Critical' },
};

function IncidentModal({ incident, projects, users, onClose, onSave }) {
  const [form, setForm] = useState(incident || {
    title: '', description: '', severity: 'medium', project: '',
    investigator: '', tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags };
      if (incident) {
        await incidentsAPI.update(incident._id, payload);
        toast.success('Incident updated!');
      } else {
        await incidentsAPI.create(payload);
        toast.success('Incident reported!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save incident');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">{incident ? 'Edit Incident' : 'Report New Incident'}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Incident Title *</label>
            <input id="inc-title" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the incident" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea id="inc-desc" className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Detailed description, steps to reproduce, impact..." required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select id="inc-severity" className="form-select" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select id="inc-status" className="form-select" value={form.status || 'open'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select id="inc-project" className="form-select" value={form.project?._id || form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign Investigator</label>
            <select id="inc-investigator" className="form-select" value={form.investigator?._id || form.investigator || ''} onChange={e => setForm({ ...form, investigator: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <input id="inc-tags" className="form-input" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. production, database" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="inc-save-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={14} /> : null} {incident ? 'Update' : 'Report'} Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IncidentDetailModal({ incident, onClose, onUpdate }) {
  const { user } = useAuth(); // eslint-disable-line no-unused-vars
  const [note, setNote] = useState('');
  const [action, setAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [incData, setIncData] = useState(incident);

  const handleAddTimeline = async (e) => {
    e.preventDefault();
    if (!note.trim() || !action.trim()) return toast.error('Both action and note are required');
    setSubmitting(true);
    try {
      await incidentsAPI.addTimeline(incident._id, { action, note });
      const { data } = await incidentsAPI.getOne(incident._id);
      setIncData(data);
      setNote(''); setAction('');
      toast.success('Timeline entry added');
    } catch (err) { toast.error('Failed to add timeline entry'); }
    finally { setSubmitting(false); }
  };

  const handleResolve = async () => {
    try {
      await incidentsAPI.update(incident._id, { status: 'resolved', resolution: 'Resolved by ' + user.name });
      toast.success('Incident resolved!');
      onUpdate();
      onClose();
    } catch (err) { toast.error('Failed to resolve incident'); }
  };

  const sev = SEVERITY_CONFIG[incData.severity];

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg animate-slide-up">
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className={`badge badge-${incData.status}`}>{incData.status}</span>
              <span className={`badge badge-${incData.severity}`}>{incData.severity}</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{incData.title}</h2>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, background: sev.bg, borderRadius: 8, border: `1px solid ${sev.color}33` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: sev.color, marginBottom: 4 }}>DESCRIPTION</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{incData.description}</p>
          </div>

          <div className="grid-2">
            <div><div className="text-xs text-muted">Project</div><div className="text-sm mt-1">{incData.project?.name}</div></div>
            <div><div className="text-xs text-muted">Investigator</div><div className="text-sm mt-1">{incData.investigator?.name || 'Unassigned'}</div></div>
            <div><div className="text-xs text-muted">Reported by</div><div className="text-sm mt-1">{incData.reportedBy?.name}</div></div>
            <div><div className="text-xs text-muted">Reported</div><div className="text-sm mt-1">{formatDistanceToNow(new Date(incData.createdAt), { addSuffix: true })}</div></div>
          </div>

          {/* Investigation Timeline */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={15} /> Investigation Timeline</div>
            <div className="timeline" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {incData.timeline?.map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-time">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</div>
                  <div className="timeline-action">{t.action} — {t.performedBy?.name}</div>
                  {t.note && <div className="timeline-note">{t.note}</div>}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTimeline} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="grid-2">
                <input id="timeline-action" className="form-input" value={action} onChange={e => setAction(e.target.value)} placeholder="Action taken..." />
                <input id="timeline-note" className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Investigation note..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button id="add-timeline-btn" type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? <Loader size={12} /> : '+'} Add Entry
                </button>
                {incData.status !== 'resolved' && (
                  <button id="resolve-incident-btn" type="button" className="btn btn-success btn-sm" onClick={handleResolve}>
                    <CheckCircle size={14} /> Mark Resolved
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState({ status: '', severity: '' });

  const fetchData = async () => {
    try {
      const [iRes, pRes, uRes] = await Promise.all([
        incidentsAPI.getAll(filter),
        projectsAPI.getAll(),
        authAPI.getUsers()
      ]);
      setIncidents(iRes.data);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch (err) { toast.error('Failed to load incidents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this incident?')) return;
    try {
      await incidentsAPI.delete(id);
      toast.success('Incident deleted');
      fetchData();
    } catch (err) { toast.error('Failed to delete incident'); }
  };

  const filtered = incidents.filter(i => {
    return (!filter.status || i.status === filter.status) && (!filter.severity || i.severity === filter.severity);
  });

  const countBySeverity = (sev) => incidents.filter(i => i.severity === sev && i.status !== 'resolved').length;

  return (
    <Layout title="Incidents">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Tracker</h1>
          <p className="page-subtitle">{incidents.filter(i => i.status !== 'resolved').length} open incidents</p>
        </div>
        <button id="create-incident-btn" className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Report Incident
        </button>
      </div>

      {/* Severity Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {SEVERITIES.map(sev => {
          const cfg = SEVERITY_CONFIG[sev];
          return (
            <div key={sev} className="stat-card" style={{ '--card-accent': `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }}>
              <div className="stat-label">{sev.toUpperCase()}</div>
              <div className="stat-value" style={{ color: cfg.color }}>{countBySeverity(sev)}</div>
              <div className="stat-sub">Open incidents</div>
            </div>
          );
        })}
      </div>

      <div className="filter-bar">
        <select id="inc-status-filter" className="form-select" style={{ width: 150 }} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select id="inc-severity-filter" className="form-select" style={{ width: 150 }} value={filter.severity} onChange={e => setFilter({ ...filter, severity: e.target.value })}>
          <option value="">All Severity</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(inc => {
            const cfg = SEVERITY_CONFIG[inc.severity];
            return (
              <div
                key={inc._id}
                style={{ background: 'var(--bg-card)', border: `1px solid ${cfg.color}33`, borderLeft: `4px solid ${cfg.color}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}
                className="card"
                onClick={() => setDetail(inc)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className={`badge badge-${inc.severity}`}>{cfg.label}</span>
                      <span className={`badge badge-${inc.status}`}>{inc.status}</span>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{inc.title}</h3>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {inc.project?.name} · Reported by {inc.reportedBy?.name} · {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                      {inc.investigator && ` · Investigator: ${inc.investigator.name}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button id={`edit-inc-${inc._id}`} className="btn btn-icon btn-secondary btn-sm" onClick={() => setModal(inc)}><Pencil size={13} /></button>
                    <button id={`del-inc-${inc._id}`} className="btn btn-icon btn-danger btn-sm" onClick={() => handleDelete(inc._id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state">
              <AlertTriangle size={64} style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3>No Incidents Found</h3>
              <p>All systems are operational or try adjusting filters</p>
            </div>
          )}
        </div>
      )}

      {modal && <IncidentModal incident={modal === 'create' ? null : modal} projects={projects} users={users} onClose={() => setModal(null)} onSave={fetchData} />}
      {detail && <IncidentDetailModal incident={detail} onClose={() => setDetail(null)} onUpdate={fetchData} />}
    </Layout>
  );
}
