# VERIQO — Verified Hiring Intelligence Platform

> **Verified Hiring. Reduced Risk. Better Talent.**

Veriqo is a production-grade SaaS platform that delivers technically validated and verified candidates instead of resume databases. This is the Phase 1 codebase.

---

## Architecture

```
veriqo/
├── frontend/          # Next.js 15 + React 19 + TypeScript
├── backend/           # FastAPI + Python 3.12
├── docker-compose.yml # Local development
└── README.md
```

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | Next.js 15, React 19, TypeScript, Tailwind CSS  |
| UI          | shadcn/ui, Radix UI, Framer Motion              |
| State       | Zustand, TanStack Query                         |
| Forms       | React Hook Form + Zod                           |
| Charts      | Recharts                                        |
| Backend     | FastAPI, Python 3.12, Pydantic v2               |
| Database    | Supabase (PostgreSQL + Auth + Storage + RLS)    |
| Vector DB   | Qdrant (candidate embeddings)                   |
| Cache       | Redis                                           |
| AI          | Groq (Llama 3.3 70B)                            |
| Email       | Resend                                          |
| Payments    | Razorpay                                        |
| Deploy      | Vercel (frontend) + Railway (backend)           |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker + Docker Compose

### 1. Clone and install

```bash
# Frontend
cd frontend
npm install
cp .env.example .env.local

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Configure environment variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
REDIS_URL=redis://localhost:6379
```

### 3. Set up database

Run the migration in your Supabase SQL editor:
```
backend/migrations/001_initial_schema.sql
```

### 4. Start development servers

```bash
# Option A: Docker Compose (recommended)
docker-compose up

# Option B: Manual
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Backend
cd backend && uvicorn app.main:app --reload

# Terminal 3 — Redis
redis-server

# Terminal 4 — Qdrant
docker run -p 6333:6333 qdrant/qdrant
```

### 5. Open the app

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API Docs  | http://localhost:8000/docs   |
| Qdrant UI | http://localhost:6333/dashboard |

---

## Project Structure

### Frontend (`src/`)

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
├── auth/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── employer/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── jobs/page.tsx
│   ├── jobs/new/page.tsx
│   ├── candidates/page.tsx
│   ├── pipeline/page.tsx
│   └── reports/page.tsx
└── candidate/
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── trust-score/page.tsx
    └── passport/page.tsx

components/
├── ui/            # shadcn-style primitive components
├── layout/        # Navbar, Footer, PortalSidebar, PortalHeader
├── marketing/     # Hero, Features, Pricing, HowItWorks, CTA, Trust
├── employer/      # Employer-specific components
├── candidate/     # Candidate-specific components
└── shared/        # StatCard, QueryProvider

store/             # Zustand stores (auth, ui)
hooks/             # useAuth, etc.
lib/               # supabase, utils, validations, constants
types/             # TypeScript domain types
```

### Backend (`app/`)

```
api/v1/endpoints/
├── candidates.py   # Candidate CRUD + fraud check
├── jobs.py         # Job CRUD + ATS matching
├── verification.py # Verification pipeline
├── passports.py    # Passport generation/retrieval
└── companies.py    # Company CRUD

services/
├── ats_service.py       # ATS matching engine (Qdrant + embeddings)
├── ai_service.py        # Groq AI evaluation + fraud detection
├── passport_service.py  # Trust score aggregation + passport generation
└── email_service.py     # Resend email templates

core/
├── config.py      # Settings (pydantic-settings)
├── security.py    # JWT + RBAC
├── database.py    # Supabase client
└── cache.py       # Redis cache

migrations/
└── 001_initial_schema.sql  # Full Supabase schema with RLS
```

---

## Key Features (Phase 1)

- **Landing Page** — Hero, How It Works, Features, Pricing, Trust, CTA
- **Authentication** — Email/Password + Google + LinkedIn OAuth
- **Employer Portal** — Dashboard, Jobs, Candidates, Pipeline, Reports
- **Candidate Portal** — Dashboard, Trust Score, Passport
- **ATS Engine** — Vector similarity matching with Qdrant
- **AI Evaluation** — Groq Llama 3.3 70B portfolio & work sample scoring
- **Fraud Detection** — Multi-layer AI + rule-based engine
- **Candidate Passport** — Verified identity with shareable URL
- **Email Automation** — Resend-powered transactional emails
- **Full RLS** — Row Level Security on all Supabase tables

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```

### Backend → Railway
```bash
cd backend
railway up
```

Set all environment variables in Vercel and Railway dashboards.

---

## Phase Roadmap

| Phase | Features                                      | Status     |
|-------|-----------------------------------------------|------------|
| 1     | Landing, Auth, Employer Portal, Candidate Portal | ✅ Built |
| 2     | ATS Engine, Trust Score, Candidate Passport   | 🔄 Partial  |
| 3     | Expert Marketplace, Verification Engine, Community | 📋 Planned |
| 4     | Fraud Detection AI, Analytics, AI Assistant   | 📋 Planned |
| 5     | Enterprise, White Label, API Marketplace      | 📋 Planned |

---

## License

Proprietary — Veriqo Technologies Pvt. Ltd. All rights reserved.
