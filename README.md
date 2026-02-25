# Bito

[![Web App](https://img.shields.io/badge/Web_App-bito.works-7c3aed?style=for-the-badge)](https://bito.works)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> AI-powered habit tracking with collaborative workspaces, rich journaling, and a Transformers system that converts natural-language goals into personalized habit plans.

**[bito.works](https://bito.works)**

---

## Features

### AI Transformers
Describe a goal in plain language and Bito generates a complete habit system — structured phases, daily habits, and milestones. Refine iteratively with AI, advance through phases as you progress, and apply the plan to create trackable habits automatically.

### Habit Tracking
Create habits with categories, schedules, and targets. Track daily or weekly with streaks, completion stats, mood, and notes. Archive habits you've outgrown.

### Journaling
Rich-text journaling powered by BlockNote with micro and longform entry types, inline image uploads via Cloudinary, habit threading, full-text search, and reusable templates.

### Collaborative Workspaces
Create shared spaces for teams, families, or friends. Role-based access (owner / admin / member / viewer), token-based invitations, activity feeds, member dashboards, and workspace-scoped habits that members can adopt.

### Challenges & Encouragements
Launch challenges within a workspace — members join, track progress, and compete on leaderboards. Send peer-to-peer encouragements and kudos to keep each other accountable.

### AI Insights & Reports
A three-tier insight maturity system (seedling → sprouting → growing) enriched by the LLM. Sectioned analytics reports with completion charts, streak graphs, and an activity heatmap. AI-written weekly report emails delivered via Resend.

### AI Personality System
Four-axis personality model (tone, focus, verbosity, accountability) shaped during onboarding or through a settings quiz. All AI-generated content — insights, reports, reminders — adapts to the user's chosen voice through a composable prompt architecture.

### Notifications & Reminders
Web push notifications via VAPID, email reminders via Resend, and cron-scheduled delivery. Users control notification preferences per channel.

### Authentication
Passwordless magic-link login and Google OAuth. JWT access tokens with refresh rotation.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS 4, Radix UI Themes, React Router 6, Recharts, BlockNote, Mantine, dnd-kit |
| **Backend** | Node.js, Express, Mongoose 8, Passport (JWT + Google OAuth), OpenAI SDK, Resend, web-push, Cloudinary, node-cron, express-validator |
| **Database** | MongoDB Atlas |
| **Infrastructure** | Vercel (frontend), Railway (backend) |
| **Domain** | [bito.works](https://bito.works) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB (local instance or [Atlas](https://www.mongodb.com/atlas))

### Clone

```bash
git clone https://github.com/yourusername/bito.git
cd bito
```

### Backend

```bash
cd bito-backend
npm install
```

Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bito-dev
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your-openai-api-key
```

Optional variables for full functionality:

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` | Email delivery (magic links, weekly reports) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push notifications |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads |

```bash
npm run dev          # Starts on :5000 with nodemon
```

### Frontend

```bash
cd bito-frontend
npm install
```

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev          # Starts on :5173 with Vite HMR
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

## Project Structure

```
bito/
├── bito-frontend/
│   └── src/
│       ├── components/           # Shared UI components
│       ├── contexts/             # Auth, Habit, Theme, Notification, Scale
│       ├── features/             # Feature modules (analytics, dashboard, etc.)
│       ├── hooks/                # Custom React hooks
│       ├── pages/                # Route-level pages
│       ├── services/             # API service layer
│       └── utils/                # Helpers
│
├── bito-backend/
│   ├── config/                   # Cloudinary, Passport config
│   ├── controllers/              # Route controllers
│   ├── middleware/                # Auth, validation, error handling
│   ├── models/                   # Mongoose schemas (15 models)
│   ├── prompts/                  # AI prompt architecture (base + directives)
│   ├── routes/                   # Express route definitions (13 route files)
│   ├── services/                 # Business logic & AI services
│   └── server.js                 # Entry point, cron jobs, middleware
│
└── docs/                         # Specs, plans, and architecture docs
```

---

## Design

Bito uses a deep purple/blue color palette with **EB Garamond** for headings and **League Spartan** for body text. The UI is built on Radix UI Themes with TailwindCSS utility classes, optimized for both light and dark modes.

---

## Testing

```bash
cd bito-backend
npm test
```

Uses **Jest** and **Supertest** for API testing. A separate prompt regression testing suite lives in `bito-backend/prompts/testing/` for verifying AI output quality across personality and scenario combinations.

---

## License

MIT — see [LICENSE](LICENSE).
