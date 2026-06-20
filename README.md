# FRED — the assistant you can actually call

> Formerly **G** (G.ai), a CS130 capstone. **FRED** is the rebranded fork: a
> warm, capable phone assistant — Friendly, Resourceful, Everyday Deputy — with
> a beautiful new front end and a browser of his own.
>
> 📖 Read **[VISION.md](VISION.md)** for the product direction and the bet behind FRED.

FRED is a personal AI assistant you reach the way you'd reach a friend: **call
him, text him, or chat on the web.** He manages your calendar and inbox, sets
reminders, places phone calls to businesses on your behalf, and — new in FRED —
**browses the open web** to research and get things done, then reports back.

## What's new in the FRED fork

- **Brand & identity** — FRED, with the living *orb* presence used across the
  whole experience (landing, sidebar, chat, call screen).
- **New front end** — a public landing page (call FRED with no account), a calm
  **Today** home, a redesigned **Talk to FRED** chat, and a warm, premium design
  system. See `frontend/`.
- **FRED's browser** — a new agentic web-research tool (`adapters/web/`) wired
  through the same planner / tool-runner / dispatch path as every other tool.
  Set `TAVILY_API_KEY` (preferred) or `BRAVE_API_KEY` to enable it; it degrades
  gracefully when neither is set.
- **Consistent persona** — one warm, honest FRED voice across chat, SMS, and
  voice calls.

## Using FRED (non locally):

Since this project is in testing mode, we will need to add your email to the testing users for you to use this app. Contact a project member with the email you wish to use for FRED so we can add you as a testing user.

## Local Setup

You'll need: Python 3.10+, a Twilio account with an SMS-capable **local** (non-toll-free) phone number, and [ngrok](https://ngrok.com) to expose your local server so Twilio can reach it.

### 1. Install backend deps

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and fill in `TWILIO_AUTH_TOKEN` (Twilio Console → Account → Auth Token). 

### 2. Run the server

```bash
.venv/bin/uvicorn main:app --reload --proxy-headers --forwarded-allow-ips="*"
```

`--proxy-headers` is **required** when running behind ngrok — without it the URL the server reconstructs won't match the URL Twilio signed, and every webhook will 403.

In a separate terminal:

```bash
cd backend
source .venv/bin/activate
celery -A workers.celery_app worker --loglevel=info
```

Celery handles scheduled tasks (reminders, calls), without it, anything with a future time won't fire.

### 3. Expose it via ngrok

In a separate terminal:

```bash
brew install ngrok                            # first time only
ngrok config add-authtoken <YOUR_AUTHTOKEN>   # first time only — copy from ngrok dashboard
ngrok http 8000
```

Copy the `https://*.ngrok-free.app` URL it prints. This URL changes every time you restart ngrok on the free tier — you'll need to re-paste it into Twilio each session.

### 4. Configure Twilio webhooks

In the Twilio Console → Phone Numbers → your number:

- **Voice Configuration** → "A call comes in" → Webhook → `https://<ngrok-url>/webhooks/call`, HTTP POST

Save both.

### 5. Test Voice

- **Voice**: call your Twilio number — you should hear "Hi, this is FRED. What can I help you with?", and after you speak, hear your speech repeated back before it hangs up.

### Testing:
We use pytest for testing. you can add your test under the /tests folder. 
I recommend you mirror the actual structure of the whole project directory. To run tests, you can use the following commend on specific test targeting one module:

```bash
python -m pytest tests/orchestrator/test_task_planner.py -v -s
```

Note: -v is for verbose which shows test names and pass/fail. -s is for no-capture, helps print anythign in stdout that would otherwise not be printed by pytest.

### How to run tests

We are currently using a pytest directory under /test. run

```bash
pytest tests -v

```

to run all tests in the directory. Please create different tests under organized layout similar to the actual directory to keep it easy to maintain.

### File structure for now:
If you create new files or change directory structures, please run the 'tree' command in yoru terminal and update this section so everyone knows the new strucutre. 

<details>
<summary>Project Structure</summary>

```bash
.
├── backend
│   ├── adapters
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── communication
│   │   │   ├── __init__.py
│   │   │   ├── business_call_tool.py
│   │   │   ├── call_tool.py
│   │   │   ├── sms_tool.py
│   │   │   ├── user_call_adapter.py
│   │   │   └── user_sms_adapter.py
│   │   ├── google
│   │   │   ├── __init__.py
│   │   │   ├── calendar_tool.py
│   │   │   ├── gmail_tool.py
│   │   │   ├── user_calendar_adapter.py
│   │   │   └── user_gmail_adapter.py
│   │   ├── llm
│   │   │   ├── __init__.py
│   │   │   ├── base_llm_adapter.py
│   │   │   ├── claude_adapter.py
│   │   │   └── gpt_adapter.py
│   │   ├── speech
│   │   │   ├── __init__.py
│   │   │   └── deepgram_adapter.py
│   │   └── web
│   │       ├── __init__.py
│   │       ├── browser_tool.py          # FRED's agentic web research (Tavily/Brave)
│   │       └── user_browser_adapter.py  # user-scoped wrapper (localizes "near me")
│   ├── alembic.ini
│   ├── api
│   │   ├── __init__.py
│   │   ├── auth
│   │   │   ├── __init__.py
│   │   │   ├── oauth.py
│   │   │   └── routes.py
│   │   ├── chat.py
│   │   ├── contacts.py
│   │   ├── debug.py
│   │   ├── family_members.py
│   │   ├── providers.py
│   │   ├── tasks.py
│   │   ├── users.py
│   │   └── webhooks
│   │       ├── __init__.py
│   │       ├── call.py
│   │       └── sms.py
│   ├── config.py
│   ├── database.py
│   ├── Dockerfile
│   ├── main.py
│   ├── middleware
│   │   ├── __init__.py
│   │   └── twilio_signature.py
│   ├── migrations
│   │   ├── env.py
│   │   ├── initial_schema.sql
│   │   ├── script.py.mako
│   │   └── versions
│   │       ├── 001_add_auth_fields.py
│   │       ├── 002_expand_user_profile.py
│   │       └── 003_add_chat_message_channel.py
│   ├── models
│   │   ├── __init__.py
│   │   ├── contact.py
│   │   ├── datatypes.py
│   │   ├── family_member.py
│   │   ├── message.py
│   │   ├── preference.py
│   │   ├── provider.py
│   │   ├── task.py
│   │   └── user.py
│   ├── orchestrator
│   │   ├── __init__.py
│   │   ├── escalation_engine.py
│   │   ├── orchestrator.py
│   │   └── task_planner.py
│   ├── README.md
│   ├── requirements.txt
│   ├── schemas
│   │   ├── __init__.py
│   │   ├── contact.py
│   │   ├── family_member.py
│   │   ├── message.py
│   │   ├── provider.py
│   │   ├── task.py
│   │   └── user.py
│   ├── services
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── contact_service.py
│   │   ├── conversation.py
│   │   ├── dispatch.py
│   │   ├── family_member_service.py
│   │   ├── message_service.py
│   │   ├── notifications.py
│   │   ├── outbound_call_state.py
│   │   ├── plan_step_executor.py
│   │   ├── provider_service.py
│   │   ├── scheduled_task_scanner.py
│   │   ├── task_service.py
│   │   ├── user_context_service.py
│   │   └── user_service.py
│   ├── utils
│   │   ├── __init__.py
│   │   └── token_crypto.py
│   └── workers
│       ├── __init__.py
│       ├── celery_app.py
│       ├── task_runner.py
│       └── tasks
│           ├── __init__.py
│           ├── morning_digest.py
│           ├── notifications.py
│           └── plan_step.py
├── conftest.py
├── CS130 Captone Design Doc (1).pdf
├── CS130 Captone Design Doc Team 1.pdf
├── CS130 S26 Final Project Guideline.md
├── docker-compose.yml
├── frontend
│   ├── dist
│   │   ├── assets
│   │   │   ├── index-CemWpNYj.js
│   │   │   └── index-CRYxydzC.css
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── public
│   │   └── favicon.ico
│   ├── README.md
│   ├── src
│   │   ├── api
│   │   │   ├── auth.js
│   │   │   └── index.js
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── auth.js
│   │   ├── components
│   │   │   ├── Banner.jsx
│   │   │   ├── FredOrb.jsx          # FRED's living-presence orb (pure CSS/SVG)
│   │   │   ├── common
│   │   │   ├── FamilyMemberRow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── NavBar.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── registration
│   │   │   ├── SuggestionPills.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskSidebar.jsx
│   │   │   ├── TimePicker.jsx
│   │   │   ├── Toggle.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── VoiceTranscript.jsx
│   │   ├── context
│   │   │   └── TaskContext.jsx
│   │   ├── main.jsx
│   │   ├── pages
│   │   │   ├── Landing.jsx          # public front door (orb hero + "Call FRED")
│   │   │   ├── Today.jsx            # calm home / mission control
│   │   │   ├── Chat.jsx
│   │   │   ├── Conversations.jsx
│   │   │   ├── OAuthCallback.jsx
│   │   │   ├── Onboard
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── Tasks.jsx
│   │   └── styles
│   │       └── index.css
│   ├── vercel.json
│   └── vite.config.js
├── package-lock.json
├── Project_Guideline__Idea,_Design_Doc,_Presentation.docx.pdf
├── README.md
└── tests
    ├── __init__.py
    ├── adapters
    │   ├── __init__.py
    │   ├── google
    │   │   ├── __init__.py
    │   │   ├── test_gcal_tool.py
    │   │   ├── test_gmail_tool.py
    │   │   └── test_user_calendar_adapter.py
    │   └── llm
    │       ├── __init__.py
    │       ├── test_orchestrator_live.py
    │       └── test_orchestrator_response_simple.py
    ├── api
    │   ├── __init__.py
    │   ├── test_contacts.py
    │   ├── test_family_members.py
    │   ├── test_oauth.py
    │   ├── test_providers.py
    │   ├── test_sms_webhook.py
    │   ├── test_tasks_escalation.py
    │   └── test_users_messages.py
    ├── authentication
    ├── orchestrator
    │   ├── __init__.py
    │   ├── test_escalation_engine.py
    │   └── test_task_planner.py
    ├── services
    │   ├── __init__.py
    │   ├── test_contact_service.py
    │   ├── test_dispatch.py
    │   ├── test_family_member_service.py
    │   ├── test_message_service.py
    │   ├── test_notifications.py
    │   ├── test_provider_service.py
    │   ├── test_task_service.py
    │   ├── test_user_context_service.py
    │   └── test_user_service.py
    ├── utils
    │   ├── __init__.py
    │   └── test_token_crypto.py
    └── workers
        ├── __init__.py
        ├── test_escalation_workflow.py
        ├── test_morning_digest.py
        ├── test_notify_user_task.py
        └── test_task_runner.p

```
27 directories, 71 files
</details>