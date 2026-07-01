import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMessages } from '../api';
import { useAuthUser, useNow } from '../hooks';
import { useTasks } from '../context/TasksContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import Skeleton from '../components/Skeleton';
import {
  firstName,
  formatDateTime,
  greetingForHour,
  relativeTime,
} from '../lib/format';
import { upcomingSchedule } from '../lib/tasks';

// G's phone line shown on the "text G directly" card. Configurable per
// deploy; the default is the project's Twilio number.
const G_PHONE = import.meta.env.VITE_G_PHONE_NUMBER || '+1 (510) 945-3573';

const ASK_CHIPS = [
  'Remind me about soccer pickup at 4pm',
  'What’s on my calendar tomorrow?',
  'Call me in 30 minutes',
];

const CHANNEL_META = {
  chat: { icon: 'chat', cls: 'session__channel--chat', label: 'Chat' },
  sms: { icon: 'chat', cls: 'session__channel--sms', label: 'Text' },
  voice: { icon: 'phone', cls: 'session__channel--voice', label: 'Call' },
};

function StatCard({ to, label, value, icon, attention }) {
  const body = (
    <>
      <span className="stat__top">
        <span className="stat__label">{label}</span>
        <Icon name={icon} size={16} />
      </span>
      <span className="stat__value">{value}</span>
    </>
  );
  return (
    <Link to={to} className={`stat${attention ? ' stat--attention' : ''}`}>
      {body}
    </Link>
  );
}

function ApprovalRow({ task }) {
  const { approve, deny } = useTasks();
  const toast = useToast();
  const [busy, setBusy] = useState('');

  async function act(kind) {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === 'approve') {
        await approve(task.id);
        toast('Approved — G is on it.', { type: 'success' });
      } else {
        await deny(task.id);
        toast('Denied. G won’t proceed.', { type: 'info' });
      }
    } catch (err) {
      toast(err.message || 'That didn’t go through — try again.', { type: 'error' });
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="mini-approval">
      <p className="mini-approval__desc">{task.description}</p>
      <div className="mini-approval__row">
        <span className="chip chip--attention">
          <Icon name="shield" size={11} strokeWidth={2.4} />
          Needs approval
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--success btn--sm"
            onClick={() => act('approve')}
            disabled={!!busy}
          >
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={() => act('deny')}
            disabled={!!busy}
          >
            {busy === 'deny' ? 'Denying…' : 'Deny'}
          </button>
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const now = useNow(30_000);
  const { tasks, loading: tasksLoading } = useTasks();

  const [messages, setMessages] = useState(null); // null = loading
  const [ask, setAsk] = useState('');

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    getMessages(user.id, 30)
      .then((rows) => {
        if (!cancelled) setMessages(rows);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const approvals = useMemo(
    () => tasks.filter((t) => t.status === 'ESCALATION_PENDING'),
    [tasks]
  );
  const activeCount = useMemo(
    () =>
      tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
        .length,
    [tasks]
  );
  const doneThisWeek = useMemo(() => {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return tasks.filter(
      (t) => t.status === 'COMPLETED' && Date.parse(t.updatedAt) >= weekAgo
    ).length;
  }, [tasks, now]);
  const upNext = useMemo(() => upcomingSchedule(tasks, 5), [tasks]);
  const recent = useMemo(() => (messages || []).slice(0, 6), [messages]);

  function submitAsk(text) {
    const t = (text ?? ask).trim();
    navigate('/chat', t ? { state: { prefill: t } } : undefined);
  }

  const dateLabel = new Date(now).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page">
      <header className="home-hero">
        <p className="home-hero__date">{dateLabel}</p>
        <h1 className="home-hero__greeting">
          {greetingForHour(new Date(now).getHours())}
          {firstName(user?.name) ? `, ${firstName(user?.name)}` : ''}.
        </h1>
        <p className="home-hero__sub">
          {approvals.length > 0
            ? `${approvals.length} task${approvals.length === 1 ? ' is' : 's are'} waiting on your approval.`
            : activeCount > 0
              ? `G is tracking ${activeCount} task${activeCount === 1 ? '' : 's'} for you.`
              : 'All clear. Delegate something and take the evening off.'}
        </p>
      </header>

      <div className="stats">
        <StatCard
          to="/tasks"
          label="Needs approval"
          value={tasksLoading ? '–' : approvals.length}
          icon="shield"
          attention={approvals.length > 0}
        />
        <StatCard
          to="/tasks"
          label="Active tasks"
          value={tasksLoading ? '–' : activeCount}
          icon="tasks"
        />
        <StatCard
          to="/tasks"
          label="Done this week"
          value={tasksLoading ? '–' : doneThisWeek}
          icon="check-circle"
        />
        <StatCard
          to="/conversations"
          label="Messages"
          value={messages === null ? '–' : messages.length}
          icon="chat"
        />
      </div>

      <div className="home-grid">
        <div className="home-col">
          <section className="ask-card">
            <div className="ask-card__head">
              <Logo size={30} />
              <span className="ask-card__title">What can G take off your plate?</span>
            </div>
            <form
              className="ask-card__form"
              onSubmit={(e) => {
                e.preventDefault();
                submitAsk();
              }}
            >
              <input
                className="input"
                placeholder="Remind me, schedule it, call them…"
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                aria-label="Ask G"
              />
              <button type="submit" className="btn btn--primary" aria-label="Ask G">
                <Icon name="arrow-right" size={16} />
              </button>
            </form>
            <div className="ask-card__chips">
              {ASK_CHIPS.map((c) => (
                <button key={c} className="ask-chip" onClick={() => submitAsk(c)}>
                  {c}
                </button>
              ))}
            </div>
          </section>

          {approvals.length > 0 && (
            <section className="card card--pad">
              <h2 className="card__title">
                <Icon name="shield" size={16} />
                Waiting on you
              </h2>
              {approvals.slice(0, 3).map((t) => (
                <ApprovalRow key={t.id} task={t} />
              ))}
              {approvals.length > 3 && (
                <Link to="/tasks" className="card__link">
                  View all {approvals.length} →
                </Link>
              )}
            </section>
          )}

          <section className="card card--pad">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <h2 className="card__title" style={{ marginBottom: 0 }}>
                <Icon name="history" size={16} />
                Recent activity
              </h2>
              <Link to="/conversations" className="card__link">
                View all
              </Link>
            </div>
            {messages === null ? (
              <div style={{ display: 'grid', gap: 10, paddingTop: 10 }}>
                <Skeleton height={14} width="88%" />
                <Skeleton height={14} width="72%" />
                <Skeleton height={14} width="80%" />
              </div>
            ) : recent.length === 0 ? (
              <p className="card__desc" style={{ margin: '8px 0 0' }}>
                No conversations yet — say hello in the chat or text G directly.
              </p>
            ) : (
              <ul className="feed">
                {recent.map((m) => {
                  const meta = CHANNEL_META[m.channel] || CHANNEL_META.sms;
                  return (
                    <li key={m.id} className="feed__item">
                      <span className={`feed__icon ${meta.cls}`}>
                        <Icon name={meta.icon} size={14} />
                      </span>
                      <span className="feed__body">
                        <span className="feed__text">
                          {m.direction === 'inbound' ? 'You: ' : 'G: '}
                          {m.content}
                        </span>
                        <span className="feed__meta">
                          {meta.label} · {relativeTime(m.timestamp, now)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="home-col">
          <section className="card card--pad">
            <h2 className="card__title">
              <Icon name="clock" size={16} />
              Up next
            </h2>
            {upNext.length === 0 ? (
              <p className="card__desc" style={{ margin: '8px 0 0' }}>
                Nothing scheduled. Ask G to remind you about something.
              </p>
            ) : (
              <ul className="upnext">
                {upNext.map((t) => (
                  <li key={t.id} className="upnext__item">
                    <span className="upnext__time">
                      {formatDateTime(t.scheduledAt)}
                    </span>
                    <span className="upnext__desc">
                      {t.description}
                      <span>{t.typeLabel}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="gline">
            <h2 className="gline__title">
              <Icon name="phone" size={16} />
              G works over text, too
            </h2>
            <p className="gline__body">
              No app needed when you’re out the door — text or call G like you
              would a human assistant.
            </p>
            <span className="gline__number">{G_PHONE}</span>
            <p className="gline__hint">Same brain, same memory, any channel.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
