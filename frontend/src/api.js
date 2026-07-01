// Single API layer — every backend call goes through here.
//
// Local dev:  VITE_API_BASE_URL is empty -> requests hit /api/* and the
//             Vite dev server proxies them to the backend (vite.config.js).
// Production: VITE_API_BASE_URL points at the deployed backend.

import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return res.json();
}

/* ── Auth ──────────────────────────────────────────────────── */

export function register(name, email, password) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/* ── Chat ──────────────────────────────────────────────────── */

// POST /api/chat runs the full agent path server-side (Claude → tools →
// DB → reply) and persists both sides of the exchange with channel="chat".
// The reply may carry a legacy `<task>…</task>` XML block — strip it and
// normalize the response shape for the UI.
export async function sendChatMessage(userId, message, history = []) {
  const data = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, user_id: userId, messages: history }),
  });
  const raw = data.reply || '';
  const cleanReply = raw.replace(/<task>[\s\S]*?<\/task>/, '').trim() || raw;
  return {
    reply: cleanReply,
    tasks_created: data.task_id ? [data.task_id] : [],
    escalated: !!data.escalated,
  };
}

/* ── User profile & preferences ────────────────────────────── */

export function fetchUser(userId) {
  return apiFetch(`/api/users/${userId}`);
}

// PATCH name/email/phone_number. phone_number is settable only while the
// user's current phone is null (first-time onboarding).
export function updateProfile(userId, patch) {
  return apiFetch(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// PATCH preferences using the backend's snake_case keys — see
// UserPreferencesUpdate in backend/schemas/user.py.
export function updatePreferences(userId, patch) {
  return apiFetch(`/api/users/${userId}/preferences`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/* ── Family members ────────────────────────────────────────── */

export function listFamilyMembers(userId) {
  return apiFetch(`/api/users/${userId}/family-members`);
}

export function createFamilyMember(userId, member) {
  return apiFetch(`/api/users/${userId}/family-members`, {
    method: 'POST',
    body: JSON.stringify(member),
  });
}

export function deleteFamilyMember(userId, memberId) {
  return apiFetch(`/api/users/${userId}/family-members/${memberId}`, {
    method: 'DELETE',
  });
}

/* ── Contacts (third parties G can call/text) ──────────────── */

export function listContacts(userId) {
  return apiFetch(`/api/users/${userId}/contacts`);
}

export function createContact(userId, contact) {
  return apiFetch(`/api/users/${userId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(contact),
  });
}

export function deleteContact(userId, contactId) {
  return apiFetch(`/api/users/${userId}/contacts/${contactId}`, {
    method: 'DELETE',
  });
}

/* ── Preferred providers ───────────────────────────────────── */

export function listProviders(userId) {
  return apiFetch(`/api/users/${userId}/providers`);
}

export function createProvider(userId, provider) {
  return apiFetch(`/api/users/${userId}/providers`, {
    method: 'POST',
    body: JSON.stringify(provider),
  });
}

export function deleteProvider(userId, providerId) {
  return apiFetch(`/api/users/${userId}/providers/${providerId}`, {
    method: 'DELETE',
  });
}

/* ── Tasks & messages ──────────────────────────────────────── */

// TaskResponse rows, newest first:
// { id, status, type, description, plan_steps, escalation_deadline,
//   created_at, updated_at }
export function getTasks(userId, limit = 100) {
  return apiFetch(`/api/users/${userId}/tasks?limit=${limit}`);
}

// Message audit log, newest first:
// { id, content, direction, channel, timestamp, task_id }
export function getMessages(userId, limit = 200) {
  return apiFetch(`/api/users/${userId}/messages?limit=${limit}`);
}

export function approveEscalation(taskId) {
  return apiFetch(`/api/tasks/${taskId}/approve`, { method: 'POST' });
}

export function denyEscalation(taskId) {
  return apiFetch(`/api/tasks/${taskId}/deny`, { method: 'POST' });
}
