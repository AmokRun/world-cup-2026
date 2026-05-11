# World Cup 2026 Prediction Pool

A production-ready web application for managing FIFA World Cup 2026 score prediction pools between colleagues. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, and Firebase.

## Features

- **Authentication** — Email/password + Google OAuth login
- **Match schedule** — Full World Cup 2026 fixture list with live status
- **Predictions** — Submit exact score predictions; auto-locked at kickoff
- **Scoring** — Exact score = 5pts · Correct winner/draw = 3pts · Wrong = 0pts
- **Leaderboard** — Real-time global rankings with tie-breakers
- **Admin panel** — Manage matches, update results, trigger recalculation, manage users
- **Dark/light mode** — System-preference aware with manual toggle
- **Mobile-first UI** — Responsive across all screen sizes
- **Real-time updates** — Firestore listeners for live data

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Backend | Firebase Functions (Gen 2) |
| Hosting | Firebase Hosting (Next.js SSR) |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login & Register pages
│   │   ├── (dashboard)/          # Protected user pages
│   │   │   ├── matches/          # Match schedule with prediction inputs
│   │   │   ├── predictions/      # Personal predictions & stats
│   │   │   ├── rankings/         # Global leaderboard
│   │   │   └── profile/          # User profile management
│   │   └── admin/                # Admin-only pages
│   │       ├── matches/          # CRUD match management
│   │       ├── users/            # User & role management
│   │       └── settings/         # App configuration
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitive components
│   │   ├── layout/               # Navbar
│   │   ├── providers/            # AuthProvider, ThemeProvider
│   │   ├── matches/              # MatchCard, TeamDisplay
│   │   ├── predictions/          # PredictionInput
│   │   └── rankings/             # LeaderboardTable
│   └── lib/
│       ├── firebase/             # Firebase client config, auth helpers, Firestore queries
│       ├── hooks/                # useAuth, useMatches, usePredictions, useRankings
│       ├── types/                # Shared TypeScript types
│       └── utils/                # scoring, date formatting, cn
├── functions/src/                # Firebase Cloud Functions
│   ├── index.ts                  # Function entrypoints
│   ├── scoring.ts                # Score calculation logic
│   └── types.ts                  # Shared server-side types
├── scripts/
│   └── seed.ts                   # Firestore seed script (group stage fixtures)
├── firestore.rules               # Security rules
└── firestore.indexes.json        # Composite indexes
```

## Firestore Schema

### `users/{uid}`
```ts
{
  uid, email, displayName, photoURL, role: "admin"|"user",
  totalPoints, exactScores, correctWinners, wrongPredictions, predictionsCount,
  createdAt, updatedAt
}
```

### `matches/{matchId}`
```ts
{
  matchday, stage, group?, homeTeam, awayTeam, homeTeamFlag, awayTeamFlag,
  kickoffTime, venue, city, status: "scheduled"|"live"|"finished"|"cancelled",
  homeScore|null, awayScore|null,
  createdAt, updatedAt
}
```

### `predictions/{predictionId}`
```ts
{
  userId, matchId, homeScore, awayScore,
  isLocked, points|null, result: "exact"|"correct_winner"|"wrong"|null,
  createdAt, updatedAt
}
```

### `rankings/{userId}`
```ts
{
  userId, displayName, photoURL,
  totalPoints, exactScores, correctWinners, wrongPredictions, predictionsCount,
  rank, previousRank|null, lastUpdated
}
```

### `settings/global`
```ts
{
  notificationsEnabled, reminderHoursBeforeMatch, maxUsers,
  registrationOpen, currentMatchday, lastScoringRun|null
}
```

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore, Authentication, Functions, and Hosting enabled

### 2. Clone & install dependencies

```bash
git clone <repo-url>
cd world-cup-2026
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Firebase project credentials in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Enable Firebase Authentication providers

In the [Firebase Console](https://console.firebase.google.com):
1. Go to **Authentication → Sign-in methods**
2. Enable **Email/Password**
3. Enable **Google**

### 5. Deploy Firestore rules & indexes

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore
```

### 6. Seed initial data

```bash
# Set Firebase Admin credentials
export FIREBASE_PROJECT_ID=your-project-id
export FIREBASE_CLIENT_EMAIL=your-service-account@...
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Run seed script
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed.ts
```

### 7. Make yourself an admin

After registering your first account, open the Firebase Console → Firestore → `users/{your-uid}` and set `role` to `"admin"`.

### 8. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Firebase Hosting (recommended)

```bash
# Build Next.js app
npm run build

# Deploy everything
firebase deploy
```

### Deploy only Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## Cloud Functions

| Function | Trigger | Description |
|---|---|---|
| `lockPredictionsOnMatchStart` | Firestore write | Locks all predictions when match status → live/finished |
| `scoreMatchOnResult` | Firestore write | Scores predictions when match result is entered |
| `recalculateScores` | HTTP Callable | Admin-triggered full recalculation + rankings rebuild |
| `sendMatchReminders` | Scheduled (30 min) | Logs (or sends) reminders to users who haven't predicted |

---

## Scoring System

| Result | Points |
|---|---|
| Exact score (e.g. predicted 2-1, actual 2-1) | **5** |
| Correct winner or draw (e.g. predicted 1-0, actual 3-0) | **3** |
| Wrong prediction | **0** |

**Tie-breaker:** Higher exact score count wins.

---

## Security

- Firestore security rules enforce that:
  - Users can only read/write their own predictions
  - Predictions cannot be edited once locked (`isLocked == true`)
  - Score calculation fields (`points`, `result`) cannot be modified by clients
  - Admin-only operations (match CRUD, user role changes) require the `admin` role
- Server-side score calculation runs in Firebase Functions using the Admin SDK, bypassing client rules
- All inputs are validated with Zod schemas before submission

---

## Development

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Format
npm run format
```

---

## License

MIT
