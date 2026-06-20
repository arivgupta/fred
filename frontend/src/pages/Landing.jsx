import { Link, useNavigate } from 'react-router-dom';
import FredOrb from '../components/FredOrb';
import { isLoggedIn } from '../auth';

// FRED's phone number — the front door. (Same line the app surfaces in-product.)
const FRED_PHONE = '+1 (510) 945-3573';
const FRED_TEL = '+15109453573';

const FEATURES = [
  {
    icon: '📞',
    title: 'Just call him',
    body: "No app, no login, no menus. Dial the number and talk to FRED like a friend. He picks up, remembers you, and gets to work.",
  },
  {
    icon: '🌐',
    title: 'He has his own browser',
    body: "FRED can open a real browser and go do things — research, compare prices, check hours, fill forms — then call or text you back with the answer.",
  },
  {
    icon: '🗓️',
    title: 'Calendar & inbox, handled',
    body: 'Reschedule the dentist, find the email from school, block your mornings. FRED reads, writes, and keeps your day untangled.',
  },
  {
    icon: '☎️',
    title: 'He makes the calls you dread',
    body: "Phone the pizza place, the pharmacy, the doctor's office. FRED dials on your behalf, handles the back-and-forth, and texts you a summary.",
  },
  {
    icon: '🔔',
    title: 'Reminders that actually land',
    body: 'Tell FRED once. He nudges you at the right time, on the right channel, and backs off when you ask for quiet hours.',
  },
  {
    icon: '🪪',
    title: 'Trust, by design',
    body: 'FRED confirms anything that spends money or calls a stranger, logs everything in plain language, and lets you see exactly what he knows.',
  },
];

const STEPS = [
  { n: 1, title: 'Call FRED', body: 'Dial the number — or start a chat. Tell him what you need in plain words.' },
  { n: 2, title: 'He gets to work', body: 'FRED plans it out, browses, schedules, and makes calls — checking with you before anything risky.' },
  { n: 3, title: 'He reports back', body: 'A text or a callback the moment it’s done: “Booked Tue 3:30. Anything else?”' },
];

export default function Landing() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true" />

      <header className="landing-nav">
        <div className="landing-brand">
          <FredOrb size={34} state="idle" />
          <span>FRED</span>
        </div>
        <nav className="landing-nav-actions">
          <a className="landing-link" href="#how">How it works</a>
          <a className="landing-link" href="#features">What he does</a>
          {loggedIn ? (
            <button className="landing-btn" onClick={() => navigate('/today')}>Open mission control</button>
          ) : (
            <>
              <Link className="landing-link" to="/signin">Sign in</Link>
              <button className="landing-btn" onClick={() => navigate('/signup')}>Get started</button>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <FredOrb size={168} state="idle" />
        <div className="hero-eyebrow"><span className="dot" /> FRED is online — call anytime</div>
        <h1 className="hero-title">
          The assistant you can<br /><span className="grad">actually call.</span>
        </h1>
        <p className="hero-sub">
          FRED is your friendly, resourceful everyday deputy. He has your calendar, your inbox,
          and a browser of his own. Pick up the phone, tell him what you need, and he handles it —
          then calls you back when it’s done.
        </p>
        <div className="hero-cta">
          <a className="call-cta" href={`tel:${FRED_TEL}`}>
            <span className="call-icon">📞</span> Call FRED · {FRED_PHONE}
          </a>
          <div className="hero-cta-secondary">
            <span>Prefer to type?</span>
            <Link to={loggedIn ? '/chat' : '/signup'}>Talk to FRED in chat →</Link>
          </div>
          <p className="hero-note">No account needed to call. He’ll get you set up over the phone.</p>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="section-heading">
          <h2>One deputy. Everything off your plate.</h2>
          <p>FRED isn’t a chatbot that answers questions. He’s an assistant that gets things done — across the phone, your calendar, your inbox, and the open web.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="how">
        <div className="section-heading">
          <h2>How it works</h2>
          <p>Delegating to FRED feels like texting the most organized person you know — except he never forgets and never gets tired.</p>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta-band">
        <div className="cta-card">
          <FredOrb size={84} state="speaking" />
          <h2 style={{ marginTop: 18 }}>Give FRED a call.</h2>
          <p>He’s waiting. Set a reminder, reschedule a meeting, or ask him to track something down.</p>
          <a className="call-cta" href={`tel:${FRED_TEL}`}>
            <span className="call-icon">📞</span> {FRED_PHONE}
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand">
          <FredOrb size={28} state="idle" glyph={false} />
          <span>FRED</span>
        </div>
        <span>Your friendly, resourceful everyday deputy. Call {FRED_PHONE}.</span>
      </footer>
    </div>
  );
}
