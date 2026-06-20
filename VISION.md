# FRED — the assistant you can actually call

> _Formerly "G" (G.ai). This document is the north star for the FRED fork: what
> changes, why, and where this is going. It is opinionated on purpose._

---

## 0. The one-line pitch

**FRED is a person you can call.** You dial a number, a warm voice picks up, and
something genuinely capable is on the other end — it remembers you, it has your
calendar and inbox, it can open a browser and *go do things*, and it calls or
texts you back when it's done. No app required. No prompt engineering. You just
talk to FRED like you'd talk to the most organized, unflappable friend you have.

The web app is **not** the product. The web app is *mission control* — where you
watch what FRED is doing, see what it knows about you, and tune how it behaves.
The product is the relationship you have with FRED over the phone.

**FRED** — your **F**riendly, **R**esourceful **E**veryday **D**eputy.

---

## 1. What "G" was, honestly

G was a strong CS130 capstone. It nailed the hard, unglamorous parts:

- A real multi-channel pipeline: web chat, SMS, and Twilio voice all funnel into
  one orchestrator → planner → tool-runner → escalation loop.
- Real integrations: Google Calendar, Gmail, outbound business calls, scheduled
  reminders via Celery with a scanner safety-net.
- A thoughtful escalation model (pause, ask the human, resume) and a preferences
  system (quiet hours, digest, tone, conflict handling).

But it read as a **dashboard with a chatbot bolted on**. The brand ("G.ai") was
forgettable. The UI was the generic indigo-on-grey SaaS template. The voice
experience — the most magical thing it does — was invisible in the product. And
the agent could *talk about* the world but couldn't *act in* it beyond a fixed
set of tools.

The bones are excellent. What it's missing is a **soul** and a **frontier**.

---

## 2. The thesis: voice-first, agentic, with a face

Three bets define FRED.

### Bet 1 — The phone call is the interface of the next decade
Typing into a box is a 2022 interaction. The moment a machine can hold a fluent,
low-latency, interruptible spoken conversation, the *call* becomes the most
natural, most inclusive, lowest-friction way to delegate. It works for the busy
parent driving carpool. It works for the grandparent who will never download an
app. It works hands-free, eyes-free, in the 90 seconds you have. FRED leans all
the way into this: **the number is the front door.**

### Bet 2 — An assistant should *act*, not just answer
The difference between a chatbot and an assistant is agency. "I'll look into it
and get back to you" has to be *true*. FRED gets **its own browser** — a real,
sandboxed, agentic web session it can drive to research, compare, fill forms,
pull up a menu, check store hours, find the cheapest flight — and then it reports
back by text or call. This is the single biggest capability jump from G.

### Bet 3 — Trust is a feeling, and feelings need a face
You don't hand your calendar and your phone calls to a faceless API. You hand
them to *FRED*. FRED has a consistent visual presence (the **orb**), a consistent
voice, a consistent personality — warm, calm, dryly funny, never sycophantic,
always honest about what it did and didn't do. Every high-stakes action is
confirmed. Every action is logged in plain language. The product's job is to make
delegating feel *safe*, and safety is built from character + transparency.

---

## 3. The experience, reimagined

### The first 30 seconds
You land on `fred` and you don't see a login wall or a feature grid. You see a
single living orb breathing in the dark, a phone number, and four words: **"Call
FRED. He'll handle it."** You can call right then — no account — and have a real
conversation. Onboarding happens *in the call*. The app is something you open
later, once you're already hooked.

### The orb — FRED's body
FRED is represented everywhere by one element: a soft, glowing orb with a warm
amber→coral→violet gradient. It is never static. It **breathes** when idle,
**listens** (ripples) when you speak, **thinks** (swirls) while planning, and
**works** (a busy shimmer) while it's off doing something for you. It is the
single most important piece of brand and UX in the whole product, and it's built
in pure CSS/SVG so it's instant and everywhere — landing, nav, chat avatar, call
screen.

### Mission control (the app)
Five surfaces, in priority order:

1. **Today** — the calm home. What's on your plate, what FRED handled while you
   were away, anything that needs a yes/no from you. One glance.
2. **Talk to FRED** — chat, but it's clearly the *same FRED* you call. Same orb,
   same voice in text. Rich cards for the things FRED creates.
3. **Activity** — the timeline. Every call, text, and action, rendered like a
   beautiful transcript, not a log table. "Here's exactly what I did and why."
4. **Memory** — what FRED knows about you: people, places, providers,
   preferences, and learned facts. You can read it, correct it, delete it. This
   is the trust surface.
5. **Settings** — the dials from G's preferences, redesigned to feel like tuning
   a relationship, not configuring software.

### The call screen (the frontier piece)
When a call is live (or replaying), you see the orb reacting in real time, a
flowing transcript, and — crucially — **what FRED is doing in the background**:
"🔎 Searching for pediatric dentists open Saturday… ☎️ Calling Westside Dental…
✅ Booked Tue 3:30." You watch your deputy work. Nobody else shows you this.

---

## 4. What gets better under the hood

This fork is a facelift *and* a capability/robustness pass.

| Area | G today | FRED |
|---|---|---|
| Brand | "G.ai", generic | FRED — named character, the orb, a voice |
| Front door | login → dashboard | public landing, **call without an account** |
| Agency | fixed tools | **agentic browser** for research + doing |
| Voice UX | invisible in app | first-class call screen + live activity |
| Trust | escalation only | escalation + **Memory surface** + plain-language activity |
| Planner | rigid JSON, brittle retries | same contract, hardened, browser-aware |
| Personality | "helpful AI secretary" | warm, consistent, honest deputy persona |

### Concrete engineering moves in this PR
- **`browser_tool`**: a new agentic web-research/action adapter, wired through the
  existing Tools enum, planner prompts, and tool registry exactly like the
  calendar/gmail/sms tools — so it inherits scheduling, escalation, and logging
  for free. Pluggable backend (search + fetch) with graceful degradation when no
  search key is configured, so the system never hard-fails.
- **Persona upgrade**: FRED's system prompts rewritten for a consistent, warm,
  trustworthy character with strong judgment about when to confirm before acting.
- **Rebrand end-to-end**: app titles, banners, prompts, copy, and the entire
  frontend.

### Where I'd take it next (beyond this PR)
- **Streaming voice** (Deepgram STT + a TTS voice) with barge-in for sub-second,
  interruptible turns — the thing that makes a call feel *alive*.
- **Long-term memory** as a first-class store (vector + structured), so FRED
  remembers across months, not just within a call.
- **Proactivity engine**: "your 4pm moved, want me to push the dentist?" FRED
  reaching out is where it stops being a tool and starts being a deputy.
- **Multi-party calls**: FRED conferenced in to coordinate (you + the school +
  FRED) instead of relaying.
- **Per-user FRED tuning**: voice, formality, how much rope it has to act
  unsupervised — a relationship you shape over time.

---

## 5. Principles (the non-negotiables)

1. **Voice-first, app-optional.** If a feature only works in the app, it's a
   second-class feature.
2. **Act, then report — never silently.** FRED always tells you what it did, in
   words a human would use.
3. **Confirm anything that spends money, calls a stranger, or can't be undone.**
   Speed is great; trust is greater.
4. **One FRED.** Same character and memory across call, text, and chat. You are
   never talking to a different bot.
5. **Calm by default.** No badges screaming for attention, no dark patterns. The
   product should lower your blood pressure.
6. **Inclusive on purpose.** It has to be delightful for someone who will only
   ever use the phone.

---

## 6. Why this matters

The frontier of human–computer interaction isn't a better chat box. It's the
moment software stops being a place you go and becomes *someone you ask*. The
phone call — the oldest, most human remote interface we have — turns out to be
the perfect shape for that. FRED is a bet that the best assistant on the planet
won't feel like an app at all. It'll feel like calling a friend who happens to be
able to do anything.

Call FRED. He'll handle it.
