import FredOrb from './FredOrb';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const { direction, channel, content, timestamp, taskCreated } = message;
  const isUser = direction === 'inbound';

  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--g'}`}>
      {!isUser && <FredOrb size={32} state="idle" className="bubble-avatar" glyph={false} />}
      <div className="bubble-body">
        <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--g'}`}>
          <span>{content}</span>
          {taskCreated && <span className="task-badge">Task created</span>}
        </div>
        <div className="bubble-meta">
          {formatTime(timestamp)} · {channel ? channel.toUpperCase() : ''}
        </div>
      </div>
    </div>
  );
}
