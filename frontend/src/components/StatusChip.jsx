import Icon from './Icon';
import { STATUS_META } from '../lib/tasks';

export default function StatusChip({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: 'neutral' };
  return (
    <span className={`chip chip--${meta.tone}`}>
      {meta.icon && <Icon name={meta.icon} size={11} strokeWidth={2.4} />}
      {meta.label}
    </span>
  );
}
