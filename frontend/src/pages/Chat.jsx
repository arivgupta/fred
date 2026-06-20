import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sendChatMessage } from '../api';
import { getUser } from '../auth';
import FredOrb from '../components/FredOrb';
import TypingIndicator from '../components/TypingIndicator';
import SuggestionPills from '../components/SuggestionPills';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-msg-row${isUser ? ' chat-msg-row--user' : ''}`}>
      {!isUser && <FredOrb size={32} state="idle" className="chat-avatar" glyph={false} />}
      <div className="chat-msg-body">
        <div className={`chat-bubble${isUser ? ' chat-bubble--user' : ' chat-bubble--g'}`}>
          <span>{msg.content}</span>
        </div>
        <div className="chat-msg-time">{formatTime(msg.timestamp)}</div>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [tasksCreatedCount, setTasksCreatedCount] = useState(0);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u?.id) {
      navigate('/signin?next=/chat', { replace: true });
      return;
    }
    setUserId(u.id);
  }, [navigate]);

  // Prefill from a Today quick-action (navigate('/chat', { state: { prefill }}))
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (prefill) {
      setInput(prefill);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(prefill.length, prefill.length);
          ta.style.height = 'auto';
          ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
        }
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing || !userId) return;

    const userMsg = { id: `msg-${Date.now()}`, role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const { reply, tasks_created } = await sendChatMessage(userId, trimmed, history);
      const assistantMsg = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: reply, timestamp: Date.now() };
      setMessages((prev) => [...prev, assistantMsg]);
      if (Array.isArray(tasks_created) && tasks_created.length > 0) {
        setTasksCreatedCount((c) => c + tasks_created.length);
      }
    } catch (err) {
      const errMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: err.message?.startsWith('HTTP')
          ? 'Sorry, I had trouble reaching the server. Try again?'
          : err.message || 'Sorry, something went wrong. Try again?',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setTyping(false);
    }
  }, [messages, typing, userId]);

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
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }

  return (
    <div className="chat-page">
      <div className="chat-panel">
        <div className="chat-header">
          <FredOrb size={40} state={typing ? 'thinking' : 'idle'} />
          <div className="chat-header-info">
            <h2>FRED</h2>
            <p>Your friendly, resourceful everyday deputy</p>
          </div>
          <span className="chat-header-status">Online</span>
        </div>

        {tasksCreatedCount > 0 && (
          <div className="chat-banner">
            <span className="chat-banner-icon" aria-hidden="true">✓</span>
            <span className="chat-banner-text">
              FRED set up {tasksCreatedCount} task{tasksCreatedCount === 1 ? '' : 's'} this session
            </span>
            <Link to="/tasks" className="chat-banner-link">View in Tasks →</Link>
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 ? (
            <SuggestionPills onSelect={send} />
          ) : (
            <>
              {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
              {typing && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="chat-input-bar">
          <div className="chat-input-inner">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Ask FRED anything…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={typing}
            />
            <button
              className="chat-send-btn"
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
