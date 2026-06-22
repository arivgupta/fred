import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks } from '../api';
import { getUser } from '../auth';
import FredOrb from '../components/FredOrb';
import TaskCard from '../components/TaskCard';

const FRED_PHONE = '+1 (510) 945-3573';
const FRED_TEL = '+15109453573';

const ACTIVE = new Set(['PENDING', 'IN_PROGRESS', 'ESCALATION_PENDING']);

const QUICK_ACTIONS = [
  { icon: '🔔', label: 'Set a reminder', prefill: 'Remind me to ' },
  { icon: '🗓️', label: 'Check my day', prefill: "What's on my calendar today?" },
  { icon: '☎️', label: 'Make a call for me', prefill: 'Can you call ' },
  { icon: '🌐', label: 'Look something up', prefill: 'Can you find out ' },
  { icon: '⏰', label: 'Set up an automation', prefill: 'Every morning, ' },
  { icon: '✈️', label: 'Watch for a deal', prefill: 'Watch for ' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function titleCase(s) {
  if (!s) return '';
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function Today() {
  const navigate = useNavigate();
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const firstName = (user?.name || '').trim().split(' ')[0];

  useEffect(() => {
    if (!user?.id) {
      navigate('/signin?next=/today', { replace: true });
      return;
    }
    let cancelled = false;
    getTasks(user.id)
      .then((rows) => {
        if (cancelled) return;
        setActive(
          rows
            .filter((t) => ACTIVE.has(t.status))
            .map((t) => ({
              id: t.id,
              description: t.description,
              type: titleCase(t.type),
              status: t.status,
              createdAt: t.created_at,
            }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, user?.id]);

  const needsApproval = active.filter((t) => t.status === 'ESCALATION_PENDING');

  function ask(prefill) {
    navigate('/chat', { state: { prefill } });
  }

  return (
    <div className="page">
      <div className="today-hero">
        <FredOrb size={64} state="idle" />
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="page-subtitle">FRED’s on the clock. What can he take off your plate today?</p>
        </div>
      </div>

      {/* Call / chat hero */}
      <section className="today-call-card">
        <div className="today-call-copy">
          <span className="today-call-eyebrow">FRED is online</span>
          <h2>Call him. He’ll handle it.</h2>
          <p>Talk to FRED like a friend — reminders, scheduling, calls, research. Or type it out.</p>
        </div>
        <div className="today-call-actions">
          <a className="call-cta" href={`tel:${FRED_TEL}`}><span className="call-icon">📞</span> {FRED_PHONE}</a>
          <button className="btn btn-ghost" onClick={() => navigate('/chat')}>Open chat →</button>
        </div>
      </section>

      {/* Quick actions */}
      <h2 className="section-title" style={{ marginTop: 28 }}>Hand FRED something</h2>
      <div className="quick-grid">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label} className="quick-action" onClick={() => ask(a.prefill)}>
            <span className="quick-icon">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Needs approval */}
      {needsApproval.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 32 }}>Needs your okay</h2>
          <p className="card-description" style={{ marginBottom: 12 }}>
            FRED paused on these — they spend money, call someone, or hit a conflict. Approve in Tasks.
          </p>
          <div className="task-list">
            {needsApproval.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </>
      )}

      {/* On FRED's plate */}
      <h2 className="section-title" style={{ marginTop: 32 }}>On FRED’s plate</h2>
      {loading && <p className="task-empty">Loading…</p>}
      {!loading && active.length === 0 && (
        <div className="today-empty">
          <FredOrb size={56} state="idle" />
          <p>Nothing in flight right now. You’re all caught up.</p>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>Ask FRED for something</button>
        </div>
      )}
      {!loading && active.length > 0 && (
        <div className="task-list">
          {active.filter((t) => t.status !== 'ESCALATION_PENDING').map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
