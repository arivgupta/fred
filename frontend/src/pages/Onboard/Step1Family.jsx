import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFamilyMember, fetchUser, updateProfile } from '../../api';
import { getUser, setUser } from '../../auth';
import Icon from '../../components/Icon';
import OnboardLayout from '../../components/OnboardLayout';
import { TextField } from '../../components/controls';

const RELATIONS = ['Child', 'Spouse', 'Parent', 'Sibling', 'Other'];

export default function Step1Family() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [members, setMembers] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const u = getUser();
    if (u?.name) setName(u.name);
    if (u?.phone_number) setPhone(u.phone_number);
  }, []);

  function addMember() {
    setMembers((ms) => [
      ...ms,
      { id: Date.now(), name: '', relation: '', phone_number: '' },
    ]);
  }

  function updateMember(id, patch) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removeMember(id) {
    setMembers((ms) => ms.filter((m) => m.id !== id));
  }

  async function handleContinue() {
    if (submitting) return;
    const errs = {};
    if (!name.trim()) errs.name = 'Your name is required';
    if (!phone.trim()) errs.phone = 'A phone number is required — it’s how G texts you';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);
    try {
      const user = getUser();
      if (!user?.id) throw new Error('Session expired — please sign in again.');

      // 1. Profile patch (name + first-time phone). Backend ignores no-ops.
      const patch = {};
      if (name.trim() !== user.name) patch.name = name.trim();
      if (phone.trim() && phone.trim() !== user.phone_number) {
        patch.phone_number = phone.trim();
      }
      if (Object.keys(patch).length > 0) {
        await updateProfile(user.id, patch);
      }

      // 2. Create each named family member. Sequential on purpose — if one
      //    row 422s, everything before it is already persisted.
      const valid = members.filter((m) => m.name.trim());
      for (const m of valid) {
        await createFamilyMember(user.id, {
          name: m.name.trim(),
          relation: m.relation.trim() || null,
          phone_number: m.phone_number.trim() || null,
        });
      }

      // 3. Refresh the canonical user snapshot for later screens.
      const refreshed = await fetchUser(user.id);
      setUser(refreshed);

      navigate('/onboard/step2');
    } catch (err) {
      setSubmitError(err.message || 'Could not save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardLayout
      step={1}
      title="Tell G about your household"
      sub="G uses your number to text and call you, and knows your family by name so “pick up Emma” just works."
    >
      <div className="onboard__cards">
        <section className="card card--pad">
          <h2 className="card__title">
            <Icon name="user" size={16} />
            About you
          </h2>
          <div className="onboard__cards" style={{ gap: 14 }}>
            <TextField
              label="Your name"
              placeholder="Full name"
              value={name}
              error={errors.name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: '' }));
              }}
            />
            <TextField
              label="Mobile number"
              type="tel"
              placeholder="+1 555 000 0000"
              hint="G texts reminders and updates to this number."
              value={phone}
              error={errors.phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((p) => ({ ...p, phone: '' }));
              }}
            />
          </div>
        </section>

        <section className="card card--pad">
          <h2 className="card__title">
            <Icon name="users" size={16} />
            Family members
          </h2>
          <p className="card__desc">
            Optional, but it lets G coordinate pickups, appointments, and
            reminders for everyone.
          </p>
          {members.map((m) => (
            <div key={m.id} className="member-editor">
              <input
                className="input"
                placeholder="Name"
                value={m.name}
                onChange={(e) => updateMember(m.id, { name: e.target.value })}
              />
              <select
                className="select"
                value={m.relation}
                onChange={(e) => updateMember(m.id, { relation: e.target.value })}
              >
                <option value="">Relation</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="tel"
                className="input"
                placeholder="Phone (optional)"
                value={m.phone_number}
                onChange={(e) =>
                  updateMember(m.id, { phone_number: e.target.value })
                }
              />
              <button
                className="person-row__remove"
                onClick={() => removeMember(m.id)}
                aria-label="Remove family member"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
          <button className="add-dashed" onClick={addMember}>
            <Icon name="plus" size={14} />
            Add family member
          </button>
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
          onClick={handleContinue}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Continue'}
          {!submitting && <Icon name="arrow-right" size={15} />}
        </button>
      </div>
    </OnboardLayout>
  );
}
