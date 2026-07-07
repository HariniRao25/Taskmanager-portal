import React from 'react';
import Layout from '../components/Layout/Layout';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, Check, Trash2, CheckCheck, ClipboardList, RefreshCw, Star,
  CheckCircle, AlertTriangle, Clock, MessageSquare, Folder
} from 'lucide-react';

const TYPE_ICONS = {
  task_assigned: ClipboardList, status_changed: RefreshCw, review_requested: Star,
  review_completed: CheckCircle, incident_raised: AlertTriangle, deadline_approaching: Clock,
  comment_added: MessageSquare, project_update: Folder, general: Bell,
};

const TYPE_COLORS = {
  task_assigned: '#818cf8', status_changed: '#38bdf8',
  review_requested: '#c084fc', review_completed: '#4ade80',
  incident_raised: '#f87171', deadline_approaching: '#fb923c',
  comment_added: '#f59e0b', project_update: '#38bdf8', general: '#94a3b8',
};

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <Layout title="Notifications">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button id="mark-all-read-btn" className="btn btn-secondary" onClick={markAllAsRead}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={64} style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3>All caught up!</h3>
          <p>You have no notifications at the moment.</p>
        </div>
      ) : (
        <>
          {/* Unread Section */}
          {unread.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                Unread ({unread.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {unread.map(n => (
                  <NotificationCard key={n._id} notification={n} onRead={markAsRead} onDelete={deleteNotification} />
                ))}
              </div>
            </div>
          )}

          {/* Read Section */}
          {read.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                Read ({read.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {read.map(n => (
                  <NotificationCard key={n._id} notification={n} onRead={markAsRead} onDelete={deleteNotification} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function NotificationCard({ notification: n, onRead, onDelete }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
        background: !n.isRead ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)',
        border: `1px solid ${!n.isRead ? 'rgba(99,102,241,0.2)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: `${TYPE_COLORS[n.type] || '#94a3b8'}22`,
        color: TYPE_COLORS[n.type] || '#94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.createElement(TYPE_ICONS[n.type] || Bell, { size: 18 })}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: n.isRead ? 400 : 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {n.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 4 }}>
          {n.message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {!n.isRead && (
          <button
            id={`mark-read-${n._id}`}
            className="btn btn-icon btn-success btn-sm"
            onClick={() => onRead(n._id)}
            title="Mark as read"
          >
            <Check size={13} />
          </button>
        )}
        <button
          id={`del-notif-${n._id}`}
          className="btn btn-icon btn-danger btn-sm"
          onClick={() => onDelete(n._id)}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
