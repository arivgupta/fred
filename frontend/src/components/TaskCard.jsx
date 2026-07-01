import { useState } from 'react';
import Icon from './Icon';
import StatusChip from './StatusChip';
import { useNow } from '../hooks';
import { useTasks } from '../context/TasksContext';
import { useToast } from '../context/ToastContext';
import { countdown, formatDateTime } from '../lib/format';
import { STATUS_META, stepDetail, toolMeta } from '../lib/tasks';

const STATUS_ORB = {
  PENDING: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  IN_PROGRESS: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  ESCALATION_PENDING: { bg: 'var(--attention-soft)', fg: 'var(--attention)' },
  COMPLETED: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  FAILED: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  MISSED: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
};

function PlanSteps({ steps }) {
  if (!steps.length) return null;
  return (
    <div className="plan">
      <p className="plan__label">Plan</p>
      {steps.map((step, i) => {
        const meta = toolMeta(step.tool);
        const detail = stepDetail(step);
        return (
          <div key={i} className="plan__step">
            <span className="plan__step-icon">
              <Icon name={meta.icon} size={13} />
            </span>
            <div className="plan__step-body">
              <div className="plan__step-title">
                {meta.label}
                {step.status && step.status !== 'PENDING' && (
                  <StatusChip status={step.status} />
                )}
              </div>
              {detail && <p className="plan__step-detail">{detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Standard task card — tap to expand the plan. */
export default function TaskCard({ task }) {
  const [open, setOpen] = useState(false);
  const hasDetail = task.planSteps.length > 0 || task.note;
  const orb = STATUS_ORB[task.status] || STATUS_ORB.PENDING;
  const icon = STATUS_META[task.status]?.icon || 'clock';

  return (
    <article className="task-card">
      <button
        className="task-card__main"
        onClick={() => hasDetail && setOpen((v) => !v)}
        aria-expanded={open}
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <span
          className="task-card__status-orb"
          style={{ background: orb.bg, color: orb.fg }}
        >
          <Icon name={icon} size={16} />
        </span>
        <span className="task-card__body">
          <span className="task-card__desc">{task.description}</span>
          <span className="task-card__meta">
            <StatusChip status={task.status} />
            <span className="chip chip--neutral">{task.typeLabel}</span>
            <span className="task-card__time">
              {task.scheduledAt && task.status === 'PENDING'
                ? `Fires ${formatDateTime(task.scheduledAt)}`
                : `Created ${formatDateTime(task.createdAt)}`}
            </span>
          </span>
        </span>
        {hasDetail && (
          <span
            className={`task-card__chevron${open ? ' task-card__chevron--open' : ''}`}
          >
            <Icon name="chevron-down" size={16} />
          </span>
        )}
      </button>

      {open && hasDetail && (
        <div className="task-card__detail">
          {task.note && (
            <p className={`task-card__note task-card__note--${task.note.tone}`}>
              <Icon
                name={task.note.tone === 'success' ? 'check-circle' : 'alert-circle'}
                size={14}
              />
              {task.note.text}
            </p>
          )}
          <PlanSteps steps={task.planSteps} />
        </div>
      )}
    </article>
  );
}

/* Spotlight card for tasks blocked on the parent's approval. */
export function ApprovalCard({ task }) {
  const { approve, deny } = useTasks();
  const toast = useToast();
  const now = useNow(1000);
  const [busy, setBusy] = useState('');

  const remaining = task.escalationDeadline
    ? countdown(task.escalationDeadline, now)
    : null;

  const pendingMeta = task.pendingStep ? toolMeta(task.pendingStep.tool) : null;
  const pendingDetail = task.pendingStep ? stepDetail(task.pendingStep) : '';

  async function act(kind) {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === 'approve') {
        await approve(task.id);
        toast('Approved — G is on it.', { type: 'success' });
      } else {
        await deny(task.id);
        toast('Denied. G won’t proceed.', { type: 'info' });
      }
    } catch (err) {
      toast(err.message || 'That didn’t go through — try again.', {
        type: 'error',
      });
    } finally {
      setBusy('');
    }
  }

  return (
    <article className="approval-card">
      <div className="approval-card__head">
        <span className="approval-card__icon">
          <Icon name="shield" size={17} />
        </span>
        <div>
          <p className="approval-card__title">{task.description}</p>
          <p className="approval-card__question">
            {pendingMeta
              ? `G wants to ${pendingMeta.label.toLowerCase()}${pendingDetail ? ` — ${pendingDetail}` : ''}. OK to proceed?`
              : 'G needs your go-ahead before continuing.'}
          </p>
        </div>
      </div>
      <div className="approval-card__foot">
        <span className="approval-card__timer">
          <Icon name="clock" size={13} />
          {remaining
            ? `Expires in ${remaining}`
            : task.escalationDeadline
              ? 'Expired — approve to retry'
              : 'Waiting on you'}
        </span>
        <div className="approval-card__actions">
          <button
            className="btn btn--success"
            onClick={() => act('approve')}
            disabled={!!busy}
          >
            <Icon name="check" size={14} strokeWidth={2.4} />
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button
            className="btn btn--danger"
            onClick={() => act('deny')}
            disabled={!!busy}
          >
            <Icon name="x" size={14} strokeWidth={2.4} />
            {busy === 'deny' ? 'Denying…' : 'Deny'}
          </button>
        </div>
      </div>
    </article>
  );
}
