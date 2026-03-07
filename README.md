# Bito

[![Live App](https://img.shields.io/badge/Live-bito.works-7c3aed?style=for-the-badge)](https://bito.works)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> A full-stack AI-powered habit tracking platform with collaborative groups, rich journaling, and a Compass system that converts natural-language goals into structured, phase-based habit plans.

**[bito.works](https://bito.works)** — built by [Divine Eze](https://github.com/hayzaydee)

---

## What is Bito?

Bito is a habit tracking app built around the idea that habits don't exist in isolation — they come from goals, they evolve in phases, and they're stronger when shared. It combines AI planning, structured tracking, journaling, and group accountability into a single platform.

---

## Features

### Compass (AI Goal → Habit Engine)
Describe a goal in plain language. Bito's Compass system uses an LLM to generate a complete habit plan — structured phases, daily habits, milestones, and a refinement studio where you iterate on the plan through conversation before applying it to your dashboard. Supports multi-goal suites for complex life changes.

### Habit Tracking
Habits with categories, custom schedules, flexible targets, streak tracking, mood logging, and notes. Completion analytics with heatmaps and trend charts. Filter by source (personal, group, compass). Archive habits you've outgrown.

### Journaling
Rich-text journal powered by BlockNote with micro and longform entry types, inline image uploads via Cloudinary, habit threading, full-text search, and reusable templates.

### Groups (Collaborative Accountability)
Shared spaces for teams, families, or friends. Role-based access (owner / admin / member / viewer), token-based email invitations, activity feeds, member dashboards, and group-scoped habits that members adopt to their own trackers.

### Challenges & Encouragements
Launch challenges within a group — members join, track progress, and compete on leaderboards. Send peer-to-peer encouragements and kudos to keep each other accountable.

### AI Insights & Reports
Three-tier insight maturity system (seedling → sprouting → growing) enriched by the LLM. Sectioned analytics with completion charts, streak graphs, and an activity heatmap. AI-written weekly report emails.

### AI Personality System
Four-axis personality model (tone, focus, verbosity, accountability) shaped during onboarding or through a settings quiz. All AI-generated content — insights, reports, reminders, Compass plans — adapts to the user's chosen voice through a composable prompt architecture.

### Notifications
Web push via VAPID, email reminders via Resend, and cron-scheduled delivery with per-channel user preferences.

### Auth
Passwordless magic-link login and Google OAuth. JWT access tokens with refresh rotation.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS 4, Radix UI Themes, React Router 6, Recharts, BlockNote, Mantine, dnd-kit |
| **Backend** | Node.js, Express, Mongoose 8, Passport (JWT + Google OAuth), OpenAI SDK, Resend, web-push, Cloudinary, node-cron, express-validator |
| **Database** | MongoDB Atlas |
| **Hosting** | Vercel (frontend), Railway (backend) |

---

## Architecture

```
bito/
├── bito-frontend/
│   └── src/
│       ├── components/           # Shared + feature UI components
│       ├── contexts/             # Auth, Habit, Theme, Notification, Scale
│       ├── features/             # Feature modules (analytics, dashboard)
│       ├── hooks/                # Custom React hooks
│       ├── pages/                # Route-level pages
│       ├── services/             # Centralized API layer
│       └── utils/                # Helpers & utilities
│
├── bito-backend/
│   ├── config/                   # Cloudinary, Passport strategies
│   ├── controllers/              # Route controllers
│   ├── middleware/                # Auth, validation, error handling
│   ├── models/                   # Mongoose schemas (15 models)
│   ├── prompts/                  # AI prompt architecture (base + directives)
│   ├── routes/                   # Express route definitions (13 files)
│   ├── services/                 # Business logic, AI services, emails
│   └── server.js                 # Entry point, cron, middleware
│
└── docs/                         # Specs, plans, architecture docs
```

### Key Design Decisions

- **Composable AI prompts** — Base system prompt + personality directives + context injections, tested via a prompt regression suite
- **Unified habit model** — Personal habits, compass-generated habits, and group-adopted habits all live in one `Habit` collection with a `source` discriminator, avoiding model sprawl
- **Phase-aware Compass** — Goal plans aren't flat lists; they're organized into sequential phases with milestones, supporting long-term goals that evolve over weeks or months
- **Centralized API layer** — All frontend-backend communication goes through a single `api.js` service with consistent error handling and auth token management

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))

### Backend

```bash
cd bito-backend
npm install
cp .env.example .env   # Fill in your keys
npm run dev             # Starts on :5000
```

### Frontend

```bash
cd bito-frontend
npm install
cp .env.example .env.local   # Set VITE_API_URL
npm run dev                   # Starts on :5173
```

### Scripts

| Directory | Command | Description |
|---|---|---|
| Frontend | `npm run dev` | Dev server with HMR |
| Frontend | `npm run build` | Production build |
| Frontend | `npm run lint` | ESLint |
| Backend | `npm run dev` | Dev server with nodemon |
| Backend | `npm start` | Production server |
| Backend | `npm test` | Jest + Supertest suite |

---

## Design

Deep purple/blue palette with **EB Garamond** for headings and **League Spartan** for body text. Built on Radix UI Themes with TailwindCSS utilities, supporting light and dark modes.

---

## Testing

```bash
cd bito-backend
npm test
```

**Jest** and **Supertest** for API testing. A prompt regression testing suite in `bito-backend/prompts/testing/` verifies AI output quality across personality and scenario combinations.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">Built by <a href="https://github.com/hayzaydee">Divine Eze</a></p>
