import Icon from './Icon';
import Logo from './Logo';

const STEPS = ['Your household', 'Preferences'];

export default function OnboardLayout({ step, title, sub, children }) {
  return (
    <div className="onboard">
      <div className="onboard__brand">
        <Logo size={30} />
        <span className="onboard__brand-name">G</span>
      </div>

      <div className="onboard__panel">
        <div className="steps" aria-label={`Step ${step} of ${STEPS.length}`}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state =
              n < step ? 'done' : n === step ? 'active' : 'upcoming';
            return (
              <span
                key={label}
                style={{ display: 'contents' }}
              >
                {i > 0 && <span className="steps__line" />}
                <span
                  className={`steps__item${
                    state === 'active'
                      ? ' steps__item--active'
                      : state === 'done'
                        ? ' steps__item--done'
                        : ''
                  }`}
                >
                  <span className="steps__num">
                    {state === 'done' ? (
                      <Icon name="check" size={12} strokeWidth={2.6} />
                    ) : (
                      n
                    )}
                  </span>
                  {label}
                </span>
              </span>
            );
          })}
        </div>

        <h1 className="onboard__title">{title}</h1>
        <p className="onboard__sub">{sub}</p>

        {children}
      </div>
    </div>
  );
}
