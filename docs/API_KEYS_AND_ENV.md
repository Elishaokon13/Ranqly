# API Keys & Environment Variables

What you need to make Ranqly functional (sign-in, data, workers).

---

## How to get each value

### JWT_SECRET (required for sign-in)

**No signup.** Generate a random string on your machine:

```bash
# Option 1: OpenSSL (Mac/Linux, or Git Bash on Windows)
openssl rand -base64 32

# Option 2: Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output into `backend/.env` as `JWT_SECRET=that_string`.

---

### DATABASE_URL (required for real data)

You need a PostgreSQL database. Pick one:

**Option A — Docker (easiest, no signup)**  
From the project root:

```bash
cd backend
docker compose up -d postgres
```

Then in `backend/.env` use:

```env
DATABASE_URL="postgresql://ranqly:ranqly@localhost:5432/ranqly?schema=public"
```

(Matches the user/password/db in `backend/docker-compose.yml`.)

**Option B — Free hosted Postgres (no local Docker)**  
1. Sign up at [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app).
2. Create a new project and a Postgres database.
3. Copy the connection string they give you (usually starts with `postgresql://...`).
4. Paste it into `backend/.env` as `DATABASE_URL="..."`.
5. If the URL has no `?schema=public`, add it: `...?schema=public`.

**Option C — PostgreSQL installed locally**  
If you already installed Postgres (e.g. via Postgres.app or Homebrew), create a database and user, then:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/ranqly?schema=public"
```

---

### NEXT_PUBLIC_API_URL (frontend → backend)

**No signup.** This is just the URL where your backend runs:

- **Local:** When you run the backend with `npm run dev` in `backend/`, it’s usually `http://localhost:4000`.
- **Deployed:** Use your backend’s public URL (e.g. `https://api.ranqly.xyz`).

In the project root, create or edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### REDIS_URL (optional — only for the worker)

Only needed if you run the background worker (`npm run worker` in `backend/`).

**Option A — Docker**

```bash
cd backend
docker compose up -d redis
```

Then in `backend/.env`:

```env
REDIS_URL=redis://localhost:6379
```

**Option B — Free hosted Redis**  
Sign up at [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com/try-free/), create a Redis database, and copy the connection URL into `REDIS_URL`.

---

### Google / X / Email (optional — for real social or email sign-in)

Right now sign-in is **mock**. If you later add real providers:

| What        | Where to get it |
|------------|------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application). You get a Client ID and Client Secret. |
| **X (Twitter)** | [Twitter Developer Portal](https://developer.twitter.com/) → Project → your App → Settings → User authentication → OAuth 2.0 Client ID and Client Secret. |
| **Email (e.g. magic link)** | [Resend](https://resend.com) or [SendGrid](https://sendgrid.com): sign up, create an API key, add it as `RESEND_API_KEY` or `SENDGRID_API_KEY` in backend env. |

You don’t need any of these to run the app or use wallet-based auth.

---

## Backend (`backend/`)

Create `backend/.env` (copy from `backend/.env.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| **DATABASE_URL** | **Yes** (for real data) | PostgreSQL connection string. Example: `postgresql://user:password@localhost:5432/ranqly?schema=public`. Without this, the API will fail on any route that uses the database. |
| **JWT_SECRET** | **Yes** (for auth) | Secret used to sign and verify JWT tokens. Use a long random string in production (e.g. `openssl rand -base64 32`). Default in code is a dev-only fallback. |
| **PORT** | No | Server port. Default: `4000`. |
| **CORS_ORIGIN** | No | Allowed frontend origins, comma-separated. Default: `http://localhost:3000,http://localhost:3001`. |
| **REDIS_URL** | No | Redis connection for Bull queues (worker). Example: `redis://localhost:6379`. Omit if you don’t run the worker. |
| **SIWE_DOMAIN** | No | Domain used for Sign-In with Ethereum (e.g. `localhost` or `ranqly.xyz`). Only needed when you enable real SIWE verification on the backend. |

**Summary:** For a minimal functional setup (API + DB + auth), set **DATABASE_URL** and **JWT_SECRET** in `backend/.env`. Run migrations with `npx prisma migrate dev` in `backend/`.

---

## Frontend (root)

Create `.env.local` (copy from `.env.local.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| **NEXT_PUBLIC_API_URL** | No (but needed for API) | Backend base URL (e.g. `http://localhost:4000`). If unset, the app uses mock data only and does not call the backend. |

**Summary:** Set **NEXT_PUBLIC_API_URL** to your backend URL so the app uses the real API (contests, submissions, etc.).

---

## Sign-in and auth (what’s implemented today)

- **Wallet (SIWE)**  
  - Backend: **JWT_SECRET** is required to issue tokens.  
  - No API key. Backend has a *dev* path that accepts `walletAddress` in the body and issues a JWT; for production you’d verify the SIWE message/signature (e.g. with the `siwe` package) and use **SIWE_DOMAIN** for the message domain.  
  - Frontend: Auth is currently **mock** (no real wallet connect). To make it real you’d add RainbowKit/wagmi, call `POST /api/auth/nonce`, sign the message in the wallet, then `POST /api/auth/siwe` with `message` + `signature` (and stop sending raw `walletAddress` in production).

- **Google / X (Twitter)**  
  - Currently **mock** (simulated success after a delay).  
  - To make them real you’d need:
    - **Google:** OAuth 2.0 Client ID (frontend) and Client Secret (backend), from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
    - **X (Twitter):** OAuth 2.0 Client ID and Client Secret (and possibly API key/secret for older flows) from [Twitter Developer Portal](https://developer.twitter.com/).

- **Email (magic link)**  
  - Currently **mock** (no email sent).  
  - To make it real you’d need an **email-sending API key** from a provider such as:
    - [Resend](https://resend.com) – `RESEND_API_KEY`
    - [SendGrid](https://sendgrid.com) – `SENDGRID_API_KEY`
    - Or another SMTP/API provider.

- **WalletConnect (for in-app wallet connection)**  
  - Not implemented. If you add RainbowKit/wagmi and WalletConnect, you’d need a **WalletConnect Project ID** from [WalletConnect Cloud](https://cloud.walletconnect.com/).

---

## Quick checklist for “functional” setup

1. **Backend**
   - [ ] `backend/.env` with **DATABASE_URL** (Postgres) and **JWT_SECRET**.
   - [ ] Postgres running (e.g. `docker compose up -d postgres` in `backend/`).
   - [ ] `npx prisma migrate dev` in `backend/`.
   - [ ] Start API: `npm run dev` in `backend/`.

2. **Frontend**
   - [ ] `.env.local` with **NEXT_PUBLIC_API_URL** pointing at the backend (e.g. `http://localhost:4000`).
   - [ ] Start app: `npm run dev` in project root.

3. **Sign-in**
   - Works today in **dev** with backend “wallet” flow (e.g. call `POST /api/auth/siwe` with body `{ "walletAddress": "0x...", "message", "signature" }`; backend can accept wallet for dev).
   - For **production** wallet sign-in: implement real SIWE verification on backend and real wallet connection (e.g. RainbowKit) on frontend; no extra API keys beyond **JWT_SECRET** and **SIWE_DOMAIN**.
   - For **Google/X/Email**: add OAuth and email provider and set the corresponding API keys/secrets as listed above.

---

## No API keys required for

- Running the backend with mock or local data (if you still use the dev JWT fallback).
- Running the frontend with mock data (**NEXT_PUBLIC_API_URL** empty).
- SIWE/JWT auth itself (only **JWT_SECRET** and, for production, **SIWE_DOMAIN**; no third-party key).
- Contests, submissions, voting, judging, disputes APIs (once DB and JWT are set).

**Optional:** Redis + **REDIS_URL** only if you run the background worker (`npm run worker` in `backend/`).
