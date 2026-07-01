import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import Icon from '../components/Icon';

// toast('Saved', { type: 'success' }) — non-blocking notifications that
// replace the alert() calls scattered around the old UI.

const ToastContext = createContext(null);

const TYPE_ICON = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'sparkles',
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((ts) =>
      ts.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
    }, 220);
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message, { type = 'info', duration = 4200 } = {}) => {
      const id = nextId++;
      setToasts((ts) => [...ts.slice(-3), { id, message, type }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast--${t.type}${t.leaving ? ' toast--leaving' : ''}`}
          >
            <span className="toast__icon">
              <Icon name={TYPE_ICON[t.type] || 'info'} size={17} />
            </span>
            <span className="toast__msg">{t.message}</span>
            <button
              className="toast__close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
