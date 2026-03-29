# 🏆 Ranqly Frontend – The Fair Content Layer for Web3

> Next.js frontend for Ranqly’s hybrid scoring contest platform, implementing the complete UX flows for creators, voters, judges, organizers, admins, and guests.

Ranqly helps Web3 projects run **fair, transparent content contests**. It combines on‑chain primitives (PoI NFTs, escrow vaults) with a rich product surface for browsing contests, submitting entries, voting, judging, and managing disputes.

This repo contains the **full production‑ready frontend** that matches the design/UX specs:

- `Ranqly Frontend Specification Complete.pdf`
- `ranqly complete ux flows.pdf`
- `ranqly complete ui system` (screens and components)

---

## ✨ Product Overview

Ranqly provides:

- **Hybrid Scoring** – Final score = 40% algorithmic + 30% community + 30% judges.
- **PoI NFT Voting** – One wallet = one voting pass; up to 5 upvotes and 2 downvotes per contest with required justifications and reason codes.
- **Anonymous Judging** – Expert judges get dedicated dashboards and a focused judging interface.
- **Organizer Tools** – Organizer verification, 5‑step contest creation wizard, manage‑contest dashboards, judge invitation links, and dispute handling.
- **Admin Console** – Views for verification queues, dispute triage, moderation, algorithm tuning, system logs, and support tools.
- **Creator Dashboards** – Submissions, analytics, earnings, and reputation views for content creators.

The UI is implemented in accordance with the design system (colors, typography, spacing, animations) and UX flows, **without changing the approved visual design**.

---

## 🧱 Frontend Architecture

**Framework & libraries**

- **Next.js 16 (App Router)**
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (design tokens + utility classes)
- **Framer Motion** (hero/carousel, page transitions, micro‑interactions)
- **Radix UI** primitives (modals, tabs, selects, tooltips)
- **react‑hook‑form + Zod** (forms & validation)
- **lucide‑react** (icon set)

**Key directories**

```bash
src/
  app/
    page.tsx                 # Landing (hero, 3D cards, stats)
    waitlist/                # Pre‑launch capture
    explore/                 # Contest discovery (filters, search)
    contest/[id]/            # Contest detail, sidebar CTAs, tabs
    contest/[id]/submit/     # 3‑step submission flow
    contest/[id]/submission/ # Submission detail view
    contest/[id]/judge/      # Judging interface
    contest/[id]/manage/     # Organizer manage contest
    contest/[id]/manage/judges/ # Manage judges dashboard
    dashboard/               # Creator dashboard (tabs)
    judge/                   # Judge dashboard
    admin/                   # Admin dashboard & tools
    disputes/                # Dispute list
    leaderboard/             # Global/contest leaderboards
    help/                    # Help center
    pricing/                 # Organizer pricing & calculator
    profile-setup/           # Creator profile setup
    settings/                # Account & notification settings
    signin/, signup/         # Auth screens
    transparency/            # Audit & transparency page
    (placeholder)/           # Legal & marketing shells (blog, docs, api, etc.)
  components/
    layout/                  # Navbar, Footer, logo
    ui/                      # Buttons, cards, inputs, modals, tabs, etc.
    auth/                    # AuthForm, RequireAuth
    onboarding/              # 4‑step onboarding modal
    contest/                 # ContestCard, LeaderboardPanel, VotingPanel
    wallet/                  # ConnectWalletModal, SignInModal
  contexts/
    AuthContext.tsx          # Client‑side auth state (email/social/wallet)
  lib/
    contest-types.ts         # Shared TypeScript types + phase/category labels
    api.ts                   # API client (contests, me, submissions, disputes, …)
    scoring.ts               # Deterministic display scores for leaderboard UI
    utils.ts                 # `cn` helper for className merging
```

All routes are App Router pages (`src/app/...`), using server components where possible and client components for interactive areas.

---

## 🔁 Implemented UX Flows

The frontend covers all flows described in `ranqly complete ux flows.pdf`:

- **Creator**
  - Browse → Contest detail → 3‑step “Submit Entry” (form → review → sign + success).
  - My submissions, submission detail, dashboard overview, analytics, earnings, reputation.
- **Voter**
  - PoI‑gated voting with:
    - 5 upvotes & 2 downvotes per contest.
    - Required justification (min 10 chars) and reason codes U1–U4 / D1–D4.
  - Voting eligibility banners + PoI minting modal (UI, with mocked mint flow).
- **Judge**
  - Judge dashboard with assignments and progress.
  - `/contest/[id]/judge` entry‑by‑entry judging interface.
  - “Manage judges” organizer dashboard with:
    - Shareable judge link (`/contest/[id]/judge` with redirect after sign‑in).
    - Email invite form and judge list with status/progress.
- **Organizer**
  - Organizer verification wizard with document upload step and review screen.
  - Organizer dashboard with quick stats and “Create new contest”.
  - 5‑step contest creation wizard: Basics → Prize & distribution → Timeline → Scoring → Judges & rules.
  - Contest manage view (settings, submissions & judges, manage judges).
- **Admin**
  - Admin dashboard tabs:
    - Overview, Organizer verification, Disputes, Moderation, Algorithm tuning, System logs, User support.
  - Each tab has structured UI for its queue and actions (currently backed by mocked data).
- **Guest**
  - Full guest exploration of contests with disabled CTAs showing sign‑in/tooltips.
  - Sign‑in/sign‑up flows that always redirect back to the original action (submit, vote, judge, etc.).

---

## 🧩 Design System & Animations

**Design tokens**

- Primary: `#6874E8` (Ranqly Blue)
- Accent: `#00D9A3`
- Backgrounds: `#0A0A0F` / `#131318` / `#1C1C23`
- Typography:
  - Display: **Clash Display**
  - Body: **Satoshi**
  - Mono: **JetBrains Mono**

**Motion**

- Default UI transitions: 150–250ms with smooth easing.
- Page/section transitions: fade/slide up (Framer Motion) at ~250–350ms.
- Hero carousel: continuous linear scroll, looping using `useMotionValue` + `animate`.
- Buttons/cards: hover translateY/scale + glow shadows (glassmorphic feel).
- Modals: backdrop fade + content scale‑in.

All of this is configured in `globals.css`, the shared `HeroBackground`, `TiltCard`, `CountUp`, and the motion wrappers in top‑level pages.

---

## 🛠️ Getting Started

> Requires Node.js 18+ and npm (or pnpm).

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Lint
npm run lint

# Build for production
npm run build
npm run start
```

### Environment variables

The current implementation uses **mock data** and does not require backend URLs to run. When wiring to a real backend, you’ll typically provide:

- `NEXT_PUBLIC_API_BASE_URL` – base URL for the Ranqly API gateway.
- Web3 config like `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL` when RainbowKit/wagmi are added.

---

## 🗄️ Data & backend

- **Database:** Contest and related data are stored in PostgreSQL via Prisma (`backend/`). Run migrations and seed with `cd backend && npx prisma migrate deploy && npm run db:seed`.
- **Frontend:** Lists and detail pages load from the unified API (`GET /api/contests`, `/api/me/submissions`, etc.) via `src/lib/api.ts`. Types live in `src/lib/contest-types.ts`.
- **Auth:** Wallet SIWE issues a JWT; the client stores it and sends `Authorization: Bearer` on API calls.

---

## 📦 Scripts

Common scripts (see `package.json`):

- `dev` – Start Next.js dev server.
- `build` – Build the app for production.
- `start` – Start the production server.
- `lint` – Run eslint on the project.

---

## 🗺️ Roadmap (Frontend)

- Integrate real backend APIs for contests, submissions, and dashboards.
- Hook up wallet connection (RainbowKit + wagmi + PoI NFT minting).
- Implement full notification center (bell icon, unread counts, in‑app feed).
- Add richer charts (Recharts) to match analytics & reputation specs exactly.
- Add dedicated “voter dashboard” and “organizer analytics” screens once backend data is available.

---

## 🤝 Contributing

1. Fork this repo.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make changes and add tests where appropriate.
4. Run `npm run lint` and `npm run build`.
5. Open a pull request with a clear description and links to any relevant spec sections.

---

## 📝 License

This frontend is part of the wider **Ranqly** project and is licensed under MIT (see the root `LICENSE` file).

Built with ❤️ for the Web3 creator ecosystem.
