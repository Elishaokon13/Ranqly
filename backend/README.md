# Ranqly Backend

Node.js/Express API for the Ranqly contest platform: auth (SIWE/JWT), contests, submissions, voting, judging, disputes, and admin. Uses PostgreSQL (Prisma) and Redis (Bull queues).

## Requirements

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (optional; for worker/queues)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set at least:

   ```bash
   cp .env.example .env
   # Edit .env:
   DATABASE_URL="postgresql://user:password@localhost:5432/ranqly?schema=public"
   PORT=4000
   JWT_SECRET="your-secret"
   ```

3. **Database**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run the API**

   ```bash
   npm run dev
   ```

   API base: `http://localhost:4000`. Health: `GET /health`.

## Docker

Run Postgres and Redis locally:

```bash
docker compose up -d postgres redis
```

Then use `DATABASE_URL=postgresql://ranqly:ranqly@localhost:5432/ranqly?schema=public` and run migrations and `npm run dev` on the host.

Run the full stack (Postgres + Redis + API):

```bash
docker compose up -d
```

The `api` service runs `prisma migrate deploy` then `node dist/app.js`. Build first or let Compose build the image.

## Worker

Bull worker for background jobs (e.g. contest scoring, notifications):

```bash
# Dev (ts-node-dev)
npm run worker

# Production (after npm run build)
npm run worker:start
```

Requires `REDIS_URL` (e.g. `redis://localhost:6379`). Queues: `contest-score`, `notify` (placeholder processors).

## Scripts

| Script            | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start API with hot reload      |
| `npm run build`   | Compile TypeScript to `dist/` |
| `npm start`       | Run API (production)           |
| `npm run worker`  | Run worker (dev)               |
| `npm run worker:start` | Run worker (production)  |
| `npm run prisma:generate` | Generate Prisma client   |
| `npm run prisma:migrate` | Run migrations (dev)     |

## API Overview

Base path: `/api`. Auth: `Authorization: Bearer <token>` or (dev) `X-User-Id: <cuid>`.

| Area       | Endpoints |
|-----------|-----------|
| **Auth**  | `POST /auth/nonce`, `POST /auth/siwe`, `GET /auth/me` |
| **Contests** | `GET /contests`, `GET /contests/:idOrSlug`, `POST /contests`, `PATCH /contests/:id` |
| **Submissions** | `GET|POST /contests/:contestId/submissions`, `GET .../submissions/:submissionId` |
| **Votes**  | `POST /contests/:contestId/votes` |
| **Judging** | `GET|POST /contests/:contestId/judges`, `GET .../judges/entries`, `POST .../judges/scores` |
| **Disputes** | `GET /disputes`, `PATCH /disputes/:id`, `POST /contests/:contestId/disputes` |
| **Me**     | `GET /me/submissions` |
| **Admin**  | `GET /admin/overview`, `GET /admin/contests`, `GET /admin/disputes` |

See route files under `src/routes/` for request/response shapes and validation (Zod).

## Project layout

```
backend/
├── prisma/
│   └── schema.prisma   # Models: User, Contest, Submission, Vote, JudgeAssignment, JudgeScore, Dispute
├── src/
│   ├── app.ts           # Express app, mounts routes
│   ├── worker.ts        # Bull worker entrypoint
│   ├── lib/
│   │   └── prisma.ts    # Prisma client singleton
│   ├── middleware/
│   │   └── auth.ts      # optionalAuth, requireAuth (JWT / X-User-Id)
│   └── routes/          # auth, contests, submissions, votes, judging, disputes, admin, me
├── docker-compose.yml   # Postgres, Redis, api
├── Dockerfile
├── .env.example
└── README.md (this file)
```

## License

Private — Ranqly.
