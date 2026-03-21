# Deployment Guide — Alpha Scanner

## Prerequisites

- Node.js 18+
- npm 9+
- Git

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/naimkatiman/alpha-scanner.git
cd alpha-scanner

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# 5. Start the dev server
npm run dev
```

Open http://localhost:3000.

---

## Docker

### Prerequisites

- Docker 24+
- Docker Compose v2 (`docker compose` command)

### Quick start

```bash
# 1. Clone the repo
git clone https://github.com/naimkatiman/alpha-scanner.git
cd alpha-scanner

# 2. (Optional) Set a strong secret
cp .env.example .env
# Edit .env and set NEXTAUTH_SECRET to a random string

# 3. Build and start
docker compose up -d

# 4. Run database migrations
docker compose exec app npx prisma migrate deploy

# App running at http://localhost:3000
# Health endpoint: http://localhost:3000/api/health
```

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `app` | Built from `Dockerfile` | 3000 | Next.js application |
| `db` | `postgres:16-alpine` | internal | PostgreSQL database |

### Environment variables (docker-compose.yml defaults)

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://alpha:alpha@db:5432/alpha` | Points to the `db` service |
| `NEXTAUTH_SECRET` | `change-me-in-production` | **Change this before exposing publicly** |
| `NEXTAUTH_URL` | `http://localhost:3000` | Update to your public URL if deployed remotely |

Override by setting variables in a `.env` file or with `-e` flags.

### Database persistence

PostgreSQL data is stored in the `postgres_data` Docker volume and survives container restarts. To reset:

```bash
docker compose down -v  # removes the volume
```

### Stopping and updating

```bash
# Stop
docker compose down

# Pull latest code and rebuild
git pull
docker compose build --no-cache
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

### Image size

The multi-stage Dockerfile produces a `<200 MB` production image using Next.js standalone output. Only the compiled app and its runtime dependencies are included — `node_modules` and build-time tooling are discarded.

---

## Deploy to Vercel

### Step 1 — Import the repository

1. Go to https://vercel.com/new
2. Click **Import Git Repository** and select `naimkatiman/alpha-scanner`
3. Vercel auto-detects Next.js — leave framework preset as **Next.js**

### Step 2 — Set environment variables

In the Vercel project settings under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:./prisma/dev.db` (see note below) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `NEXTAUTH_URL` | Your Vercel deployment URL, e.g. `https://alpha-scanner.vercel.app` |
| `CRON_SECRET` | Random string for cron job protection |
| `OPENAI_API_KEY` | Optional — enables AI signal commentary |
| `META_API_TOKEN` | Optional — MetaApi broker integration |
| `META_API_ACCOUNT_ID` | Optional — MetaApi account ID |

> **SQLite on Vercel**: Vercel's filesystem is ephemeral. For persistent data use a hosted SQLite service (e.g. Turso) or migrate to PostgreSQL (Neon, Supabase). See [Database Notes](#database-notes) below.

### Step 3 — Configure build settings

The `vercel.json` in the repo already sets the correct build command:

```
npx prisma generate && npm run build
```

No additional configuration needed.

### Step 4 — Deploy

Click **Deploy**. Subsequent pushes to `main` trigger automatic redeployments.

---

## Deploy to Railway

### Step 1 — Create a new project

1. Go to https://railway.com
2. Click **New Project → Deploy from GitHub repo**
3. Select `naimkatiman/alpha-scanner`

### Step 2 — Set environment variables

In the Railway service settings under **Variables**, add the same variables as above. For `DATABASE_URL`, Railway supports persistent volumes — mount one at `/app/prisma` and set:

```
DATABASE_URL=file:/app/prisma/dev.db
```

### Step 3 — Build and deploy

The `railway.toml` already configures:

- Build: `npx prisma generate && npm run build`
- Start: `npm start`

Railway will build and deploy automatically on every push to `main`.

### Step 4 — Set the public domain

In Railway, go to **Settings → Networking → Generate Domain** and update `NEXTAUTH_URL` to match.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./prisma/dev.db` | Prisma database connection string |
| `NEXTAUTH_SECRET` | Yes | — | JWT signing secret. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Canonical URL of the deployment |
| `CRON_SECRET` | Recommended | `dev-cron-secret` | Protects `/api/accuracy/check` cron endpoint |
| `OPENAI_API_KEY` | No | — | Enables AI-generated signal commentary |
| `META_API_TOKEN` | No | — | MetaApi broker integration token |
| `META_API_ACCOUNT_ID` | No | — | MetaApi account ID |

---

## Database Notes

### SQLite (default)

SQLite is configured out of the box for local development. It works on Railway with a persistent volume but **does not persist on Vercel** (ephemeral filesystem).

### Migrating to PostgreSQL

1. Update `prisma/schema.prisma` datasource provider to `postgresql`
2. Set `DATABASE_URL` to your PostgreSQL connection string (Neon, Supabase, Railway Postgres)
3. Run `npx prisma migrate deploy` after deploying

### Running migrations in production

```bash
npx prisma migrate deploy
```

Run this as part of your release process or add it to the build command:

```
npx prisma generate && npx prisma migrate deploy && npm run build
```

---

## Troubleshooting

**Build fails with "Prisma Client not generated"**
- Ensure the build command starts with `npx prisma generate`
- Check that `prisma` is listed in `dependencies` (not `devDependencies`)

**`NEXTAUTH_URL` mismatch errors**
- Set `NEXTAUTH_URL` exactly to your deployment URL including protocol and no trailing slash

**SQLite "database file not found" on Vercel**
- Vercel's filesystem is read-only at runtime. Use a hosted database (see [Database Notes](#database-notes))

**OpenAI commentary not appearing**
- Check `OPENAI_API_KEY` is set and valid
- Commentary is optional — signals still work without it
