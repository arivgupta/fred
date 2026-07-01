import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMessages, sendChatMessage } from '../api';
import { useAuthUser } from '../hooks';
import { useTasks } from '../context/TasksContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { formatDayLabel, formatTime, isSameDay } from '../lib/format';

const SUGGESTIONS = [
  { icon: 'bell', text: 'Remind me to pick up Emma from soccer at 4pm' },
  { icon: 'calendar', text: 'What’s on my calendar tomorrow?' },
  { icon: 'phone', text: 'Call me in 30 minutes to leave for practice' },
  { icon: 'mail', text: 'Any important emails this morning?' },
];

// Messages sent within this window by the same author render grouped.
const GROUP_WINDOW_MS = 3 * 60 * 1000;

function TypingIndicator() {
  return (
    <div className="msg msg--g">
      <span className="msg__avatar-slot">
        <Avatar brand size={30} />
      </span>
      <div className="typing" aria-label="G is typing">
        <span className="typing__dot" />
        <span className="typing__dot" />
        <span className="typing__dot" />
      </div>
    </div>
  );
}

function MessageRow({ msg, prev }) {
  const isUser = msg.role === 'user';
  const grouped =
    prev &&
    prev.role === msg.role &&
    msg.timestamp - prev.timestamp < GROUP_WINDOW_MS;

  return (
    <div
      className={`msg ${isUser ? 'msg--user' : 'msg--g'}${grouped ? ' msg--compact' : ''}`}
    >
      {!isUser && (
        <span className="msg__avatar-slot">
          {!grouped ? <Avatar brand size={30} /> : null}
        </span>
      )}
      <div className="msg__body">
        <div className="msg__bubble">{msg.content}</div>
        {msg.taskCreated && (
          <Link to="/tasks" className="msg__task-chip">
            <Icon name="check-circle" size={12} strokeWidth={2.3} />
            Task created — track it
          </Link>
        )}
        {msg.escalated && (
          <Link to="/tasks" className="msg__task-chip msg__task-chip--attention">
            <Icon name="shield" size={12} strokeWidth={2.3} />
            Needs your approval
          </Link>
        )}
        {!grouped && (
          <span className="msg__meta">{formatTime(msg.timestamp)}</span>
        )}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="chat__thread" aria-hidden="true">
      <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
        <Skeleton width={30} height={30} radius="50%" />
        <Skeleton width="46%" height={40} radius={16} />
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 12, flexDirection: 'row-reverse' }}>
        <Skeleton width="38%" height={40} radius={16} />
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
        <Skeleton width={30} height={30} radius="50%" />
        <Skeleton width="54%" height={56} radius={16} />
      </div>
    </div>
  );
}

export default function Chat() {
  const user = useAuthUser();
  const location = useLocation();
  const { refresh: refreshTasks } = useTasks();

  const [messages, setMessages] = useState([]);
  const [hydrating, setHydrating] = useState(true);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [tasksCreatedCount, setTasksCreatedCount] = useState(0);

  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const prefillDone = useRef(false);

  // Hydrate the persisted web-chat thread so the conversation survives
  // navigation and reloads (messages are logged server-side with
  // channel="chat").
  useEffect(() => {
    if (!user?.id) {
      setHydrating(false);
      return undefined;
    }
    let cancelled = false;
    getMessages(user.id, 200)
      .then((rows) => {
        if (cancelled) return;
        const chat = rows
          .filter((m) => m.channel === 'chat')
          .reverse()
          .map((m) => ({
            id: m.id,
            role: m.direction === 'inbound' ? 'user' : 'assistant',
            content: m.content,
            timestamp: Date.parse(m.timestamp),
          }));
        setMessages(chat);
      })
      .catch(() => {
        /* fresh thread is fine */
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Prefill handed over from the Home "Ask G" card.
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (prefill && !prefillDone.current) {
      prefillDone.current = true;
      setInput(prefill);
      textareaRef.current?.focus();
    }
  }, [location.state]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  const send = useCallback(
    async (text) => {
      const trimmed = (text ?? '').trim();
      if (!trimmed || typing || !user?.id) return;

      const userMsg = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setTyping(true);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const { reply, tasks_created, escalated } = await sendChatMessage(
          user.id,
          trimmed,
          history
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now() + 1}`,
            role: 'assistant',
            content: reply,
            timestamp: Date.now(),
            taskCreated: tasks_created.length > 0 && !escalated,
            escalated,
          },
        ]);

        if (tasks_created.length > 0 || escalated) {
          setTasksCreatedCount((c) => c + Math.max(tasks_created.length, 1));
          refreshTasks({ silent: true });
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now() + 1}`,
            role: 'assistant',
            content:
              err.message && !err.message.startsWith('Request failed')
                ? err.message
                : 'Sorry — I had trouble reaching the server. Try again?',
            timestamp: Date.now(),
            isError: true,
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [messages, typing, user?.id, refreshTasks]
  );

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
  }

  // Interleave day dividers.
  const timeline = useMemo(() => {
    const items = [];
    messages.forEach((m, i) => {
      const prev = messages[i - 1];
      if (!prev || !isSameDay(prev.timestamp, m.timestamp)) {
        items.push({ kind: 'day', id: `day-${m.id}`, ts: m.timestamp });
      }
      items.push({ kind: 'msg', id: m.id, msg: m, prev });
    });
    return items;
  }, [messages]);

  const empty = !hydrating && messages.length === 0;

  return (
    <div className="chat">
      <header className="chat__header">
        <Avatar brand size={36} />
        <div className="chat__header-info">
          <h1>G</h1>
          <span className="chat__header-status">
            <span className="status-dot status-dot--live" />
            Online — replies in seconds
          </span>
        </div>
      </header>

      {tasksCreatedCount > 0 && (
        <div className="chat__banner">
          <Icon name="check-circle" size={14} strokeWidth={2.2} />
          <span>
            {tasksCreatedCount} task{tasksCreatedCount === 1 ? '' : 's'} created
            this session
          </span>
          <Link to="/tasks">View tasks →</Link>
        </div>
      )}

      <div className="chat__scroll" ref={scrollRef}>
        {hydrating ? (
          <HistorySkeleton />
        ) : empty ? (
          <div className="chat-hello">
            <div className="chat-hello__orb">G</div>
            <h2 className="chat-hello__title">What can I take off your plate?</h2>
            <p className="chat-hello__sub">
              Reminders, scheduling, phone calls, calendar questions — just ask
              like you’d ask a person.
            </p>
            <div className="chat-hello__grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  className="chat-hello__card"
                  onClick={() => send(s.text)}
                >
                  <Icon name={s.icon} size={17} />
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat__thread">
            {timeline.map((item) =>
              item.kind === 'day' ? (
                <div key={item.id} className="chat__day-divider">
                  {formatDayLabel(item.ts)}
                </div>
              ) : (
                <MessageRow key={item.id} msg={item.msg} prev={item.prev} />
              )
            )}
            {typing && <TypingIndicator />}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="chat__composer">
        <div className="composer">
          <textarea
            ref={textareaRef}
            className="composer__input"
            placeholder="Message G…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Message G"
          />
          <button
            className="composer__send"
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            aria-label="Send message"
          >
            <Icon name="arrow-up" size={18} strokeWidth={2.3} />
          </button>
        </div>
        <p className="chat__hint">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
