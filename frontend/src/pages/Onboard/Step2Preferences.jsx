import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUser, updatePreferences } from '../../api';
import { getUser, setUser } from '../../auth';
import Icon from '../../components/Icon';
import OnboardLayout from '../../components/OnboardLayout';
import {
  PillGroup,
  Segmented,
  Switch,
  TimeField,
} from '../../components/controls';
import { useToast } from '../../context/ToastContext';

const DIGEST_OPTS = [
  { value: 'calendar', label: 'Calendar only' },
  { value: 'calendar+email', label: '+ Emails' },
  { value: 'calendar+tasks', label: '+ Tasks' },
];

const REMINDER_OPTS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '1440', label: '1 day' },
];

const ESCALATION_OPTS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
];

const DEFAULT_PREFS = {
  communicationStyle: 'brief',
  preferredContact: 'text',
  tone: 'casual',
  morningDigest: false,
  digestTime: '07:00',
  digestContent: 'calendar',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  keepFreeStart: '',
  keepFreeEnd: '',
  reminderLeadTime: '30',
  autoApproveLowRisk: false,
  escalationTimeoutMinutes: 30,
};

// Map UI state → backend UserPreferencesUpdate (snake_case, enum values).
function toBackendPrefs(p) {
  const payload = {
    comm_style: p.communicationStyle,
    preferred_channel: p.preferredContact === 'text' ? 'sms' : 'call',
    tone: p.tone,
    morning_digest_enabled: p.morningDigest,
    morning_digest_time: p.digestTime,
    morning_digest_content: p.digestContent,
    auto_approve_low_risk: p.autoApproveLowRisk,
    escalation_timeout_minutes: p.escalationTimeoutMinutes,
  };
  if (p.quietHoursStart && p.quietHoursEnd) {
    payload.blocked_windows = [
      { start_time: p.quietHoursStart, end_time: p.quietHoursEnd },
    ];
  }
  if (p.keepFreeStart && p.keepFreeEnd) {
    payload.keep_free_windows = [
      { start_time: p.keepFreeStart, end_time: p.keepFreeEnd },
    ];
  }
  const lead = parseInt(p.reminderLeadTime, 10);
  if (Number.isFinite(lead)) payload.reminder_lead_time_minutes = lead;
  return payload;
}

export default function Step2Preferences() {
  const navigate = useNavigate();
  const toast = useToast();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function setPref(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
  }

  async function handleActivate() {
    if (submitting) return;
    setSubmitError('');
    const user = getUser();
    if (!user?.id) {
      setSubmitError('Session expired — please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePreferences(user.id, toBackendPrefs(prefs));
      const refreshed = await fetchUser(user.id);
      setUser(refreshed);
      toast('G is set up and ready. Welcome!', { type: 'success' });
      navigate('/');
    } catch (err) {
      setSubmitError(err.message || 'Could not save preferences. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardLayout
      step={2}
      title="How should G work for you?"
      sub="Sensible defaults are pre-selected — everything can be changed later in Settings."
    >
      <div className="onboard__cards">
        <section className="card card--pad">
          <h2 className="card__title">
            <Icon name="chat" size={16} />
            Communication
          </h2>
          <div className="pref-row">
            <span className="pref-row__label">Message style</span>
            <Segmented
              ariaLabel="Message style"
              value={prefs.communicationStyle}
              onChange={(v) => setPref('communicationStyle', v)}
              options={[
                { value: 'brief', label: 'Brief' },
                { value: 'detailed', label: 'Detailed' },
              ]}
            />
          </div>
          <div className="pref-row">
            <span className="pref-row__label">Reach you by</span>
            <Segmented
              ariaLabel="Preferred contact method"
              value={prefs.preferredContact}
              onChange={(v) => setPref('preferredContact', v)}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'call', label: 'Call' },
              ]}
            />
          </div>
          <div className="pref-row">
            <span className="pref-row__label">Tone</span>
            <Segmented
              ariaLabel="Tone"
              value={prefs.tone}
              onChange={(v) => setPref('tone', v)}
              options={[
                { value: 'casual', label: 'Casual' },
                { value: 'formal', label: 'Formal' },
              ]}
            />
          </div>
        </section>

        <section className="card card--pad">
          <h2 className="card__title">
            <Icon name="sun" size={16} />
            Morning digest
          </h2>
          <Switch
            label="Send a morning digest"
            sub="A short brief on your day, delivered by text."
            checked={prefs.morningDigest}
            onChange={(v) => setPref('morningDigest', v)}
          />
          {prefs.morningDigest && (
            <>
              <div className="pref-row">
                <span className="pref-row__label">Deliver at</span>
                <TimeField
                  value={prefs.digestTime}
                  onChange={(v) => setPref('digestTime', v)}
                />
              </div>
              <div className="pref-row pref-row--stack">
                <span className="pref-row__label">Include</span>
                <PillGroup
                  ariaLabel="Digest contents"
                  value={prefs.digestContent}
                  onChange={(v) => setPref('digestContent', v)}
                  options={DIGEST_OPTS}
                />
              </div>
            </>
          )}
        </section>

        <section className="card card--pad">
          <h2 className="card__title">
            <Icon name="clock" size={16} />
            Timing
          </h2>
          <div className="pref-row pref-row--stack">
            <span className="pref-row__label">
              Quiet hours
              <span className="pref-row__sub">G won’t contact you in this window.</span>
            </span>
            <div className="time-range">
              <TimeField
                label="From"
                value={prefs.quietHoursStart}
                onChange={(v) => setPref('quietHoursStart', v)}
              />
              <TimeField
                label="To"
                value={prefs.quietHoursEnd}
                onChange={(v) => setPref('quietHoursEnd', v)}
              />
            </div>
          </div>
          <div className="pref-row pref-row--stack">
            <span className="pref-row__label">
              Keep-free window
              <span className="pref-row__sub">G won’t schedule anything here.</span>
            </span>
            <div className="time-range">
              <TimeField
                label="From"
                value={prefs.keepFreeStart}
                onChange={(v) => setPref('keepFreeStart', v)}
              />
              <TimeField
                label="To"
                value={prefs.keepFreeEnd}
                onChange={(v) => setPref('keepFreeEnd', v)}
              />
            </div>
          </div>
          <div className="pref-row pref-row--stack">
            <span className="pref-row__label">Remind you ahead by</span>
            <PillGroup
              ariaLabel="Reminder lead time"
              value={prefs.reminderLeadTime}
              onChange={(v) => setPref('reminderLeadTime', v)}
              options={REMINDER_OPTS}
            />
          </div>
        </section>

        <section className="card card--pad">
          <h2 className="card__title">
            <Icon name="shield" size={16} />
            Approvals
          </h2>
          <Switch
            label="Auto-approve low-risk actions"
            sub="Adding calendar events, for example. Deletions always ask first."
            checked={prefs.autoApproveLowRisk}
            onChange={(v) => setPref('autoApproveLowRisk', v)}
          />
          <div className="pref-row pref-row--stack">
            <span className="pref-row__label">
              Approval timeout
              <span className="pref-row__sub">
                How long G waits for your OK before pausing a task.
              </span>
            </span>
            <PillGroup
              ariaLabel="Escalation timeout"
              value={prefs.escalationTimeoutMinutes}
              onChange={(v) => setPref('escalationTimeoutMinutes', v)}
              options={ESCALATION_OPTS}
            />
          </div>
        </section>
      </div>

      <div className="onboard__footer">
        {submitError && (
          <span className="field__error">
            <Icon name="alert-circle" size={13} />
            {submitError}
          </span>
        )}
        <button
          className="btn btn--primary btn--lg"
          onClick={handleActivate}
          disabled={submitting}
        >
          {submitting ? 'Activating…' : 'Activate G'}
          {!submitting && <Icon name="sparkles" size={15} />}
        </button>
      </div>
    </OnboardLayout>
  );
}
