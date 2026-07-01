#!/usr/bin/env node
// Zero-dependency mock of the G backend for frontend development & demos.
//
//   npm run mock       → serves http://localhost:8000
//   npm run dev        → Vite proxies /api/* here (VITE_API_BASE_URL empty
//                        or http://localhost:8000)
//
// Implements the same routes/shapes as the FastAPI backend (see
// API_DOCUMENTATION.md) with an in-memory store and a keyword-driven chat
// brain, so every screen can be exercised with no Postgres/Twilio/Anthropic
// credentials. This file never runs in production.

import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT || 8000;

/* ── Demo store ────────────────────────────────────────────── */

const now = Date.now();
const iso = (t) => new Date(t).toISOString();

const user = {
  id: randomUUID(),
  name: 'Alex Johnson',
  phone_number: '+13105550182',
  email: 'alex@example.com',
  comm_style: 'brief',
  preferred_channel: 'sms',
  call_urgency_threshold: 'high',
  blocked_windows: [{ start_time: '22:00', end_time: '07:00' }],
  keep_free_windows: null,
  active_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  morning_digest_enabled: true,
  morning_digest_time: '07:00',
  morning_digest_content: 'calendar',
  morning_digest_travel_time: false,
  escalation_timeout_minutes: 30,
  auto_approve_low_risk: false,
  max_reminders: 3,
  tone: 'casual',
  reminder_lead_time_minutes: 30,
  conflict_handling: 'suggest',
};

let familyMembers = [
  { id: randomUUID(), name: 'Sarah Johnson', relation: 'Spouse', phone_number: '+13105550183' },
  { id: randomUUID(), name: 'Emma Johnson', relation: 'Child', phone_number: null },
  { id: randomUUID(), name: 'Mark Johnson', relation: 'Child', phone_number: null },
];

let contacts = [
  { id: randomUUID(), name: 'Mrs. Carter', role: 'Office Manager', org: "Mark's School", phone: '+13105550201' },
];

let providers = [
  { id: randomUUID(), name: 'Dr. Lee', specialty: 'Dentist', practice: 'Westside Dental' },
];

let tasks = [
  {
    id: randomUUID(),
    status: 'ESCALATION_PENDING',
    type: 'calendar_update',
    description: 'Book a dentist appointment for Emma next week',
    plan_steps: [
      {
        tool: 'calendar_tool',
        params: { summary: 'Emma — dentist (Westside Dental)', start: iso(now + 5 * 864e5) },
        status: 'ESCALATION_PENDING',
      },
      { tool: 'sms_tool', params: { body: 'Booked! Emma sees Dr. Lee Tuesday 3:30 PM.' }, status: 'PENDING' },
    ],
    escalation_deadline: iso(now + 22 * 60 * 1000),
    created_at: iso(now - 8 * 60 * 1000),
    updated_at: iso(now - 8 * 60 * 1000),
  },
  {
    id: randomUUID(),
    status: 'PENDING',
    type: 'reminder',
    description: 'Remind me about soccer pickup at 4pm',
    plan_steps: [
      {
        tool: 'sms_tool',
        params: { body: 'Heads up — soccer pickup for Emma at 4 PM!', scheduled_at: iso(now + 3 * 60 * 60 * 1000) },
        status: 'PENDING',
      },
    ],
    escalation_deadline: null,
    created_at: iso(now - 60 * 60 * 1000),
    updated_at: iso(now - 60 * 60 * 1000),
  },
  {
    id: randomUUID(),
    status: 'IN_PROGRESS',
    type: 'information_request',
    description: 'Call the pharmacy about Sarah’s refill (RX-4492)',
    plan_steps: [
      {
        tool: 'business_call_tool',
        params: { to: '+13105550344', business_name: 'CVS Pharmacy', goal: 'Refill prescription RX-4492 for Sarah Johnson' },
        status: 'IN_PROGRESS',
      },
    ],
    escalation_deadline: null,
    created_at: iso(now - 26 * 60 * 1000),
    updated_at: iso(now - 20 * 60 * 1000),
  },
  {
    id: randomUUID(),
    status: 'COMPLETED',
    type: 'reminder',
    description: 'Remind me to sign Mark’s permission slip',
    plan_steps: [
      { tool: 'sms_tool', params: { body: 'Don’t forget to sign Mark’s permission slip tonight!' }, status: 'COMPLETED' },
    ],
    escalation_deadline: null,
    created_at: iso(now - 26 * 60 * 60 * 1000),
    updated_at: iso(now - 22 * 60 * 60 * 1000),
  },
  {
    id: randomUUID(),
    status: 'FAILED',
    type: 'information_request',
    description: 'Find a plumber for the kitchen sink leak',
    plan_steps: [
      { tool: 'business_call_tool', params: { goal: 'Get a quote to fix a kitchen sink leak' }, status: 'FAILED' },
    ],
    escalation_deadline: null,
    created_at: iso(now - 2 * 864e5),
    updated_at: iso(now - 2 * 864e5 + 3600e3),
  },
];

let messages = [
  // voice call yesterday
  m('inbound', 'voice', 'Call the insurance company about claim 8847-B please.', now - 30 * 60 * 60 * 1000),
  m('outbound', 'voice', 'On it — I’ll call BlueCross now and report back with the claim status.', now - 30 * 60 * 60 * 1000 + 30e3),
  m('outbound', 'voice', 'Reached BlueCross: claim 8847-B is under review, decision within 5 business days. Reference CR-2291.', now - 30 * 60 * 60 * 1000 + 4 * 60e3),
  // sms thread yesterday
  m('inbound', 'sms', 'Remind me to sign Mark’s permission slip tonight', now - 26 * 60 * 60 * 1000),
  m('outbound', 'sms', 'Got it! I’ll text you tonight at 7 PM about Mark’s permission slip.', now - 26 * 60 * 60 * 1000 + 20e3),
  m('outbound', 'sms', 'Don’t forget to sign Mark’s permission slip tonight!', now - 22 * 60 * 60 * 1000),
  // web chat earlier today
  m('inbound', 'chat', 'What’s on my calendar tomorrow?', now - 3 * 60 * 60 * 1000),
  m('outbound', 'chat', 'Tomorrow you have Emma’s soccer practice at 4 PM and a parent-teacher call at 6:30 PM. Otherwise clear!', now - 3 * 60 * 60 * 1000 + 15e3),
];

function m(direction, channel, content, ts, task_id = null) {
  return { id: randomUUID(), direction, channel, content, timestamp: iso(ts), task_id };
}

/* ── Tiny chat brain ───────────────────────────────────────── */

function chatReply(text) {
  const lower = text.toLowerCase();

  if (/(remind|reminder)/.test(lower)) {
    const task = {
      id: randomUUID(),
      status: 'PENDING',
      type: 'reminder',
      description: text.slice(0, 120),
      plan_steps: [
        { tool: 'sms_tool', params: { body: `Reminder: ${text.slice(0, 80)}`, scheduled_at: iso(Date.now() + 60 * 60 * 1000) }, status: 'PENDING' },
      ],
      escalation_deadline: null,
      created_at: iso(Date.now()),
      updated_at: iso(Date.now()),
    };
    tasks.unshift(task);
    return { reply: 'Done — I’ll text you a reminder about that. You can see it on the Tasks page.', task_id: task.id, escalated: false };
  }

  if (/(book|schedule|appointment|dentist|doctor)/.test(lower)) {
    const task = {
      id: randomUUID(),
      status: 'ESCALATION_PENDING',
      type: 'calendar_update',
      description: text.slice(0, 120),
      plan_steps: [
        { tool: 'calendar_tool', params: { summary: text.slice(0, 80) }, status: 'ESCALATION_PENDING' },
      ],
      escalation_deadline: iso(Date.now() + 30 * 60 * 1000),
      created_at: iso(Date.now()),
      updated_at: iso(Date.now()),
    };
    tasks.unshift(task);
    return { reply: 'I found a slot that works. Before I confirm, this needs your approval — check the Tasks tab.', task_id: task.id, escalated: true };
  }

  if (/call me/.test(lower)) {
    const task = {
      id: randomUUID(),
      status: 'PENDING',
      type: 'reminder',
      description: text.slice(0, 120),
      plan_steps: [
        { tool: 'call_tool', params: { message: text.slice(0, 80), scheduled_at: iso(Date.now() + 30 * 60 * 1000) }, status: 'PENDING' },
      ],
      escalation_deadline: null,
      created_at: iso(Date.now()),
      updated_at: iso(Date.now()),
    };
    tasks.unshift(task);
    return { reply: 'You got it — I’ll give you a ring. It’s on the schedule.', task_id: task.id, escalated: false };
  }

  if (/(calendar|tomorrow|today|schedule\?)/.test(lower)) {
    return { reply: 'Tomorrow: Emma’s soccer practice at 4 PM, parent-teacher call at 6:30 PM. Want me to block travel time?', task_id: null, escalated: false };
  }

  if (/(email|inbox|gmail)/.test(lower)) {
    return { reply: 'Two things stand out: the school newsletter (spirit week is Friday) and a billing notice from the dentist. Everything else can wait.', task_id: null, escalated: false };
  }

  return { reply: 'I’m here! I can set reminders, manage your calendar, check email, or make calls on your behalf. What can I take off your plate?', task_id: null, escalated: false };
}

/* ── HTTP plumbing ─────────────────────────────────────────── */

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;
  const body = ['POST', 'PATCH'].includes(req.method) ? await readBody(req) : {};

  /* auth */
  if (p === '/api/auth/login' && req.method === 'POST') {
    return json(res, 200, { user, token: 'mock-token' });
  }
  if (p === '/api/auth/register' && req.method === 'POST') {
    user.name = body.name || user.name;
    user.email = body.email || user.email;
    return json(res, 201, { user, token: 'mock-token' });
  }

  /* chat */
  if (p === '/api/chat' && req.method === 'POST') {
    const result = chatReply(body.message || '');
    messages.unshift(m('inbound', 'chat', body.message || '', Date.now()));
    messages.unshift(m('outbound', 'chat', result.reply, Date.now() + 1000, result.task_id));
    await new Promise((r) => setTimeout(r, 700)); // simulate thinking
    return json(res, 200, result);
  }

  /* tasks approve / deny */
  let match = p.match(/^\/api\/tasks\/([^/]+)\/(approve|deny)$/);
  if (match && req.method === 'POST') {
    const t = tasks.find((x) => x.id === match[1]);
    if (!t) return json(res, 404, { detail: 'Task not found' });
    if (t.status !== 'ESCALATION_PENDING') {
      return json(res, 409, { detail: `Task is not pending escalation (status=${t.status})` });
    }
    t.status = match[2] === 'approve' ? 'COMPLETED' : 'FAILED';
    t.updated_at = iso(Date.now());
    t.plan_steps = t.plan_steps.map((s) => ({ ...s, status: t.status }));
    return json(res, 200, { task_id: t.id, status: t.status });
  }

  /* per-user resources */
  match = p.match(/^\/api\/users\/([^/]+)(\/.*)?$/);
  if (match) {
    const sub = match[2] || '';

    if (sub === '' && req.method === 'GET') return json(res, 200, user);
    if (sub === '' && req.method === 'PATCH') {
      Object.assign(user, Object.fromEntries(Object.entries(body).filter(([, v]) => v != null)));
      return json(res, 200, user);
    }
    if (sub === '/preferences' && req.method === 'PATCH') {
      Object.assign(user, Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)));
      return json(res, 200, user);
    }
    if (sub === '/tasks') return json(res, 200, tasks);
    if (sub === '/messages') {
      // Real backend returns newest-first.
      const limit = Number(url.searchParams.get('limit') || 50);
      const sorted = [...messages].sort(
        (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
      );
      return json(res, 200, sorted.slice(0, limit));
    }

    const collections = {
      '/family-members': [familyMembers, (v) => (familyMembers = v)],
      '/contacts': [contacts, (v) => (contacts = v)],
      '/providers': [providers, (v) => (providers = v)],
    };
    for (const [prefix, [list, setList]] of Object.entries(collections)) {
      if (sub === prefix && req.method === 'GET') return json(res, 200, list);
      if (sub === prefix && req.method === 'POST') {
        const created = { id: randomUUID(), ...body };
        setList([...list, created]);
        return json(res, 201, created);
      }
      const rowMatch = sub.match(new RegExp(`^${prefix}/([^/]+)$`));
      if (rowMatch && req.method === 'DELETE') {
        setList(list.filter((x) => x.id !== rowMatch[1]));
        return json(res, 200, { ok: true });
      }
    }
  }

  if (p === '/health') return json(res, 200, { status: 'ok', mock: true });

  return json(res, 404, { detail: `No mock for ${req.method} ${p}` });
});

server.listen(PORT, () => {
  console.log(`Mock G backend listening on http://localhost:${PORT}`);
  console.log(`Demo user: ${user.email} (any password) — id ${user.id}`);
});
