import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearToken, getIdentity } from '../api';
import {
  AlertIcon,
  ClipboardIcon,
  CreditCardIcon,
  DocumentIcon,
  GridIcon,
  LogoutIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
  UsersIcon,
} from '../icons';

const PAGE_TITLES: Record<string, { title: string; crumb: string }> = {
  '/dashboard': { title: 'Dashboard', crumb: 'Overview' },
  '/users': { title: 'Users', crumb: 'All registered accounts' },
  '/documents': { title: 'Documents', crumb: 'All uploaded documents' },
  '/subscriptions': { title: 'Subscriptions', crumb: 'Plans & trial access' },
  '/payments': { title: 'Payments & Revenue', crumb: 'Razorpay transactions' },
  '/reviews': { title: 'Reviews', crumb: 'In-app user feedback' },
  '/audit-log': { title: 'Audit Log', crumb: 'Admin, user & system activity' },
  '/otp-log': { title: 'OTP Log', crumb: 'Sign-in requests & verifications' },
  '/exceptions': { title: 'Exception Log', crumb: 'Server errors' },
};

function initialsFor(label: string | null) {
  if (!label) return 'A';
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : 'A';
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const identity = getIdentity();
  const displayName = identity?.name || identity?.email || identity?.phone || 'Admin';
  const page = PAGE_TITLES[location.pathname] ?? { title: 'LegalLens AI', crumb: '' };

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark">LL</div>
          <div>
            <div className="name">LegalLens AI</div>
            <div className="sub">Admin console</div>
          </div>
        </div>

        <div className="sidebar-nav-scroll">
          <div className="nav-section-label">Menu</div>
          <nav>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              <GridIcon />
              Dashboard
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              <UsersIcon />
              Users
            </NavLink>
            <NavLink to="/documents" className={({ isActive }) => (isActive ? 'active' : '')}>
              <DocumentIcon />
              Documents
            </NavLink>
            <NavLink to="/subscriptions" className={({ isActive }) => (isActive ? 'active' : '')}>
              <TagIcon />
              Subscriptions
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => (isActive ? 'active' : '')}>
              <CreditCardIcon />
              Payments
            </NavLink>
            <NavLink to="/reviews" className={({ isActive }) => (isActive ? 'active' : '')}>
              <StarIcon />
              Reviews
            </NavLink>
            <NavLink to="/audit-log" className={({ isActive }) => (isActive ? 'active' : '')}>
              <ClipboardIcon />
              Audit Log
            </NavLink>
            <NavLink to="/otp-log" className={({ isActive }) => (isActive ? 'active' : '')}>
              <PhoneIcon />
              OTP Log
            </NavLink>
            <NavLink to="/exceptions" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AlertIcon />
              Exception Log
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{initialsFor(displayName)}</div>
            <div className="meta">
              <div className="label">{displayName}</div>
              <div className="sub">Administrator</div>
            </div>
            <button onClick={handleLogout} title="Log out">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <h2>{page.title}</h2>
            {page.crumb && <div className="crumb">{page.crumb}</div>}
          </div>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
