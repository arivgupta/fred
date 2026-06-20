import FredOrb from './FredOrb';

const SUGGESTIONS = [
  'Remind me to pick up Emma from soccer at 4pm',
  'Reschedule my dentist to next week and text me to confirm',
  "What's on my calendar tomorrow?",
  'Find a pediatric dentist open Saturday near me',
  'Call the pizza place and order a large pepperoni',
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
