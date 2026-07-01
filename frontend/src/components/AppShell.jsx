import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearUser } from '../auth';
import { useAuthUser } from '../hooks';
import { getTheme, toggleTheme } from '../theme';
import { useTasks } from '../context/TasksContext';
import Avatar from './Avatar';
import Icon from './Icon';
import Logo from './Logo';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/chat', label: 'Chat', icon: 'chat' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks', badge: 'approvals' },
  { to: '/conversations', label: 'History', icon: 'history' },
  { to: '/profile', label: 'Settings', icon: 'settings' },
];

function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => {
    const sync = () => setThemeState(getTheme());
    window.addEventListener('g:theme', sync);
    return () => window.removeEventListener('g:theme', sync);
  }, []);

  return (
    <button
      className="btn--icon btn"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

export default function AppShell() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const { approvalsCount } = useTasks();

  function signOut() {
    clearUser();
    navigate('/signin');
  }

  const badgeFor = (item) =>
    item.badge === 'approvals' && approvalsCount > 0 ? approvalsCount : 0;

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar__brand">
          <Logo size={34} />
          <span>
            <span className="sidebar__brand-name">G</span>
            <span className="sidebar__brand-tag">Family secretary</span>
          </span>
        </NavLink>

        <ul className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {badgeFor(item) > 0 && (
                  <span className="nav-item__badge">{badgeFor(item)}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar__spacer" />

        <div className="sidebar__footer">
          <div className="sidebar__theme-row">
            <span className="sidebar__theme-label">Appearance</span>
            <ThemeToggle />
          </div>
          {user ? (
            <div className="user-chip">
              <Avatar name={user.name || user.email} size={32} />
              <span className="user-chip__meta">
                <span className="user-chip__name">{user.name || 'You'}</span>
                <span className="user-chip__email">{user.email}</span>
              </span>
              <button
                className="user-chip__signout"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
              >
                <Icon name="log-out" size={15} />
              </button>
            </div>
          ) : (
            <NavLink to="/signin" className="btn btn--primary sidebar__signin">
              Sign in
            </NavLink>
          )}
        </div>
      </aside>

      <div className="shell__main">
        <Outlet />
      </div>

      <nav className="tabbar" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'tabbar__item active' : 'tabbar__item'
            }
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
            {badgeFor(item) > 0 && (
              <span className="tabbar__badge">{badgeFor(item)}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
