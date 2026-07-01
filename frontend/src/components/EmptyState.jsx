import Icon from './Icon';

export default function EmptyState({ icon = 'sparkles', title, body, cta }) {
  return (
    <div className="empty">
      <div className="empty__orb">
        <Icon name={icon} size={24} strokeWidth={1.7} />
      </div>
      <p className="empty__title">{title}</p>
      {body && <p className="empty__body">{body}</p>}
      {cta && <div className="empty__cta">{cta}</div>}
    </div>
  );
}
