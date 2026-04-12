# CISOLens — vCISO Command Center

> Manage every client's compliance from one place. Deliver boardroom reports in minutes.

Built for security consultants and vCISOs who manage multiple client organisations simultaneously.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Routing | React Router v6 |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Auth | HttpOnly JWT + refresh token rotation |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/cisolens.git
cd cisolens

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in JWT secrets (see below)
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 3. Set up database

```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### 5. Login

```
URL:      http://localhost:5173
Email:    khaled@cisolens.io
Password: Demo1234!
```

---

## Project Structure

```
cisolens/
├── SPEC.md              ← Full technical specification
├── backend/
│   ├── prisma/          ← Schema + migrations + seed
│   └── src/
│       ├── routes/      ← auth, clients, frameworks, assessments, actions
│       ├── middleware/  ← JWT auth guard
│       ├── services/    ← scoring engine
│       └── lib/         ← prisma client, jwt helpers
└── frontend/
    └── src/
        ├── pages/       ← Login, Dashboard, Clients, ClientDetail, Assessment, Results, Actions
        ├── components/  ← Layout, Sidebar, ScoreBar, Pill, Card
        ├── hooks/       ← TanStack Query hooks per resource
        ├── store/       ← Zustand auth store
        ├── lib/         ← Axios instance, utils
        └── types/       ← Shared TypeScript interfaces
```

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id

GET    /api/frameworks
GET    /api/frameworks/:id/questions

POST   /api/assessments
GET    /api/assessments?clientOrgId=
GET    /api/assessments/:id
POST   /api/assessments/:id/answer
POST   /api/assessments/:id/complete

GET    /api/actions?clientOrgId=
POST   /api/actions
PATCH  /api/actions/:id
PATCH  /api/actions/:id/status
DELETE /api/actions/:id
```

---

## Roadmap

- **Phase 1** ✅ Core auth, client management, NIST CSF assessment, scoring, actions kanban
- **Phase 2** — Claude AI integration for narrative scoring + executive summaries
- **Phase 3** — Network scanner (NMAP) with framework control mapping
- **Phase 4** — PDF report generation, CSV export, email delivery
- **Phase 5** — REST API keys, webhooks, Jira/ServiceNow sync

---

## Security

- HttpOnly cookies — no token in localStorage
- Refresh token rotation — single use
- bcrypt 12 rounds
- Zod validation on all inputs
- helmet + CORS + rate limiting
- All DB queries scoped to authenticated vCISO

---

## License

Private — All rights reserved © 2025
