<div align="center">

# 🐾 A.W.W. Helpers

**A home for every paw.**

A street-level animal welfare network for India. Spot an animal in trouble, report it in
thirty seconds without an account, and every verified shelter within range hears about it.

[Report a rescue](#) · [Adopt](#) · [Lost & found](#) · [Volunteer](#) · [Give](#)

</div>

---

## What it does

| | |
|---|---|
| 🚨 **Rescue** | Anyone — account or not — pins an animal on a map with photos and an urgency level. Nearby shelters see it sorted by distance, with critical cases jumping the queue. One claims it, and the reporter follows a public timeline all the way to "safe". |
| 🏠 **Adopt & foster** | Shelters list animals with real stories. Filter by species, age, size, and distance. Applications go straight to the shelter's dashboard; approving one automatically takes the animal off the board and closes the other applications. |
| 🔎 **Lost & found** | Two sides of one board. Post a missing pet or a found one, and the database suggests matches by species, proximity and date window. |
| 🤝 **Volunteer** | Shelters post what they actually need — drivers, photographers, foster homes, spreadsheet people. Slot counters stay honest automatically. |
| 💛 **Give** | Per-animal fundraisers with a real goal, a real story, and a donor wall. Payment-gateway-shaped, with a documented swap-in point. |
| 🏥 **Shelter directory** | Verified rescuers near you, with the number that reaches a human. |

Everything geographic runs on real PostGIS proximity search, not pincode string matching.

---

## Stack

```
┌─ apps/web ──────────┐   ┌─ apps/api ──────────┐   ┌─ Supabase ──────────┐
│ Next.js 15 (App)    │──▶│ Hono + Node 22      │──▶│ Postgres 17         │
│ React 19            │   │ service-role client │   │ PostGIS 3.3         │
│ Tailwind CSS v4     │   │ JWT verification    │   │ Auth · Storage · RLS│
│ Framer Motion       │   │ zod validation      │   └─────────────────────┘
│ GSAP ScrollTrigger  │   └─────────────────────┘             ▲
│ Lenis · MapLibre    │            on Render                  │
└─────────────────────┘                                       │
        on Vercel  ──────── auth (supabase-js) ───────────────┘
```

**`packages/shared`** holds the zod schemas and TypeScript types both sides import, so a
validation rule can never drift between the form and the endpoint.

### Why this shape

- **Auth lives in the browser.** supabase-js owns sign-in, session storage and token refresh;
  the API only *verifies* the token it is handed. Refresh logic exists in exactly one place.
- **All writes go through the API.** It holds the service-role key and runs its own
  authorization checks. RLS is still enabled on every table as a second lock — the anon key
  ships in the browser bundle, so the policies assume it will leak and limit the blast radius
  to reading already-public data.
- **Photos never touch the API.** The browser asks for a signed upload URL and sends bytes
  straight to Supabase Storage. Render's free tier does not want to proxy 8MB JPEGs.
- **Proximity search is an RPC.** PostgREST cannot express `ST_DWithin`, so each "near me"
  query is a SQL function that returns rows pre-sorted by distance with `distance_km` attached.

---

## Design

Committed to a single light theme: warm cream paper, chunky rounded shapes, hard *offset*
shadows rather than blurred ones, and hand-drawn SVG doodles with deliberate wobble. Every
button presses down into its own shadow. Cards sit at slight angles and straighten when you
engage with them.

Motion is layered by tool, not sprinkled everywhere:

- **Lenis** drives scroll position; **GSAP ScrollTrigger** reads it. The two are ticked from
  one rAF loop so pinned sections never lag the content around them.
- **GSAP** handles what it is genuinely better at — the hero's three-layer parallax and
  scrubbed timelines.
- **Framer Motion** handles everything one-shot and interactive: scroll reveals, springy
  buttons, the nav pill that glides between links via shared layout, staggered card entrances.
- `prefers-reduced-motion` turns all of it off and leaves a site that still looks intentional.

---

## Running it locally

**Prerequisites:** Node 20+, and a free [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/Tushar-Surti/AnimalWelfareWeb.git
cd AnimalWelfareWeb
npm install
```

### 1. Environment

```bash
cp .env.example .env                       # DATABASE_URL, for migrations
cp apps/api/.env.example apps/api/.env     # Supabase URL + both keys
cp apps/web/.env.example apps/web/.env.local
```

From your Supabase dashboard:

| Where | What | Goes in |
|---|---|---|
| Settings → Database → Connection string (URI) | `DATABASE_URL` | root `.env` |
| Settings → API → Project URL | `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | both |
| Settings → API → `anon` key | `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both |
| Settings → API → `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` | `apps/api/.env` **only** |

> The `service_role` key bypasses row level security entirely. It belongs on the server and
> nowhere near a `NEXT_PUBLIC_*` variable.

### 2. Database

```bash
npm run db:push            # applies supabase/migrations/*.sql in order
npm run db:push -- --seed  # optional: demo shelters, rescues and animals
npm run db:push -- --dry   # preview what would run
```

Migrations are tracked in a `_migrations` table, each runs in its own transaction, and every
file is idempotent — re-running is safe.

### 3. Go

```bash
npm run dev        # web on :3000, api on :8787
```

Or separately: `npm run dev:web` / `npm run dev:api`.

---

## Deploying

### Supabase
Create the project, then run `npm run db:push` against it. That is the whole setup — PostGIS,
storage buckets and RLS policies all come from the migrations.

### API → Render
Point a Blueprint at this repo; [`render.yaml`](render.yaml) does the rest. Set
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `CORS_ORIGINS` when
prompted. Health check is `/health`.

> Free-tier instances sleep after inactivity, so the first request after a quiet spell takes
> ~30s. The homepage falls back to zeroed stats rather than erroring while that happens.

### Web → Vercel
Import the repo, set the root directory to `apps/web`, and add the three `NEXT_PUBLIC_*`
variables. [`apps/web/vercel.json`](apps/web/vercel.json) handles the monorepo build.

Then add your Vercel URL to the API's `CORS_ORIGINS` and redeploy it.

---

## Repository

```
apps/web              Next.js frontend
apps/api              Hono API
packages/shared       zod schemas + types shared by both
supabase/migrations   10 SQL migrations, applied in filename order
supabase/seed.sql     demo data
scripts/db-push.mjs   migration runner
legacy/               the original 2022 PHP + MySQL version, kept for posterity
```

### The database

16 tables. A few things worth pointing at:

- `rescues.reporter_id` is **nullable** — someone standing over a bleeding dog should not have
  to verify an email first.
- Status changes write their own timeline entries via trigger, so history can never silently
  diverge from the current status.
- Approving an adoption application marks the animal adopted and politely closes the others,
  in one trigger, so two families are never promised the same dog.
- Donation totals and volunteer slot counters are denormalised for fast reads and kept exact
  by triggers.
- `match_lost_found()` finds candidate matches for a board post by species, distance and a
  plausible date window.

---

## Credits

Built by [Tushar Surti](https://github.com/Tushar-Surti). Maps © OpenStreetMap contributors,
tiles © CARTO.

The [`legacy/`](legacy/) folder holds the original version of this project, written in 2022 as
a college mini-project in PHP and MySQL. It is kept in the repo on purpose.
