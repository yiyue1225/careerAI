# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install all dependencies (run once after clone)
npm install && npm install --prefix backend

# Start both frontend (port 5173) and backend (port 3000) simultaneously
npm run dev

# Start individually
npm run dev:client    # Vite frontend only
npm run dev:server    # Node.js backend only (uses nodemon)

# Production build
npm run build
```

The Vite dev server proxies all `/api/*` requests to `http://127.0.0.1:3000`, so the frontend always calls `/api/...` without specifying a host.

## Environment Setup

Copy `backend/.env.example` to `backend/.env` and fill in:
- `DB_HOST / DB_USER / DB_PASS / DB_NAME` — MySQL connection
- `DIFY_API_URL` — Dify base URL (e.g. `http://<ip>:8888/v1`)
- `DIFY_API_KEY` — Dify **Agent** app key (AI assistant chat, streaming)
- `DIFY_API_KEY_EXTRACT_JOB_INFO` — Dify **Agent** app key (resume analysis, streaming)
- `ADMIN_USER / ADMIN_PASS` — Admin panel login credentials (default: admin / admin123)

Database: import `database/career_ai.sql` into MySQL before starting.

## Architecture

**Frontend** (`src/`) — Vue 3 + TypeScript, `@` aliases to `src/`. Element Plus components are auto-imported via `unplugin-vue-components` (no manual imports needed).

**Backend** (`backend/app.js`) — Single-file Express server (CommonJS). All API routes are defined here. Uses a `mysql2` connection pool.

**State** — `src/store/index.ts` (Pinia) holds `studentProfile` (the parsed resume data) and `targetPositionId`. These are the only cross-page shared values. Most pages read `studentProfile` to compute match scores locally.

**AI layer** — Both Dify apps are **Agent type** (not Workflow, not Chatbot):
- `POST /api/analyze` → Dify Agent via `/v1/chat-messages` with `response_mode: 'streaming'`. Collects SSE chunks (`event: agent_message`), concatenates `answer` deltas, then extracts JSON with regex. Falls back to local rule-based extraction if Dify fails. Response includes `source: 'ai' | 'fallback'`.
- `POST /api/chat` → Dify Agent via `/v1/chat-messages` with `response_mode: 'blocking'`. Passes `conversation_id` for multi-turn context.

**Admin auth** — `POST /api/admin/login` returns a hardcoded token stored in `localStorage`. All `/api/admin/*` routes check `Authorization: Bearer <token>`. Frontend route guard in `router/index.ts` redirects `/admin` to `/admin/login` if token missing. `/admin/login` uses `meta: { noLayout: true }` so `App.vue` renders it without the sidebar.

## Key Patterns

**Match score calculation** — Used in `PositionLibrary.vue`, `Volunteer.vue`, and `MatchReport.vue`. Always computed on the frontend:
```js
const dims = ['professional','certificate','innovation','learning','stress','communication','internship']
const avgGap = dims.reduce((s, d) => s + Math.abs(student[d] - pos.dimensions[d]), 0) / dims.length
const matchScore = Math.max(0, Math.min(100, 100 - avgGap))
```

**Volunteer tiers** — `Volunteer.vue` classifies positions by match score: 冲(50–69%), 稳(70–84%), 保(85%+).

**RadarChart.vue** — Reusable chart. Expects `{ indicator: [{name, max}], series: [{name, data: [[...values]]}] }`. Each series gets a distinct color + radial gradient fill automatically. Tooltip always shows all series' dimension values at once. Must be wrapped in a container with explicit height (e.g. `style="height:360px"`) — the component itself is `height:100%`.

**Skill filter** — `buildWhereClause` in `app.js` accepts a `skill` param that uses `JSON_CONTAINS(requirements->'$.professionalSkills', JSON_QUOTE(?))` for exact array matching. Clicking a skill tag in `PositionDetail.vue` navigates to `/positions?skill=<name>`. `PositionLibrary.vue` reads `route.query.skill` on mount and shows a dismissible filter chip.

**Position detail fetch** — `PositionDetail.vue` calls `GET /api/positions/:id` (direct primary-key lookup). The old pattern of fetching the paginated list and `.find()` was removed because it only returned page 1.

**Backend WHERE builder** — `buildWhereClause(req.query)` handles `search` (job_name/company_name LIKE), `skill` (JSON_CONTAINS on professionalSkills), `industry` (JSON_CONTAINS on clean_industry), `city` (=), `salary` (range). Returns `{ whereParts, queryParams }`.

## Pages & Routes

| Route | View | Notes |
|-------|------|-------|
| `/` | `Home.vue` | Stats from `/api/stats`, real pie chart |
| `/positions` | `PositionLibrary.vue` | Compare 2 positions (combined radar), skill heatmap, sort by match |
| `/position/:id` | `PositionDetail.vue` | Direct `/api/positions/:id` fetch; skill tags clickable |
| `/profile` | `Profile.vue` | 3-step agent progress UI; source banner shows AI vs fallback |
| `/match` | `MatchReport.vue` | Uses mock position data from `src/mock/` |
| `/volunteer` | `Volunteer.vue` | Requires `studentProfile`; 4-step wizard; export PDF |
| `/ai-assistant` | `AIAssistant.vue` | Real Dify Agent, multi-turn via `conversationId` |
| `/admin` | `Admin.vue` | Tabs: data overview + position CRUD; requires admin token |
| `/admin/login` | `Login.vue` | No sidebar layout (`meta.noLayout`) |

## Backend API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/positions` | — | Paginated list; params: `page,size,search,skill,industry,city,salary` |
| GET | `/api/positions/:id` | — | Single position by primary key |
| GET | `/api/position-filters` | — | All industry/city options |
| GET | `/api/industry-stats` | — | Pie chart data, same filter params |
| GET | `/api/stats` | — | `{ totalPositions, totalCities }` |
| GET | `/api/skill-stats` | — | Top 60 skills from requirements JSON |
| GET | `/api/top-salary` | — | Top 10 job titles by avg salary |
| POST | `/api/analyze` | — | `multipart/form-data` with `resume` file; streams to Dify Agent |
| POST | `/api/chat` | — | `{ message, conversationId? }` → Dify Agent |
| POST | `/api/admin/login` | — | Returns bearer token |
| GET | `/api/admin/positions` | Bearer | Paginated position list for CRUD |
| POST | `/api/admin/positions` | Bearer | Create position |
| PUT | `/api/admin/positions/:id` | Bearer | Update position |
| DELETE | `/api/admin/positions/:id` | Bearer | Delete position |
