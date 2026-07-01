// Date & string formatting helpers shared across pages.

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(ts) {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
}

// "Today" / "Yesterday" / "Mon, Jun 3"
export function formatDayLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (isSameDay(d, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// "just now" / "4m ago" / "2h ago" / "Yesterday" / "Jun 3"
export function relativeTime(ts, now = Date.now()) {
  const diff = now - new Date(ts).getTime();
  if (diff < 45 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  const d = new Date(ts);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// "3m 05s" countdown string, or null once expired.
export function countdown(deadlineTs, now = Date.now()) {
  const remaining = new Date(deadlineTs).getTime() - now;
  if (remaining <= 0) return null;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

export function greetingForHour(hour) {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || '';
}

export function initials(name, fallback = 'G') {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function titleCase(s) {
  if (!s) return '';
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
