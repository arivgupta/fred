import Avatar from './Avatar';
import { formatTime } from '../lib/format';

// Read-only bubble for the History page. Inbound = the parent (right),
// outbound = G (left) — matches the live chat orientation.
export default function MessageBubble({ message }) {
  const isUser = message.direction === 'inbound';
  return (
    <div className={`msg ${isUser ? 'msg--user' : 'msg--g'}`}>
      {!isUser && (
        <span className="msg__avatar-slot">
          <Avatar brand size={30} />
        </span>
      )}
      <div className="msg__body">
        <div className="msg__bubble">{message.content}</div>
        <span className="msg__meta">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}
