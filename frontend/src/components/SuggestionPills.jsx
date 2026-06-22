import FredOrb from './FredOrb';

const SUGGESTIONS = [
  'Remind me to pick up Emma from soccer at 4pm',
  'Every morning, prep my inbox and text me what needs me',
  'Watch United for cheap award flights LA to Tokyo with miles',
  "What's on my calendar tomorrow?",
  'Audit my subscriptions and tell me what to cancel',
  'Call the pharmacy and refill my prescription',
];

export default function SuggestionPills({ onSelect }) {
  return (
    <div className="suggestion-pills">
      <div className="suggestion-pills-intro">
        <FredOrb size={76} state="idle" />
        <p>Hi, I’m FRED. What can I take off your plate?</p>
        <span>Tap a suggestion or just tell me what you need</span>
      </div>
      <div className="suggestion-pills-list">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion-pill" onClick={() => onSelect(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
