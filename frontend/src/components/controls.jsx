// Small form controls shared by Settings and Onboarding.

import Icon from './Icon';

/* Toggle switch with a label row. */
export function Switch({ label, sub, checked, onChange }) {
  return (
    <div
      className="switch-row"
      onClick={() => onChange(!checked)}
      role="presentation"
    >
      <span className="switch-row__label">
        {label}
        {sub && <span className="switch-row__sub">{sub}</span>}
      </span>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}

/* Two-to-three option segmented control. options: [{value, label}] */
export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="segmented__btn"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Wrap-friendly pill options. */
export function PillGroup({ options, value, onChange, ariaLabel }) {
  return (
    <div className="pills" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="pills__btn"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* − value + numeric stepper. */
export function Stepper({ value, display, onChange, min, max, step = 1 }) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__btn"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <span className="stepper__value">{display ?? value}</span>
      <button
        type="button"
        className="stepper__btn"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  );
}

/* Mon–Sun day-of-week picker. */
const DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'Tu' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'Th' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'Sa' },
  { key: 'sun', label: 'Su' },
];

export function DayPicker({ value = [], onChange }) {
  function toggle(day) {
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day]
    );
  }
  return (
    <div className="days" role="group" aria-label="Active days">
      {DAYS.map((d) => (
        <button
          key={d.key}
          type="button"
          className="days__btn"
          aria-pressed={value.includes(d.key)}
          onClick={() => toggle(d.key)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

/* Labeled time input. */
export function TimeField({ label, value, onChange }) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      <input
        type="time"
        className="input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/* Text field with label + error. */
export function TextField({
  label,
  error,
  hint,
  type = 'text',
  ...inputProps
}) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      <input
        type={type}
        className={`input${error ? ' input--error' : ''}`}
        {...inputProps}
      />
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error">
          <Icon name="alert-circle" size={13} />
          {error}
        </span>
      )}
    </label>
  );
}
