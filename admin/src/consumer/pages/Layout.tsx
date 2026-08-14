import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../api';
import {
  ChevronRightIcon,
  ClipboardIcon,
  CloseIcon,
  CreditCardIcon,
  CrownIcon,
  DocumentIcon,
  DotsVerticalIcon,
  GridIcon,
  LogoutIcon,
  MenuIcon,
  ScaleIcon,
  ShieldIcon,
  TagIcon,
  UploadIcon,
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
  const [navOpen, setNavOpen] = useState(false);
  const isFree = (user?.plan ?? 'FREE') === 'FREE';

  function onLogout() {
    clearSession();
    navigate('/', { replace: true });
  }

  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <div className="cw cw-shell">
      {navOpen && <div className="cw-sidebar-overlay" onClick={() => setNavOpen(false)} />}

      <aside className={`cw-sidebar${navOpen ? ' cw-sidebar-open' : ''}`}>
        <div className="cw-sidebar-brand-row">
          <NavLink to="/app" className="cw-sidebar-brand" onClick={() => setNavOpen(false)}>
            <span className="cw-sidebar-mark">
              <ScaleIcon />
            </span>
            <div>
              <div className="cw-sidebar-brand-name">
                Clauzera <span>AI</span>
              </div>
              <div className="cw-sidebar-brand-sub">Understand Before You Sign.</div>
            </div>
          </NavLink>
          <button className="cw-sidebar-close-btn" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <CloseIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <nav className="cw-sidebar-nav" onClick={() => setNavOpen(false)}>
          <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <DocumentIcon /> Home
          </NavLink>
          <NavLink to="/app/upload" className={({ isActive }) => (isActive ? 'active' : '')}>
            <UploadIcon /> Upload &amp; Analyze
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

        <div className="cw-sidebar-footer" onClick={() => setNavOpen(false)}>
          <div className="cw-sidebar-plan-card">
            <div className="cw-sidebar-plan-label">
              <CrownIcon /> PREMIUM PLAN
            </div>
            <div className="cw-sidebar-plan-desc">
              {isFree ? 'Unlock unlimited analysis and priority support.' : 'Unlimited document analysis.'}
            </div>
            <NavLink to="/app/subscription" className="cw-sidebar-plan-btn">
              {isFree ? 'Upgrade Plan' : 'View Plan'}
              <ChevronRightIcon />
            </NavLink>
          </div>

          <NavLink to="/app/profile" className="cw-sidebar-user" style={{ textDecoration: 'none' }}>
            <span className="cw-sidebar-avatar">{initials || 'U'}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="cw-sidebar-user-name">{user?.firstName || 'User'}</div>
              <div className="cw-sidebar-user-plan">{user?.plan || 'FREE'} plan</div>
            </div>
            <DotsVerticalIcon />
          </NavLink>

          <button className="cw-sidebar-logout" onClick={onLogout}>
            <LogoutIcon /> Log out
          </button>
        </div>
      </aside>

      <main className="cw-main">
        <div className="cw-topstrip">
          <button className="cw-hamburger-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <MenuIcon style={{ width: 20, height: 20 }} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className="cw-bell-btn" onClick={() => setNotifOpen((o) => !o)}>
              <BellIcon style={{ width: 18, height: 18 }} />
              <span className="cw-bell-dot" />
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
