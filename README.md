<div align="center">
  <h1>🎓 VERA: Viva Evaluation and Report Automator</h1>
  <p><b>Transform raw GitHub repositories into structured architecture breakdowns, project reports, and personalized Viva flashcards.</b></p>

  <p>
    <a href="https://github.com/shard-c6/VERA"><img src="https://img.shields.io/badge/status-Phase%203%20%26%20V2%20Complete-success?style=for-the-badge" alt="Status" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://aws.amazon.com/lambda/"><img src="https://img.shields.io/badge/Backend-AWS%20Lambda-orange?style=for-the-badge&logo=amazonaws" alt="AWS" /></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash--Lite-blue?style=for-the-badge&logo=google" alt="Gemini" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  </p>
</div>

<br />

> [!NOTE]
> This project is designed specifically for Computer Engineering students. It automates the painful process of formatting architecture docs and brainstorming defense questions, letting you focus entirely on understanding your code.

---

## 🚀 What It Does

1. **Submit** any public GitHub repository URL.
2. **Choose** your exact tech stack and your desired Viva difficulty level (Beginner, Intermediate, Advanced).
3. **Receive** an AI-generated architecture breakdown, a structured problem-to-solution project report, and **10 specifically targeted Viva flashcards** derived directly from your code.

---

## 🏗️ Architecture

We built a highly scalable, serverless, event-driven architecture designed to process heavy repositories without blocking the client.

```mermaid
flowchart LR
    A[Next.js App] -->|OAuth & Jobs| B[(Supabase)]
    A -->|POST /api/analyze| C[AWS API Gateway]
    C -->|Queue Message| D[AWS SQS]
    D -->|Trigger| E[Python Lambda]
    E -->|1. Download Repo| F[GitHub API]
    E -->|2. Analyze Code| G[Gemini 2.5]
    E -->|3. Save Report| B
    B ===>|4. Realtime Status Update (V2)| A
    A -->|5. Local window.print (V2)| H[Offline PDF Report]
```

### Tech Stack Matrix

| Component | Technology | Purpose | Key Phase/V2 Updates |
|-----------|-----------|---------|----------------------|
| **Frontend** | Next.js 16 (App Router) | Responsive dashboard & UI elements | Upgraded from Next.js 15; added Turbopack support. |
| **Auth** | GitHub OAuth via Supabase | Secure identity management | Handled by Supabase Auth Providers. |
| **API Gateway** | AWS API Gateway | Ingestion endpoint & CORS handling | Proxies requests into the message queue. |
| **Queue** | AWS SQS | Buffering async jobs, DLQ for failures | Managed via CloudFormation/SAM stack. |
| **Worker Engine**| AWS Lambda (Python) | Serverless code chunking & AI orchestration | Structured using zero external dependency Python 3.12 modules. |
| **AI Engine** | Gemini 2.5 Flash-Lite | Fast context extraction with response schema | Controlled via rigid JSON response definitions. |
| **Database** | Supabase (Postgres) | Persisting user jobs and JSON reports | PostgreSQL tables protected with custom RLS. |
| **Realtime Channel**| Supabase Client API | Push status updates to Dashboard | **[V2 Upgrade]** Replaced 4s interval polling with Postgres Realtime. |
| **PDF Exporter** | HTML/CSS Print Layout | Print-friendly offline document creation | **[V2 Upgrade]** Cover page, code component metrics, and print styles. |
| **Test Suite** | Pytest (Python 3) | Unit testing for backend modules | **[Phase 3 Update]** 64 unit tests validating path extraction & parsing. |
| **IaC** | AWS SAM | Infrastructure deployment and configuration | Easily packages serverless triggers and configs. |

---

## 📁 Project Structure

This monorepo contains all components needed to run the engine.

```text
viva_prep_engine/
├── frontend/          # Next.js 15 App Router web application
├── backend/           # Python AWS Lambda worker logic
├── infra/             # AWS Serverless Application Model (SAM) templates
├── docs/              # Deep-dive architecture and design documentation
│   ├── ARCHITECTURE.md     # Decoupled processing design
│   ├── API_CONTRACTS.md    # Endpoints & Gemini JSON Schemas
│   ├── VIVA_GUIDE.md       # Q&A for your own oral defense
│   └── 001_initial_schema.sql  # Database configuration
├── SETUP.md           # Step-by-step local deployment guide
└── Projectdetailrequirement.md # Master Blueprint v2.0
```

---

## 🛠️ Setup & Deployment

Detailed setup instructions across Supabase, GitHub OAuth, Gemini APIs, and AWS are fully documented in the [Setup Guide](SETUP.md).

### Quick Start (Frontend UI)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # Configure your Supabase/AWS endpoints
npm run dev
```

---

## 📄 Documentation

We have meticulously documented the internal architecture, API contracts, and the exact constraints applied to the AI models:

- [**System Architecture**](docs/ARCHITECTURE.md) — How the SQS Queue and Python Lambda interact.
- [**API Contracts & Schemas**](docs/API_CONTRACTS.md) — The exact JSON interfaces and Gemini structured output schemas.
- [**Viva Survival Guide**](docs/VIVA_GUIDE.md) — A meta-guide: how to defend *this* specific architecture in a real Viva.
- [**Setup Guide**](SETUP.md) — Complete environment configuration.

---

## 👤 Author

**Shardul Chogale**  
Computer Engineering • VIT Mumbai

## 📝 License

This project is open-source and intended for academic demonstration purposes.
