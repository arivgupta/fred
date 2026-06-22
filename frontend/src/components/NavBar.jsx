import { NavLink, useNavigate } from 'react-router-dom';
import { isLoggedIn, clearUser } from '../auth';
import FredOrb from './FredOrb';

const FRED_PHONE = '+1 (510) 945-3573';
const FRED_TEL = '+15109453573';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: '☀' },
  { to: '/chat', label: 'Talk to FRED', icon: '💬' },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/conversations', label: 'Activity', icon: '◷' },
  { to: '/profile', label: 'Profile', icon: '⊙' },
];

export default function NavBar() {
  const loggedIn = isLoggedIn();
  const navigate = useNavigate();

  function handleAuth() {
    if (loggedIn) {
      clearUser();
      navigate('/');
    } else {
      navigate('/signup');
    }
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <FredOrb size={34} state="idle" />
        <span>FRED</span>
      </NavLink>

      <ul className="navbar-links">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <a className="navbar-cta" href={`tel:${FRED_TEL}`}>📞 Call FRED</a>
      <p className="navbar-phone"><b>{FRED_PHONE}</b></p>
      <button className="navbar-signup" onClick={handleAuth}>
        {loggedIn ? 'Sign Out' : 'Sign Up'}
      </button>
    </nav>
  );
}
