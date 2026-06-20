import FredOrb from './FredOrb';

export default function TypingIndicator() {
  return (
    <div className="chat-msg-row">
      <FredOrb size={32} state="thinking" className="chat-avatar" glyph={false} />
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
