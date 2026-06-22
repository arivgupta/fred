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
    icon: '🗓️',
    title: 'Your calendar & inbox',
    body: 'Reschedule the dentist, dig up the email from school, block off family time. FRED reads, writes, and keeps your week untangled.',
  },
  {
    icon: '☎️',
    title: 'The calls you dread',
    body: "The pharmacy, the doctor's office, the cable company. FRED dials on your behalf, sits through the hold music, and texts you a clear summary.",
  },
  {
    icon: '🌐',
    title: 'His own browser',
    body: 'FRED opens a real browser to research, compare prices, check availability, and fill out forms — then reports back with the answer.',
  },
  {
    icon: '⏰',
    title: 'Daily automations',
    body: 'Set it once and forget it: “Every morning, prep my inbox, flag what needs me, and text me my day.” FRED runs it on schedule, on his own.',
  },
  {
    icon: '✈️',
    title: 'Flights & deals, watched',
    body: '“Watch United for award seats LA→Tokyo and ping me when the miles price drops.” FRED keeps an eye out and tells you the moment to book.',
  },
  {
    icon: '🧾',
    title: 'Audit your life',
    body: 'FRED reviews your subscriptions, bills, and calendar, then tells you what to cancel, lower, move, or automate. Get your time and money back.',
  },
  {
    icon: '🔔',
    title: 'Reminders that land',
    body: 'Tell FRED once. He nudges you at the right time, on the right channel, and goes quiet during your quiet hours.',
  },
  {
    icon: '🪪',
    title: 'Trust, by design',
    body: 'He confirms anything that spends money or calls a stranger, logs everything in plain language, and lets you see exactly what he knows.',
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
            <button className="landing-btn" onClick={() => navigate('/today')}>Open dashboard</button>
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
          FRED is the deputy who runs your everyday life admin — the calls, the scheduling,
          the inbox, the errands, and the recurring stuff that piles up. So a parent gets more
          time with their kids, and a busy professional gets more focus on real work. Tell him
          once, by phone or text; he handles it and reports back.
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
          <p>Whether you want more time with your family or more focus at work, FRED takes the everyday admin, calls, and busywork off your hands — and can run it on autopilot, every single day.</p>
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
          <h2 style={{ marginTop: 18 }}>Hand FRED your to‑do list.</h2>
          <p>Reschedule a meeting, track down a deal, refill a prescription, or set up a daily automation. He’s waiting.</p>
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
