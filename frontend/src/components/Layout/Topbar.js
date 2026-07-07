import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function Topbar({ title }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.link) navigate(notification.link);
    setShowNotifications(false);
  };

  const typeColors = {
    task_assigned: '#818cf8', status_changed: '#38bdf8',
    review_requested: '#c084fc', review_completed: '#4ade80',
    incident_raised: '#f87171', deadline_approaching: '#fb923c',
    comment_added: '#f59e0b', general: '#94a3b8',
  };

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: 'var(--danger)', color: 'white',
                fontSize: '9px', fontWeight: 700,
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: 8, background: 'var(--primary)', color: 'white', fontSize: 10, padding: '1px 6px', borderRadius: 20 }}>
                      {unreadCount}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-sm"
                    style={{ padding: '4px 10px', fontSize: 11, background: 'none', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: !n.isRead ? typeColors[n.type] || 'var(--primary)' : 'transparent', flexShrink: 0, marginTop: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                        <div className="notification-text">{n.message}</div>
                        <div className="notification-time">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                >
                  View all notifications <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
