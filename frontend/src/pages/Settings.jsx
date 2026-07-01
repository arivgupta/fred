import { useEffect, useMemo, useState } from 'react';
import {
  createContact,
  createFamilyMember,
  createProvider,
  deleteContact,
  deleteFamilyMember,
  deleteProvider,
  fetchUser,
  listContacts,
  listFamilyMembers,
  listProviders,
  updatePreferences,
} from '../api';
import { setUser as cacheUser } from '../auth';
import { useAuthUser } from '../hooks';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import { SkeletonCard } from '../components/Skeleton';
import {
  DayPicker,
  PillGroup,
  Segmented,
  Stepper,
  Switch,
  TimeField,
} from '../components/controls';

/* ── Backend <-> form mapping ──────────────────────────────── */

function prefsFromBackend(u) {
  const blocked = Array.isArray(u.blocked_windows) ? u.blocked_windows[0] : null;
  const keepFree = Array.isArray(u.keep_free_windows) ? u.keep_free_windows[0] : null;

  return {
    communicationStyle: u.comm_style || 'brief',
    preferredContact: u.preferred_channel === 'call' ? 'call' : 'text',
    callUrgencyThreshold: u.call_urgency_threshold || 'high',

    quietHoursStart: blocked?.start_time || '22:00',
    quietHoursEnd: blocked?.end_time || '07:00',
    keepFreeStart: keepFree?.start_time || '',
    keepFreeEnd: keepFree?.end_time || '',
    activeDays: Array.isArray(u.active_days)
      ? u.active_days
      : ['mon', 'tue', 'wed', 'thu', 'fri'],

    morningDigest: !!u.morning_digest_enabled,
    digestTime: u.morning_digest_time || '07:00',
    digestContent: u.morning_digest_content || 'calendar',
    digestTravelTime: !!u.morning_digest_travel_time,

    escalationTimeoutMinutes: u.escalation_timeout_minutes ?? 30,
    autoApproveLowRisk: !!u.auto_approve_low_risk,
    maxReminders: u.max_reminders ?? 3,

    tone: u.tone || 'casual',
    reminderLeadTime: String(u.reminder_lead_time_minutes ?? 30),
    conflictHandling: u.conflict_handling || 'suggest',
  };
}

function prefsToBackend(p) {
  return {
    comm_style: p.communicationStyle,
    preferred_channel: p.preferredContact === 'text' ? 'sms' : 'call',
    call_urgency_threshold: p.callUrgencyThreshold,
    blocked_windows:
      p.quietHoursStart && p.quietHoursEnd
        ? [{ start_time: p.quietHoursStart, end_time: p.quietHoursEnd }]
        : null,
    keep_free_windows:
      p.keepFreeStart && p.keepFreeEnd
        ? [{ start_time: p.keepFreeStart, end_time: p.keepFreeEnd }]
        : null,
    active_days: p.activeDays,
    morning_digest_enabled: p.morningDigest,
    morning_digest_time: p.digestTime,
    morning_digest_content: p.digestContent,
    morning_digest_travel_time: p.digestTravelTime,
    escalation_timeout_minutes: p.escalationTimeoutMinutes,
    auto_approve_low_risk: p.autoApproveLowRisk,
    max_reminders: p.maxReminders,
    tone: p.tone,
    reminder_lead_time_minutes: parseInt(p.reminderLeadTime, 10) || 30,
    conflict_handling: p.conflictHandling,
  };
}

/* ── Section registry (drives the side nav) ────────────────── */

const SECTIONS = [
  { id: 'account', label: 'Your info' },
  { id: 'family', label: 'Family' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'providers', label: 'Providers' },
  { id: 'communication', label: 'Communication' },
  { id: 'timing', label: 'Timing' },
  { id: 'digest', label: 'Morning digest' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'behavior', label: 'Behavior' },
];

export default function Settings() {
  const authUser = useAuthUser();
  const toast = useToast();
  const userId = authUser?.id;

  const [user, setUserState] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [savedPrefs, setSavedPrefs] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const [newMember, setNewMember] = useState({ name: '', relation: '', phone_number: '' });
  const [newContact, setNewContact] = useState({ name: '', role: '', org: '', phone: '' });
  const [newProvider, setNewProvider] = useState({ name: '', specialty: '', practice: '' });

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    Promise.all([
      fetchUser(userId),
      listFamilyMembers(userId),
      listContacts(userId),
      listProviders(userId),
    ])
      .then(([u, fam, cts, prov]) => {
        if (cancelled) return;
        setUserState(u);
        const p = prefsFromBackend(u);
        setPrefs(p);
        setSavedPrefs(p);
        setFamilyMembers(fam || []);
        setContacts(cts || []);
        setProviders(prov || []);
        cacheUser(u);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not load your profile.');
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dirty = useMemo(
    () => !!prefs && !!savedPrefs && JSON.stringify(prefs) !== JSON.stringify(savedPrefs),
    [prefs, savedPrefs]
  );

  function setPref(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
  }

  /* People rows sync immediately — each row is its own backend record. */

  async function addMember() {
    if (!newMember.name.trim()) return;
    try {
      const created = await createFamilyMember(userId, {
        name: newMember.name.trim(),
        relation: newMember.relation.trim() || null,
        phone_number: newMember.phone_number.trim() || null,
      });
      setFamilyMembers((ms) => [...ms, created]);
      setNewMember({ name: '', relation: '', phone_number: '' });
      toast(`Added ${created.name} to your family.`, { type: 'success' });
    } catch (err) {
      toast(`Couldn’t add family member: ${err.message}`, { type: 'error' });
    }
  }

  async function removeMember(m) {
    try {
      await deleteFamilyMember(userId, m.id);
      setFamilyMembers((ms) => ms.filter((x) => x.id !== m.id));
      toast(`Removed ${m.name}.`, { type: 'info' });
    } catch (err) {
      toast(`Couldn’t remove family member: ${err.message}`, { type: 'error' });
    }
  }

  async function addContact() {
    if (!newContact.name.trim()) return;
    try {
      const created = await createContact(userId, {
        name: newContact.name.trim(),
        role: newContact.role.trim() || null,
        org: newContact.org.trim() || null,
        phone: newContact.phone.trim() || null,
      });
      setContacts((cs) => [...cs, created]);
      setNewContact({ name: '', role: '', org: '', phone: '' });
      toast(`Added ${created.name} to contacts.`, { type: 'success' });
    } catch (err) {
      toast(`Couldn’t add contact: ${err.message}`, { type: 'error' });
    }
  }

  async function removeContact(c) {
    try {
      await deleteContact(userId, c.id);
      setContacts((cs) => cs.filter((x) => x.id !== c.id));
      toast(`Removed ${c.name}.`, { type: 'info' });
    } catch (err) {
      toast(`Couldn’t remove contact: ${err.message}`, { type: 'error' });
    }
  }

  async function addProvider() {
    if (!newProvider.name.trim()) return;
    try {
      const created = await createProvider(userId, {
        name: newProvider.name.trim(),
        specialty: newProvider.specialty.trim() || null,
        practice: newProvider.practice.trim() || null,
      });
      setProviders((ps) => [...ps, created]);
      setNewProvider({ name: '', specialty: '', practice: '' });
      toast(`Added ${created.name} to providers.`, { type: 'success' });
    } catch (err) {
      toast(`Couldn’t add provider: ${err.message}`, { type: 'error' });
    }
  }

  async function removeProvider(p) {
    try {
      await deleteProvider(userId, p.id);
      setProviders((ps) => ps.filter((x) => x.id !== p.id));
      toast(`Removed ${p.name}.`, { type: 'info' });
    } catch (err) {
      toast(`Couldn’t remove provider: ${err.message}`, { type: 'error' });
    }
  }

  async function handleSave() {
    if (!prefs || saving) return;
    setSaving(true);
    try {
      await updatePreferences(userId, prefsToBackend(prefs));
      const fresh = await fetchUser(userId);
      setUserState(fresh);
      const p = prefsFromBackend(fresh);
      setPrefs(p);
      setSavedPrefs(p);
      cacheUser(fresh);
      toast('Preferences saved.', { type: 'success' });
    } catch (err) {
      toast(`Couldn’t save: ${err.message}`, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPrefs(savedPrefs);
  }

  if (loadError) {
    return (
      <div className="page">
        <div className="alert alert--error" role="alert">
          <Icon name="alert-circle" size={16} />
          <span>{loadError}</span>
        </div>
      </div>
    );
  }

  if (!user || !prefs) {
    return (
      <div className="page">
        <header className="page-head">
          <div className="page-head__titles">
            <h1 className="page-title">Settings</h1>
          </div>
        </header>
        <div style={{ display: 'grid', gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head__titles">
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Who G works for, and how it behaves.</p>
        </div>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="settings-nav__link">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="settings-body">
          {/* ── Your info ─────────────────────────────────── */}
          <section id="account" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="user" size={16} />
              Your info
            </h2>
            <div className="info-grid">
              <div className="info-cell">
                <p className="info-cell__label">Name</p>
                <p className="info-cell__value">{user.name || '—'}</p>
              </div>
              <div className="info-cell">
                <p className="info-cell__label">Phone</p>
                <p className="info-cell__value">{user.phone_number || '—'}</p>
              </div>
              <div className="info-cell">
                <p className="info-cell__label">Email</p>
                <p className="info-cell__value">{user.email || '—'}</p>
              </div>
            </div>
          </section>

          {/* ── Family ────────────────────────────────────── */}
          <section id="family" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="users" size={16} />
              Family members
            </h2>
            <p className="card__desc">
              G coordinates reminders and appointments across your household.
            </p>
            {familyMembers.length > 0 && (
              <ul className="people-list">
                {familyMembers.map((m) => (
                  <li key={m.id} className="person-row">
                    <span className="person-row__meta">
                      <span className="person-row__name">{m.name}</span>
                      <span className="person-row__sub">
                        {[m.relation, m.phone_number].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                    <button
                      className="person-row__remove"
                      onClick={() => removeMember(m)}
                      aria-label={`Remove ${m.name}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="add-row">
              <input
                className="input"
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addMember()}
              />
              <input
                className="input"
                placeholder="Relation"
                value={newMember.relation}
                onChange={(e) => setNewMember((m) => ({ ...m, relation: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addMember()}
              />
              <input
                type="tel"
                className="input"
                placeholder="Phone (optional)"
                value={newMember.phone_number}
                onChange={(e) =>
                  setNewMember((m) => ({ ...m, phone_number: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && addMember()}
              />
              <button className="btn btn--secondary" onClick={addMember}>
                <Icon name="plus" size={14} />
                Add
              </button>
            </div>
          </section>

          {/* ── Contacts ──────────────────────────────────── */}
          <section id="contacts" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="phone" size={16} />
              Contacts
            </h2>
            <p className="card__desc">
              People and offices G may call on your behalf — schools, doctors,
              service providers.
            </p>
            {contacts.length > 0 && (
              <ul className="people-list">
                {contacts.map((c) => (
                  <li key={c.id} className="person-row">
                    <span className="person-row__meta">
                      <span className="person-row__name">{c.name}</span>
                      <span className="person-row__sub">
                        {[
                          c.role && c.org ? `${c.role} at ${c.org}` : c.role || c.org,
                          c.phone,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </span>
                    </span>
                    <button
                      className="person-row__remove"
                      onClick={() => removeContact(c)}
                      aria-label={`Remove ${c.name}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="add-row">
              <input
                className="input"
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Role (e.g. Office manager)"
                value={newContact.role}
                onChange={(e) => setNewContact((c) => ({ ...c, role: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Organization"
                value={newContact.org}
                onChange={(e) => setNewContact((c) => ({ ...c, org: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
              />
              <button className="btn btn--secondary" onClick={addContact}>
                <Icon name="plus" size={14} />
                Add
              </button>
            </div>
          </section>

          {/* ── Providers ─────────────────────────────────── */}
          <section id="providers" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="heart" size={16} />
              Preferred providers
            </h2>
            <p className="card__desc">
              G books with these first — your dentist, pediatrician, plumber.
            </p>
            {providers.length > 0 && (
              <ul className="people-list">
                {providers.map((p) => (
                  <li key={p.id} className="person-row">
                    <span className="person-row__meta">
                      <span className="person-row__name">{p.name}</span>
                      <span className="person-row__sub">
                        {[p.specialty, p.practice].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                    <button
                      className="person-row__remove"
                      onClick={() => removeProvider(p)}
                      aria-label={`Remove ${p.name}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="add-row">
              <input
                className="input"
                placeholder="Name"
                value={newProvider.name}
                onChange={(e) => setNewProvider((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Specialty"
                value={newProvider.specialty}
                onChange={(e) =>
                  setNewProvider((p) => ({ ...p, specialty: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Practice (optional)"
                value={newProvider.practice}
                onChange={(e) =>
                  setNewProvider((p) => ({ ...p, practice: e.target.value }))
                }
              />
              <button className="btn btn--secondary" onClick={addProvider}>
                <Icon name="plus" size={14} />
                Add
              </button>
            </div>
          </section>

          {/* ── Communication ─────────────────────────────── */}
          <section id="communication" className="card card--pad settings-card">
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
              <span className="pref-row__label">Preferred contact method</span>
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
            <div className="pref-row pref-row--stack">
              <span className="pref-row__label">
                Call instead of text when urgency is
              </span>
              <PillGroup
                ariaLabel="Call urgency threshold"
                value={prefs.callUrgencyThreshold}
                onChange={(v) => setPref('callUrgencyThreshold', v)}
                options={[
                  { value: 'any', label: 'Any urgency' },
                  { value: 'high', label: 'High only' },
                  { value: 'never', label: 'Never call' },
                ]}
              />
            </div>
          </section>

          {/* ── Timing ────────────────────────────────────── */}
          <section id="timing" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="clock" size={16} />
              Timing
            </h2>
            <div className="pref-row pref-row--stack">
              <span className="pref-row__label">
                Quiet hours
                <span className="pref-row__sub">
                  G won’t contact you during this window.
                </span>
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
                <span className="pref-row__sub">
                  G won’t schedule tasks during this time.
                </span>
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
              <span className="pref-row__label">Days G is active</span>
              <DayPicker
                value={prefs.activeDays}
                onChange={(v) => setPref('activeDays', v)}
              />
            </div>
          </section>

          {/* ── Morning digest ────────────────────────────── */}
          <section id="digest" className="card card--pad settings-card">
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
                    options={[
                      { value: 'calendar', label: 'Calendar only' },
                      { value: 'calendar+email', label: '+ Unread emails' },
                      { value: 'calendar+tasks', label: '+ Pending tasks' },
                    ]}
                  />
                </div>
                <Switch
                  label="Include travel-time estimates between events"
                  checked={prefs.digestTravelTime}
                  onChange={(v) => setPref('digestTravelTime', v)}
                />
              </>
            )}
          </section>

          {/* ── Approvals ─────────────────────────────────── */}
          <section id="approvals" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="shield" size={16} />
              Approvals
            </h2>
            <div className="pref-row">
              <span className="pref-row__label">
                Approval timeout
                <span className="pref-row__sub">
                  How long G waits for your OK before pausing.
                </span>
              </span>
              <Stepper
                value={prefs.escalationTimeoutMinutes}
                display={`${prefs.escalationTimeoutMinutes} min`}
                min={5}
                max={120}
                step={5}
                onChange={(v) => setPref('escalationTimeoutMinutes', v)}
              />
            </div>
            <Switch
              label="Auto-approve low-risk actions"
              sub="Adding calendar events, for example. Deletions always ask first."
              checked={prefs.autoApproveLowRisk}
              onChange={(v) => setPref('autoApproveLowRisk', v)}
            />
            <div className="pref-row">
              <span className="pref-row__label">
                Reminders before giving up on a response
              </span>
              <Stepper
                value={prefs.maxReminders}
                min={1}
                max={10}
                onChange={(v) => setPref('maxReminders', v)}
              />
            </div>
          </section>

          {/* ── Behavior ──────────────────────────────────── */}
          <section id="behavior" className="card card--pad settings-card">
            <h2 className="card__title">
              <Icon name="sparkles" size={16} />
              G’s behavior
            </h2>
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
            <div className="pref-row pref-row--stack">
              <span className="pref-row__label">Send reminders ahead by</span>
              <PillGroup
                ariaLabel="Reminder lead time"
                value={prefs.reminderLeadTime}
                onChange={(v) => setPref('reminderLeadTime', v)}
                options={[
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '60', label: '1 hour' },
                  { value: '1440', label: 'Day before' },
                ]}
              />
            </div>
            <div className="pref-row pref-row--stack">
              <span className="pref-row__label">
                When G spots a scheduling conflict
              </span>
              <Segmented
                ariaLabel="Conflict handling"
                value={prefs.conflictHandling}
                onChange={(v) => setPref('conflictHandling', v)}
                options={[
                  { value: 'suggest', label: 'Suggest reschedule' },
                  { value: 'flag', label: 'Just flag it' },
                ]}
              />
            </div>
          </section>
        </div>
      </div>

      {dirty && (
        <div className="savebar" role="status">
          <span className="savebar__msg">
            <span className="status-dot" />
            Unsaved changes
          </span>
          <span className="savebar__actions">
            <button className="btn btn--ghost btn--sm" onClick={handleReset} disabled={saving}>
              Reset
            </button>
            <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
