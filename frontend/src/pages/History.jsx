import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMessages } from '../api';
import { useAuthUser } from '../hooks';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import MessageBubble from '../components/MessageBubble';
import { SkeletonCard } from '../components/Skeleton';
import { formatDayLabel, formatTime } from '../lib/format';

// A gap this long (or a channel change) starts a new session card.
const SESSION_GAP_MS = 30 * 60 * 1000;

const CHANNEL_META = {
  chat: { icon: 'chat', label: 'Web chat', cls: 'session__channel--chat' },
  sms: { icon: 'chat', label: 'Text', cls: 'session__channel--sms' },
  voice: { icon: 'phone', label: 'Call', cls: 'session__channel--voice' },
};

const CHANNEL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'chat', label: 'Web chat' },
  { key: 'sms', label: 'Text' },
  { key: 'voice', label: 'Calls' },
];

// Walk chronological messages; break on channel change or long gap.
function groupIntoSessions(messages) {
  const sessions = [];
  let current = null;
  for (const m of messages) {
    const ts = new Date(m.timestamp).getTime();
    const sameChannel = current && current.channel === m.channel;
    const withinGap = current && ts - current.lastTs <= SESSION_GAP_MS;
    if (current && sameChannel && withinGap) {
      current.messages.push(m);
      current.lastTs = ts;
    } else {
      current = {
        id: m.id,
        channel: m.channel,
        startedAt: m.timestamp,
        lastTs: ts,
        messages: [m],
      };
      sessions.push(current);
    }
  }
  return sessions;
}

function Session({ session, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = CHANNEL_META[session.channel] || CHANNEL_META.sms;
  const first = session.messages[0];

  return (
    <article className={`session${open ? ' session--open' : ''}`}>
      <button
        className="session__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`session__channel ${meta.cls}`}>
          <Icon name={meta.icon} size={15} />
        </span>
        <span className="session__meta">
          <span className="session__preview">{first.content}</span>
          <span className="session__sub">
            <span>{meta.label}</span>
            <span aria-hidden="true">·</span>
            <span>{formatTime(session.startedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {session.messages.length} message
              {session.messages.length === 1 ? '' : 's'}
            </span>
          </span>
        </span>
        <span className="session__chevron">
          <Icon name="chevron-down" size={16} />
        </span>
      </button>
      {open && (
        <div className="session__body">
          <div className="session__thread">
            {session.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function History() {
  const user = useAuthUser();
  const [messages, setMessages] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [channel, setChannel] = useState('all');

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    getMessages(user.id, 200)
      .then((rows) => {
        if (!cancelled) setMessages([...rows].reverse()); // chronological
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load history');
          setMessages([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Sessions newest-first, grouped by day for scannability.
  const dayGroups = useMemo(() => {
    if (!messages) return [];
    const filtered =
      channel === 'all' ? messages : messages.filter((m) => m.channel === channel);
    const sessions = groupIntoSessions(filtered).reverse();
    const groups = [];
    for (const s of sessions) {
      const label = formatDayLabel(s.startedAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.sessions.push(s);
      else groups.push({ label, sessions: [s] });
    }
    return groups;
  }, [messages, channel]);

  const loading = messages === null;
  const hasAny = (messages || []).length > 0;

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head__titles">
          <h1 className="page-title">History</h1>
          <p className="page-sub">
            Every conversation with G — web chat, texts, and calls.
          </p>
        </div>
      </header>

      <div className="history-filters" role="group" aria-label="Filter by channel">
        {CHANNEL_FILTERS.map((f) => (
          <button
            key={f.key}
            className="task-filter"
            aria-pressed={channel === f.key}
            onClick={() => setChannel(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <>
          <SkeletonCard lines={1} />
          <div style={{ height: 12 }} />
          <SkeletonCard lines={1} />
        </>
      ) : !hasAny ? (
        <EmptyState
          icon="chat"
          title="No conversations yet"
          body="Start a chat here in the app, or text G directly — every exchange is kept here for reference."
          cta={
            <Link to="/chat" className="btn btn--primary">
              <Icon name="chat" size={15} />
              Start chatting
            </Link>
          }
        />
      ) : dayGroups.length === 0 ? (
        <EmptyState
          icon="history"
          title="Nothing on this channel yet"
          body="Try another filter, or start a new conversation."
        />
      ) : (
        dayGroups.map((g, gi) => (
          <section key={g.label} className="history-group">
            <h2 className="section-label">{g.label}</h2>
            {g.sessions.map((s, si) => (
              <Session key={s.id} session={s} defaultOpen={gi === 0 && si === 0} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
