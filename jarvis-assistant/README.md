# JARVIS Hub

One personal portal that combines four tools into a single site, all kept in
sync through **one** n8n workflow:

| Tab | What it is | Where it runs |
|---|---|---|
| ✨ אסטרולוגיה | The astrology browser you already had | 100% client-side (iframe) |
| 📅 לוח עברי | The Hebrew calendar / parshiot / holidays app you already had | 100% client-side (iframe) |
| 🏠 DiraFinder | Live dashboard of AI-scored real-estate listings | Fetches a live n8n Webhook backed by Postgres |
| 🤖 JARVIS | Multi-agent chat assistant | Talks to the n8n Chat Trigger via the official `@n8n/chat` widget |

JARVIS itself also gained three new tools so the chat can answer questions
using the *same* live data the website shows, instead of guessing:
`search_real_estate` (queries the DiraFinder DB), `hebrew_calendar_tool` and
`astrology_tool` (both call this project's small backend, so the chat and the
calendar/astrology tabs never disagree about a date's Hebrew calendar or
someone's zodiac sign).

> **Note on this repository:** this folder was added, at the user's explicit
> request, into `devopsdevopshaim-wq/hint` — a fork of the open-source
> **webhint** linter. It is unrelated to webhint itself; it just lives here
> as a separate top-level folder (`jarvis-assistant/`) and does not touch any
> webhint source.

## Folder layout

```
jarvis-assistant/
├── package.json / package-lock.json  ← your original lockfile (magnet-studio), reused as-is
├── vercel.json                  ← lets Vercel run server.js as one serverless function
├── api/
│   └── index.js                 ← Vercel entrypoint (re-exports the Express app)
├── web/
│   ├── index.html              ← the portal (open this in a browser)
│   └── tools/
│       ├── astrology.html      ← your original astrology app, unmodified
│       └── hebrew-calendar.html← your original Hebrew calendar app, unmodified
├── server/
│   └── server.js               ← Express: serves web/ + a small @hebcal/core API
├── db/
│   └── schema.sql              ← Postgres schema for the DiraFinder tables
└── n8n/
    └── unified-assistant-workflow.json   ← the one workflow to import into n8n
```

## 1. Run the local server (portal + Hebrew calendar API)

```bash
cd jarvis-assistant
npm install
npm start
```

Open **http://localhost:3000** — that's the whole portal. Verified locally
while building this:

- `GET /api/hebrew-date?date=2026-09-19` → Hebrew date, Shabbat/Rosh-Chodesh
  flags, holidays, parsha (accurate, via `@hebcal/core`).
- `GET /api/holidays?start=...&end=...` → holidays/parshiot in a range.
- `GET /api/zodiac?date=1990-03-25` → zodiac sign + short traits.

### Deploy it to Vercel (recommended — gets you a public URL + auto-deploy on push)

The repo is already wired for zero-config Vercel deploys (`vercel.json` +
`api/index.js` route every request to the Express app in `server/server.js`).
To deploy:

1. On https://vercel.com → **Add New… → Project → Import Git Repository**
   → pick `devopsdevopshaim-wq/hint`.
2. Under **Root Directory**, click Edit and set it to `jarvis-assistant`
   (important — this is a monorepo, the rest of the repo is an unrelated
   linter project).
3. Framework Preset: "Other". Leave build/install commands as default
   (Vercel auto-detects `npm install` from `package.json`).
4. Deploy. You'll get a URL like `https://<project>.vercel.app` serving the
   whole portal, plus `/api/hebrew-date`, `/api/holidays`, `/api/zodiac`.
5. Every future push to this branch (or whichever branch you connect)
   redeploys automatically.

Deploy this anywhere Node runs (it's a plain Express app — Render, Fly.io,
a VPS, a container next to your n8n instance, etc.). Whatever URL you deploy
it to, that's the base URL you must put into the two `httpRequestTool` nodes
in the n8n workflow (see step 3) — they currently point at
`http://localhost:3000`, which only works if n8n and this server run on the
same machine.

## 2. Create the database tables

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

This creates `listings`, `listings_enriched`, `ingest_errors`, and a
`listings_scored` view (a join of the first two) that both the website and
JARVIS's `search_real_estate` tool query.

## 3. Import the n8n workflow

1. In n8n: **Workflows → Import from File** → `n8n/unified-assistant-workflow.json`.
2. Replace credentials — search the imported workflow for these placeholders
   and point them at your real credentials:
   - `REPLACE_POSTGRES_CRED_ID` (4 Postgres nodes + the new `search_real_estate`
     tool) → your Postgres connection to the database from step 2.
   - The OpenAI, Anthropic, Slack, Gmail, Google Drive and Gemini credential
     IDs were carried over from your original JARVIS export as-is; if this is
     a different n8n instance, reassign each credential field in the node
     panel (n8n will prompt you automatically for anything it can't resolve).
3. Open **`hebrew_calendar_tool`** and **`astrology_tool`** (both
   `HTTP Request Tool` nodes) and change the URL from `http://localhost:3000`
   to wherever you deployed the server from step 1.
4. **Activate** the workflow.
5. Grab two URLs from the activated workflow:
   - The **Chat Trigger** production webhook URL (open the `Chat` node → copy
     the "Production URL").
   - The **`Webhook: DiraFinder Listings`** production URL (open that node →
     copy its URL; it ends in `/webhook/dirafinder/listings`).
6. Open the portal (`web/index.html`, served by the local server), click the
   ⚙️ gear icon, and paste both URLs in. They're saved in the browser's
   `localStorage` only.

That's it — the DiraFinder tab now shows live, AI-scored listings, and the
JARVIS tab is a working chat that can also search those listings, look up
accurate Hebrew dates/holidays, and answer zodiac questions.

## How "sync between all sources" actually works here

- **DiraFinder ingest** (Schedule/Manual trigger → fetch → normalize → Claude
  analyst agent → score → upsert) is unchanged from your original
  `01_ingest_enrich_score.json` — it's just merged into the same workflow file,
  further down the canvas.
- **The website's DiraFinder tab** and **JARVIS's `search_real_estate` tool**
  read from the exact same `listings_scored` Postgres view — one source of
  truth, two front doors.
- **The website's calendar/astrology tabs** run their own rich, original
  client-side logic (untouched). **JARVIS's `hebrew_calendar_tool` /
  `astrology_tool`** call the same small Express API described above, so chat
  answers about dates/holidays/signs come from one accurate, shared
  calculation instead of a second guess living inside the n8n workflow.
- **JARVIS itself** is your original Orchestrator agent, with three tools
  added to its toolbox — nothing about the original research/writing/
  analysis/code/summarize/planning/claude/gemini/Slack/email/Drive tools was
  changed.

## Known caveats

- The Postgres and HTTP-Request-Tool node parameter shapes (`executeQuery` /
  `queryReplacement`, `queryParameters.parameters`) were hand-authored to
  match the conventions already used in your original workflows and verified
  against a real `@hebcal/core` install — but they were not test-imported
  into a live n8n instance. If a field looks slightly off after import
  (n8n's exact parameter names shift a little between versions), it's a
  one-field fix in the node's UI, not a redesign.
- `search_real_estate`, `hebrew_calendar_tool` and `astrology_tool` are wired
  directly to the Orchestrator as tools (same pattern as the original
  `send_slack_message` / `send_email` / `search_drive` nodes) — no extra LLM
  hop, so they're fast and deterministic.
- CORS is enabled with `Access-Control-Allow-Origin: *` on both the Express
  server and the listings Webhook response, so the portal can call them from
  any origin. Tighten this if you deploy the portal publicly.
