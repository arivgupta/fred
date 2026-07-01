# G — web app

React (Vite) frontend for **G**, the AI secretary for busy parents. This is
the rebuilt UI: a warm, product-grade design system with light/dark themes,
a Home overview, live chat, a task board with in-app approvals, unified
conversation history, and a full settings surface.

## Quick start

```bash
npm install

# Option A — full stack: run the FastAPI backend on :8000, then
npm run dev              # Vite proxies /api/* to the backend

# Option B — no backend needed (demo/dev/design work):
npm run mock             # zero-dependency mock API on :8000
npm run dev              # in a second terminal
```

Sign in with any email/password when using the mock (it always signs you
into the demo account, pre-seeded with tasks, approvals, and history).

## Environment

Copy `.env.example` to `.env`:

| Var | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend origin. Empty in dev (Vite proxy) or e.g. `https://api.example.com` in prod. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client. If unset, Google sign-in buttons are hidden and password auth is used. |
| `VITE_G_PHONE_NUMBER` | Phone number shown on the Home "text G" card (optional). |

## Structure

```
src/
├── api.js               # single API layer (fetch + auth header)
├── auth.js              # localStorage session + g:auth events
├── theme.js             # light/dark theme (data-theme attribute)
├── hooks.js             # useAuthUser, useNow
├── lib/                 # formatting + task presentation helpers
├── context/
│   ├── TasksContext.jsx # live task store, polling, approvals badge
│   └── ToastContext.jsx # toast notifications
├── components/          # design-system primitives + shell
├── pages/               # Home, Chat, Tasks, History, Settings, auth, onboarding
└── styles/              # tokens.css → base → components → per-page css
```

## Design system

Everything is driven by CSS custom properties in `src/styles/tokens.css`
("Warm Concierge": warm paper neutrals, iris accent, Fraunces display serif
+ Inter UI sans). Dark theme overrides live in the same file under
`[data-theme="dark"]`. No CSS framework, no icon library — icons are
hand-rolled SVGs in `components/Icon.jsx`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run mock` | In-memory mock of the backend API on :8000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
