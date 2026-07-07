import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, AlertTriangle,
  Bell, BarChart3, LogOut, Star, Shield, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { to: '/projects', icon: FolderKanban, label: 'Projects', section: 'main' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', section: 'main' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents', section: 'main' },
  { to: '/notifications', icon: Bell, label: 'Notifications', section: 'main', badge: true },
  { to: '/reports', icon: BarChart3, label: 'Reports', section: 'analytics' },
  { to: '/reviews', icon: Star, label: 'Reviews', section: 'analytics' },
];

const getRoleIcon = (role) => {
  if (role === 'admin') return <Shield size={12} />;
  if (role === 'project_manager') return <Star size={12} />;
  return null;
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const mainItems = navItems.filter(i => i.section === 'main');
  const analyticsItems = navItems.filter(i => i.section === 'analytics');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={20} color="#818cf8" fill="#818cf8" />
          <span>TeamFlow</span>
        </div>
        <div className="logo-sub">Systems Engineering</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Platform</div>
        {mainItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={17} className="nav-icon" />
            {label}
            {badge && unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NavLink>
        ))}

        <div className="nav-section-label">Analytics</div>
        {analyticsItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={17} className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {user?.name}
              {getRoleIcon(user?.role)}
            </div>
            <div className="user-role">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button
            className="btn btn-icon"
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
