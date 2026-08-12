import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../api';
import {
  ChatIcon,
  ClipboardIcon,
  CreditCardIcon,
  DocumentIcon,
  GridIcon,
  LogoutIcon,
  ScaleIcon,
  ShieldIcon,
  TagIcon,
} from '../../icons';

function BellIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" strokeLinejoin="round" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [notifOpen, setNotifOpen] = useState(false);

  function onLogout() {
    clearSession();
    navigate('/app/login', { replace: true });
  }

  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <div className="cw cw-shell">
      <aside className="cw-sidebar">
        <NavLink to="/app" className="cw-sidebar-brand">
          <span className="cw-sidebar-mark">
            <ScaleIcon />
          </span>
          <div>
            <div className="cw-sidebar-brand-name">LegalLens AI</div>
            <div className="cw-sidebar-brand-sub">Web</div>
          </div>
        </NavLink>

        <nav className="cw-sidebar-nav">
          <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <DocumentIcon /> Home
          </NavLink>
          <NavLink to="/app/upload" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ChatIcon /> Upload &amp; Analyze
          </NavLink>
          <NavLink to="/app/documents" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ClipboardIcon /> My Documents
          </NavLink>
          <NavLink to="/app/compare" className={({ isActive }) => (isActive ? 'active' : '')}>
            <GridIcon /> Compare Documents
          </NavLink>
          <NavLink to="/app/templates" className={({ isActive }) => (isActive ? 'active' : '')}>
            <TagIcon /> Templates
          </NavLink>
          <NavLink to="/app/subscription" className={({ isActive }) => (isActive ? 'active' : '')}>
            <CreditCardIcon /> Subscription
          </NavLink>
          <NavLink to="/app/help" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ShieldIcon /> Help &amp; Support
          </NavLink>
        </nav>

        <div className="cw-sidebar-footer">
          <NavLink to="/app/profile" className="cw-sidebar-user" style={{ textDecoration: 'none' }}>
            <span className="cw-sidebar-avatar">{initials || 'U'}</span>
            <div style={{ minWidth: 0 }}>
              <div className="cw-sidebar-user-name">{user?.firstName || 'User'}</div>
              <div className="cw-sidebar-user-plan">{user?.plan || 'FREE'} plan</div>
            </div>
          </NavLink>
          <button className="cw-sidebar-logout" onClick={onLogout}>
            <LogoutIcon /> Log out
          </button>
        </div>
      </aside>

      <main className="cw-main">
        <div className="cw-topstrip">
          <div style={{ position: 'relative' }}>
            <button className="cw-bell-btn" onClick={() => setNotifOpen((o) => !o)}>
              <BellIcon style={{ width: 18, height: 18 }} />
            </button>
            {notifOpen && (
              <div className="cw-bell-dropdown" onMouseLeave={() => setNotifOpen(false)}>
                No new notifications.
              </div>
            )}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
