import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { reportsAPI, projectsAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, CheckSquare, AlertTriangle, Target } from 'lucide-react';

const COLORS = {
  todo: '#64748b', in_progress: '#0ea5e9', review: '#a855f7',
  done: '#22c55e', blocked: '#ef4444', cancelled: '#475569',
  low: '#4ade80', medium: '#38bdf8', high: '#fb923c', critical: '#f87171',
  open: '#f87171', investigating: '#fb923c', resolved: '#4ade80', escalated: '#c084fc',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.fill || p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [report, setReport] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ projectId: '', startDate: '', endDate: '' });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([reportsAPI.get(filter), projectsAPI.getAll()]);
      setReport(rRes.data);
      setProjects(pRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <Layout title="Reports">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
      </div>
    </Layout>
  );

  const { summary, taskByStatus, taskByPriority, incidentBySeverity, incidentByStatus, teamVelocity, projectHealth } = report || {};

  return (
    <Layout title="Reports & Analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">System-wide performance metrics and insights</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 28 }}>
        <select id="report-project-filter" className="form-select" style={{ width: 180 }} value={filter.projectId} onChange={e => setFilter({ ...filter, projectId: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input id="report-start" className="form-input" type="date" style={{ width: 160 }} value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} />
        <input id="report-end" className="form-input" type="date" style={{ width: 160 }} value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} />
        <button id="apply-report-filter" className="btn btn-primary" onClick={fetchReport}>Apply Filters</button>
      </div>

      {/* Summary KPIs */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #6366f1, #818cf8)' }}>
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{summary?.totalProjects}</div>
          <div className="stat-sub">Active projects</div>
          <div className="stat-icon"><Target size={48} /></div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }}>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{summary?.totalTasks}</div>
          <div className="stat-sub">{summary?.completionRate}% completion rate</div>
          <div className="stat-icon"><CheckSquare size={48} /></div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #ef4444, #f87171)' }}>
          <div className="stat-label">Open Incidents</div>
          <div className="stat-value">{summary?.openIncidents}</div>
          <div className="stat-sub">of {summary?.totalIncidents} total</div>
          <div className="stat-icon"><AlertTriangle size={48} /></div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg, #22c55e, #4ade80)' }}>
          <div className="stat-label">Team Members</div>
          <div className="stat-value">{summary?.totalUsers}</div>
          <div className="stat-sub">Active contributors</div>
          <div className="stat-icon"><Users size={48} /></div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Task by Status */}
        <div className="chart-wrapper">
          <div className="chart-title">Task Status Breakdown</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskByStatus} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.replace('_', ' ')} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {taskByStatus?.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.status] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task by Priority */}
        <div className="chart-wrapper">
          <div className="chart-title">Task Priority Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={taskByPriority?.filter(d => d.count > 0)} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="priority" label={({ priority, count }) => count > 0 ? `${priority}: ${count}` : ''} labelLine={false}>
                {taskByPriority?.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.priority]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Incident by Severity */}
        <div className="chart-wrapper">
          <div className="chart-title">Incident Severity Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incidentBySeverity} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="severity" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {incidentBySeverity?.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.severity]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Status */}
        <div className="chart-wrapper">
          <div className="chart-title">Incident Status Overview</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={incidentByStatus?.filter(d => d.count > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="count" nameKey="status" paddingAngle={3}>
                {incidentByStatus?.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend formatter={(val) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Velocity */}
      {teamVelocity && teamVelocity.length > 0 && (
        <div className="chart-wrapper" style={{ marginBottom: 20 }}>
          <div className="chart-title">Team Velocity — Tasks per Member</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamVelocity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inProgress" name="In Progress" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Legend formatter={(val) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{val}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project Health Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="card-title">Project Health Overview</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Task Count</th>
              </tr>
            </thead>
            <tbody>
              {projectHealth?.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td>{p.taskCount}</td>
                </tr>
              ))}
              {(!projectHealth || projectHealth.length === 0) && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No project data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
