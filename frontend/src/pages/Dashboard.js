import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { tasksAPI, projectsAPI, incidentsAPI } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckSquare, Activity, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';


export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, projectsRes, incidentsRes] = await Promise.all([
          tasksAPI.getDashboardStats(),
          projectsAPI.getAll(),
          incidentsAPI.getAll({ status: 'open' }),
        ]);
        setStats(statsRes.data);
        setProjects(projectsRes.data.slice(0, 5));
        setIncidents(incidentsRes.data.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const taskStatusData = stats ? [
    { name: 'To Do', value: stats.totalTasks - stats.doneTasks - stats.inProgressTasks - stats.reviewTasks - stats.blockedTasks, color: '#64748b' },
    { name: 'In Progress', value: stats.inProgressTasks, color: '#0ea5e9' },
    { name: 'Review', value: stats.reviewTasks, color: '#a855f7' },
    { name: 'Done', value: stats.doneTasks, color: '#22c55e' },
    { name: 'Blocked', value: stats.blockedTasks, color: '#ef4444' },
  ] : [];

  const kpiCards = stats ? [
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, accent: 'linear-gradient(90deg, #6366f1, #818cf8)', sub: `${stats.completionRate}% completed` },
    { label: 'In Progress', value: stats.inProgressTasks, icon: Activity, accent: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', sub: 'Active right now' },
    { label: 'Blocked Tasks', value: stats.blockedTasks, icon: Shield, accent: 'linear-gradient(90deg, #ef4444, #f87171)', sub: 'Need attention' },
    { label: 'Overdue', value: stats.overdueTasks, icon: Clock, accent: 'linear-gradient(90deg, #f97316, #fb923c)', sub: 'Past due date' },
  ] : [];

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening across your projects today.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        {kpiCards.map(({ label, value, icon: Icon, accent, sub }) => (
          <div key={label} className="stat-card" style={{ '--card-accent': accent }}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
            <div className="stat-icon"><Icon size={48} /></div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Task Status Pie */}
        <div className="chart-wrapper">
          <div className="chart-title">Task Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskStatusData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={3}>
                {taskStatusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(val, name) => [val, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {taskStatusData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Projects Progress */}
        <div className="chart-wrapper">
          <div className="chart-title">Project Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {projects.map(p => (
              <div key={p._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
            {projects.length === 0 && <div className="text-muted text-sm">No projects yet</div>}
          </div>
        </div>
      </div>

      {/* Recent Activity + Open Incidents */}
      <div className="grid-2">
        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats?.recentTasks?.map(task => (
              <div key={task._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ marginTop: 3 }}>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {task.project?.name} · {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.recentTasks || stats.recentTasks.length === 0) && (
              <div className="text-muted text-sm">No recent activity</div>
            )}
          </div>
        </div>

        {/* Open Incidents */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Open Incidents</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {incidents.map(inc => (
              <div key={inc._id} style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{inc.title}</span>
                  <span className={`badge badge-${inc.severity}`}>{inc.severity}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {inc.project?.name} · {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
            {incidents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                No open incidents — all clear!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
