import Icon from './Icon';
import Logo from './Logo';

const POINTS = [
  {
    icon: 'chat',
    title: 'Delegate by chat, text, or call',
    body: 'One number, one chat — G handles the rest.',
  },
  {
    icon: 'calendar',
    title: 'Calendar & inbox aware',
    body: 'Connected to Google Calendar and Gmail, so nothing double-books.',
  },
  {
    icon: 'shield',
    title: 'You approve the big stuff',
    body: 'G asks before anything irreversible — you stay in control.',
  },
];

export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <div className="auth__brand-top">
          <Logo size={36} />
          <span className="auth__brand-name">G</span>
        </div>

        <div className="auth__hero">
          <h1 className="auth__headline">
            The secretary every parent <em>deserves</em>.
          </h1>
          <p className="auth__lede">
            G remembers the pickups, books the appointments, and makes the
            phone calls you keep putting off — so your evenings belong to
            your family again.
          </p>
          <ul className="auth__points">
            {POINTS.map((p) => (
              <li key={p.title} className="auth__point">
                <span className="auth__point-icon">
                  <Icon name={p.icon} size={15} />
                </span>
                <span>
                  <strong>{p.title}</strong>
                  <span>{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="auth__quote">
          “I texted G to reschedule the dentist and remind me about soccer
          pickup. Both handled before my coffee went cold.”
          <footer>— A very relieved parent</footer>
        </blockquote>
      </aside>

      <main className="auth__panel">
        <div className="auth__card">{children}</div>
      </main>
    </div>
  );
}
