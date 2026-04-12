# CISOLens — Technical Specification & Development Bible
> vCISO Command Center | GRC Compliance Platform
> Version 1.0 | Author: Khaled | Stack: React 19 + TypeScript + Vite + Node/Express + Prisma + SQLite

---

## 1. Vision & Positioning

**One-line pitch:**
> "The GRC platform built for vCISOs and security consultants — manage every client's compliance from one place, deliver boardroom reports in minutes."

**Target user:** Security consultants and vCISOs managing 3–20 client organisations simultaneously.
**Not:** A self-service tool for end-clients (that's ShieldIQ's market).

**Core differentiators over ShieldIQ:**
- Multi-client vCISO management layer (ShieldIQ has none)
- Control-level assessments mapped to real control IDs (not just categories)
- AI scoring with per-domain reasoning visible to assessor
- HttpOnly JWT auth (ShieldIQ uses localStorage — an XSS vulnerability)
- Scanner findings auto-linked to framework controls
- Full audit evidence workflow (submit → review → accept/reject)
- Docker-deployable for regulated-sector clients

---

## 2. Role Hierarchy

```
PLATFORM_ADMIN
  └── VCISO (manages N client orgs)
        └── CLIENT_ADMIN (admin within one org)
              └── CLIENT_USER (read + self-answer within one org)
```

**Access rules:**
- VCISO can only see their own client orgs
- CLIENT_* can only see their own org's data
- PLATFORM_ADMIN sees everything
- Every DB query must be scoped to the authenticated user's context

---

## 3. Tech Stack

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20+ | Same as Riscover |
| Framework | Express 4 + TypeScript | Familiar, lightweight |
| ORM | Prisma 5 | Type-safe, great migrations |
| DB | SQLite (dev) → PostgreSQL (prod) | Easy local dev, scale later |
| Auth | HttpOnly JWT + refresh token rotation | Secure, no XSS risk |
| Validation | Zod | Runtime type safety on API boundaries |
| Password | bcryptjs (12 rounds) | Industry standard |
| Security | helmet + cors + express-rate-limit | Baseline hardening |
| PDF | Puppeteer + Handlebars | Same as Riscover |

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 5 |
| Routing | React Router v6 |
| State | Zustand (global auth/ui) + TanStack Query (server state) |
| Charts | Recharts (radar, bar) |
| Styling | CSS Modules + CSS variables (no Tailwind — full design control) |
| HTTP | Axios with interceptors (auto token refresh) |
| Forms | React Hook Form + Zod resolver |

---

## 4. Project Structure

```
cisolens/
├── SPEC.md                          ← this file
├── README.md
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma            ← full data model
│   │   ├── seed.ts                  ← frameworks + demo data
│   │   └── migrations/
│   └── src/
│       ├── index.ts                 ← Express app entry
│       ├── lib/
│       │   ├── prisma.ts            ← singleton client
│       │   └── jwt.ts               ← sign/verify tokens
│       ├── middleware/
│       │   └── auth.ts              ← requireAuth, requireRole
│       ├── routes/
│       │   ├── auth.ts              ← register/login/refresh/logout/me
│       │   ├── clients.ts           ← client org CRUD
│       │   ├── frameworks.ts        ← list frameworks + questions
│       │   ├── assessments.ts       ← start/answer/complete/score
│       │   ├── actions.ts           ← remediation CRUD + status
│       │   └── evidence.ts          ← upload/list/review
│       └── services/
│           ├── scoring.ts           ← maturity score calculator
│           └── ai.ts                ← Claude API integration (Phase 2)
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── router.tsx               ← route definitions
        ├── types/
        │   └── index.ts             ← all shared TypeScript types
        ├── lib/
        │   ├── api.ts               ← Axios instance + interceptors
        │   └── utils.ts             ← score colors, formatting
        ├── store/
        │   └── auth.ts              ← Zustand auth store
        ├── hooks/
        │   ├── useClients.ts        ← TanStack Query hooks
        │   ├── useAssessments.ts
        │   └── useActions.ts
        ├── components/
        │   ├── Layout.tsx           ← sidebar + main wrapper
        │   ├── Sidebar.tsx
        │   ├── ScoreBar.tsx         ← reusable score display
        │   ├── Pill.tsx             ← status/risk badges
        │   ├── Modal.tsx            ← generic modal wrapper
        │   └── RadarChart.tsx       ← recharts wrapper
        └── pages/
            ├── Login.tsx
            ├── Dashboard.tsx        ← command center overview
            ├── Clients.tsx          ← client grid
            ├── ClientDetail.tsx     ← single client view
            ├── Assessment.tsx       ← questionnaire flow
            ├── Results.tsx          ← scores + recommendations
            └── Actions.tsx          ← remediation kanban
```

---

## 5. Database Schema — Key Decisions

### Multi-tenancy pattern
Every resource table has `clientOrgId` FK. Every query is filtered by:
- `vcisoId` (for ClientOrg queries)
- `clientOrgId` (for everything inside an org)

This ensures a vCISO can never see another vCISO's client data.

### Assessment scoring model
- Answer values: 0 (none) → 1 (initial) → 2 (partial) → 3 (full)
- Domain score = (sum of answers / max possible) × 100
- Overall score = average of all domain scores
- Stored in `DomainScore` table per assessment (not recomputed)

### Action priority matrix
```
Priority = f(effort, impact)
LOW effort + HIGH impact = Priority 1 (Fix First)
LOW effort + MED impact  = Priority 2
MED effort + HIGH impact = Priority 2
HIGH effort + HIGH impact = Priority 3
...
```

---

## 6. API Contract

### Auth
```
POST   /api/auth/register      → 201 { user }
POST   /api/auth/login         → 200 { user }
POST   /api/auth/refresh       → 200 { ok }
POST   /api/auth/logout        → 200 { ok }
GET    /api/auth/me            → 200 { user }
```

### Clients
```
GET    /api/clients            → 200 { orgs[] }
POST   /api/clients            → 201 { org }
GET    /api/clients/:id        → 200 { org }
PATCH  /api/clients/:id        → 200 { org }
DELETE /api/clients/:id        → 200 { ok }  (soft delete)
```

### Frameworks
```
GET    /api/frameworks                    → 200 { frameworks[] }
GET    /api/frameworks/:id/questions      → 200 { domains[], questions[] }
```

### Assessments
```
POST   /api/assessments                   → 201 { assessment }
GET    /api/assessments?clientOrgId=x     → 200 { assessments[] }
GET    /api/assessments/:id               → 200 { assessment + answers + scores }
POST   /api/assessments/:id/answer        → 200 { answer }  (save one answer)
POST   /api/assessments/:id/complete      → 200 { assessment + scores + actions }
DELETE /api/assessments/:id               → 200 { ok }
```

### Actions
```
GET    /api/actions?clientOrgId=x         → 200 { actions[] }
POST   /api/actions                       → 201 { action }
PATCH  /api/actions/:id                   → 200 { action }
PATCH  /api/actions/:id/status            → 200 { action }
DELETE /api/actions/:id                   → 200 { ok }
```

### Evidence
```
POST   /api/evidence           → 201 { file }  (multipart/form-data)
GET    /api/evidence?clientOrgId=x → 200 { files[] }
PATCH  /api/evidence/:id/review    → 200 { file }  (vCISO only)
DELETE /api/evidence/:id           → 200 { ok }
```

---

## 7. Scoring Service Logic

```typescript
// maturity value → percentage contribution
const MATURITY_WEIGHTS = { 0: 0, 1: 33, 2: 67, 3: 100 };

function computeDomainScore(answers: Answer[], domain: Domain): number {
  const domainAnswers = answers.filter(a => a.control.domainId === domain.id);
  if (domainAnswers.length === 0) return 0;
  const total = domainAnswers.reduce((sum, a) => sum + MATURITY_WEIGHTS[a.value], 0);
  return Math.round(total / domainAnswers.length);
}

function computeOverallScore(domainScores: number[]): number {
  return Math.round(domainScores.reduce((a, b) => a + b, 0) / domainScores.length);
}
```

---

## 8. Action Generation Logic

When an assessment completes, auto-generate actions for any answer with value < 2:

```typescript
const ACTION_TEMPLATES: Record<string, ActionTemplate> = {
  "GV.OC-01": { title: "Establish & document cybersecurity policy", effort: "MEDIUM", impact: "HIGH" },
  "PR.AC-01": { title: "Enforce MFA on all privileged accounts", effort: "LOW", impact: "HIGH" },
  "DE.CM-01": { title: "Deploy SIEM or MDR for continuous monitoring", effort: "HIGH", impact: "HIGH" },
  "RS.RP-01": { title: "Create and test Incident Response Plan", effort: "MEDIUM", impact: "HIGH" },
  // ... one per control
};
```

---

## 9. Frontend State Management

### Zustand auth store
```typescript
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

### TanStack Query patterns
- `useClients()` → GET /api/clients
- `useClient(id)` → GET /api/clients/:id
- `useAssessments(clientOrgId)` → GET /api/assessments?clientOrgId=
- `useActions(clientOrgId)` → GET /api/actions?clientOrgId=

All mutations invalidate relevant query keys on success.

---

## 10. Phase Roadmap

### Phase 1 — Core (This Sprint) ✅ In Progress
- [ ] Full auth flow (register, login, refresh, logout)
- [ ] Client org CRUD
- [ ] NIST CSF 2.0 assessment flow (all 6 domains)
- [ ] Scoring engine
- [ ] Auto-generated actions from low scores
- [ ] Results view with radar chart
- [ ] Dashboard command center

### Phase 2 — AI Engine
- [ ] Claude API integration for per-domain narrative
- [ ] AI executive summary generation
- [ ] Effort × impact prioritisation from AI
- [ ] ISO 27001, GDPR, NIS2, PCI DSS question banks

### Phase 3 — Network Scanner
- [ ] NMAP wrapper microservice
- [ ] Scan results → framework control mapping
- [ ] AI analysis of scan findings
- [ ] Scan history per client

### Phase 4 — Reports & Export
- [ ] Puppeteer PDF generation (branded per vCISO)
- [ ] CSV export
- [ ] Email delivery of reports
- [ ] Compliance certificates

### Phase 5 — Integrations
- [ ] REST API with API keys for enterprise
- [ ] Webhooks (on completion, score drop, deadline)
- [ ] Jira/ServiceNow action sync

---

## 11. Security Checklist

- [x] HttpOnly cookies for tokens (no localStorage)
- [x] Refresh token rotation (single-use)
- [x] bcrypt with 12 rounds
- [x] Zod validation on all inputs
- [x] helmet headers
- [x] CORS restricted to frontend origin
- [x] Rate limiting on auth endpoints
- [ ] CSRF protection (add csurf for state-changing routes)
- [ ] File upload validation (type + size limits)
- [ ] SQL injection: Prisma parameterises all queries ✅

---

## 12. Environment Variables

### Backend `.env`
```
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_REFRESH_SECRET=<openssl rand -base64 64>
FRONTEND_URL=http://localhost:5173
ANTHROPIC_API_KEY=          # Phase 2
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001
```

---

## 13. Getting Started

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/cisolens.git
cd cisolens

# Backend
cd backend
cp .env.example .env        # fill in secrets
npm install
npm run db:migrate          # creates SQLite DB + runs migrations
npm run db:seed             # seeds frameworks + demo user
npm run dev                 # starts on :3001

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev                 # starts on :5173

# Demo login
# Email: khaled@cisolens.io
# Password: Demo1234!
```

---

## 14. Git Workflow

```
main          → production-ready only
develop       → integration branch
feature/*     → new features
fix/*         → bug fixes
```

Commit format: `type(scope): message`
Examples:
- `feat(auth): add refresh token rotation`
- `fix(scoring): handle empty domain answers`
- `feat(clients): add framework assignment on create`

---

## 15. Design Tokens (Frontend)

```css
--bg: #080c14          /* page background */
--surface: #0d1421     /* card background */
--surface2: #111827    /* input background */
--border: rgba(255,255,255,0.07)
--text: #e8edf5
--muted: #5a6478
--cyan: #00d4ff        /* primary accent */
--emerald: #00e5a0     /* success / low risk */
--amber: #f59e0b       /* warning / medium risk */
--red: #f43f5e         /* danger / high risk */

/* Fonts */
--font-display: 'Syne', sans-serif       /* headings, logo, scores */
--font-body: 'DM Sans', sans-serif       /* body text */
--font-mono: 'JetBrains Mono', monospace /* labels, badges, code */
```
