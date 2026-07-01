// Task presentation logic — status metadata, plan-step humanization and
// the normalization from backend TaskResponse rows into what cards render.

import { formatDateTime, titleCase } from './format';

/* ── Status metadata ───────────────────────────────────────── */

// `tone` maps to chip--/color classes; `icon` to the Icon set.
export const STATUS_META = {
  PENDING: { label: 'Scheduled', tone: 'warn', icon: 'clock' },
  IN_PROGRESS: { label: 'In progress', tone: 'info', icon: 'refresh' },
  ESCALATION_PENDING: { label: 'Needs approval', tone: 'attention', icon: 'shield' },
  COMPLETED: { label: 'Done', tone: 'success', icon: 'check' },
  FAILED: { label: 'Failed', tone: 'danger', icon: 'alert-circle' },
  MISSED: { label: 'Missed', tone: 'danger', icon: 'alert-triangle' },
};

export const TYPE_LABELS = {
  reminder: 'Reminder',
  calendar_update: 'Calendar',
  information_request: 'Request',
  morning_digest: 'Digest',
  smalltalk: 'Chat',
};

/* ── Plan-step humanization ────────────────────────────────── */

const TOOL_META = {
  sms_tool: { label: 'Text you', icon: 'chat' },
  call_tool: { label: 'Call you', icon: 'phone' },
  business_call_tool: { label: 'Call a business', icon: 'phone-out' },
  calendar_tool: { label: 'Update calendar', icon: 'calendar' },
  calendar_delete_tool: { label: 'Remove calendar event', icon: 'calendar' },
  gmail_tool: { label: 'Check Gmail', icon: 'mail' },
  script_tool: { label: 'Run script', icon: 'zap' },
};

export function toolMeta(tool) {
  return TOOL_META[tool] || { label: titleCase(tool || 'step'), icon: 'zap' };
}

// One-line human description of what a plan step will do / said.
export function stepDetail(step) {
  const params = step?.params || {};
  const bits = [];
  const body = params.body || params.message || params.goal || '';
  if (body) bits.push(`“${String(body).slice(0, 140)}”`);
  if (params.business_name) bits.push(`to ${params.business_name}`);
  else if (params.to) bits.push(`to ${params.to}`);
  if (params.summary || params.title) bits.push(params.summary || params.title);
  if (params.scheduled_at) {
    const t = Date.parse(params.scheduled_at);
    if (!Number.isNaN(t)) bits.push(`at ${formatDateTime(t)}`);
  }
  return bits.join(' · ');
}

/* ── Row normalization ─────────────────────────────────────── */

// A PENDING task whose scheduled_at is further than this in the past is
// shown as MISSED — the worker never fired it. Display-only; the DB row
// stays PENDING in case the worker catches up.
const PAST_DUE_GRACE_MS = 5 * 60 * 1000;

function firstScheduledAt(planSteps) {
  if (!Array.isArray(planSteps)) return null;
  for (const s of planSteps) {
    const at = s?.params?.scheduled_at;
    if (at) {
      const t = Date.parse(at);
      if (!Number.isNaN(t)) return t;
    }
  }
  return null;
}

// Escalation context for ESCALATION_PENDING rows: which step is waiting.
function escalationDetail(planSteps) {
  if (!Array.isArray(planSteps)) return null;
  const pending = planSteps.find((s) => s?.status === 'ESCALATION_PENDING');
  return pending || null;
}

export function normalizeTask(row) {
  const planSteps = Array.isArray(row.plan_steps) ? row.plan_steps : [];
  const scheduledAt = firstScheduledAt(planSteps);

  let status = row.status;
  let missed = false;
  if (
    status === 'PENDING' &&
    scheduledAt &&
    Date.now() - scheduledAt > PAST_DUE_GRACE_MS
  ) {
    status = 'MISSED';
    missed = true;
  }

  const pendingStep = escalationDetail(planSteps);

  let note = null;
  if (missed) {
    note = {
      tone: 'fail',
      text: 'The scheduled time passed before this could fire — the worker may have been offline. Ask G again to reschedule.',
    };
  } else if (row.status === 'FAILED') {
    note = { tone: 'fail', text: "G couldn't complete this one." };
  } else if (row.status === 'COMPLETED') {
    const body = planSteps[0]?.params?.body || planSteps[0]?.params?.message;
    note = { tone: 'success', text: body ? `Sent: “${body}”` : 'Completed.' };
  }

  return {
    id: row.id,
    description: row.description,
    type: row.type,
    typeLabel: TYPE_LABELS[row.type] || titleCase(row.type),
    rawStatus: row.status,
    status,
    planSteps,
    scheduledAt,
    escalationDeadline: row.escalation_deadline
      ? Date.parse(row.escalation_deadline)
      : null,
    pendingStep,
    note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── Derived collections ───────────────────────────────────── */

export const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'approval', label: 'Needs approval' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'issues', label: 'Issues' },
];

export function matchesFilter(task, filter) {
  switch (filter) {
    case 'approval':
      return task.status === 'ESCALATION_PENDING';
    case 'active':
      return task.status === 'PENDING' || task.status === 'IN_PROGRESS';
    case 'done':
      return task.status === 'COMPLETED';
    case 'issues':
      return task.status === 'FAILED' || task.status === 'MISSED';
    default:
      return true;
  }
}

// Upcoming scheduled steps (for Home "Up next").
export function upcomingSchedule(tasks, limit = 5) {
  const now = Date.now();
  return tasks
    .filter(
      (t) =>
        (t.status === 'PENDING' || t.status === 'IN_PROGRESS') &&
        t.scheduledAt &&
        t.scheduledAt > now
    )
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, limit);
}
