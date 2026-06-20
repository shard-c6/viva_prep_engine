# 🎓 Repo-to-Report & Viva Prep Engine

> Turn a raw GitHub link into a structured codebase analysis, a formatted project report, and personalized Viva flashcards.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2015-black)]()
[![AWS](https://img.shields.io/badge/backend-AWS%20Lambda-orange)]()
[![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash--Lite-blue)]()

## 🚀 What It Does

1. **Submit** a public GitHub repository URL
2. **Choose** your tech stack and Viva difficulty level
3. **Receive** an AI-generated architecture breakdown, project report, and 10 targeted Viva flashcards

## 🏗️ Architecture

```
Next.js (Vercel) → AWS API Gateway → SQS → Lambda (Python) → Gemini API → Supabase
```

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15 on Vercel |
| Auth | GitHub OAuth via Supabase |
| API Gateway | AWS API Gateway (REST) |
| Queue | AWS SQS + Dead Letter Queue |
| Worker | AWS Lambda (Python 3.12) |
| AI Engine | Gemini 2.5 Flash-Lite |
| Database | Supabase (PostgreSQL) |
| IaC | AWS SAM |

## 📁 Project Structure

```
viva_prep_engine/
├── frontend/          # Next.js application
├── backend/           # Lambda function (Python)
├── infra/             # AWS SAM templates
└── docs/              # Architecture docs
```

## 🛠️ Setup

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

### Quick Start (Frontend)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # Fill in your Supabase keys
npm run dev
```

## 📄 Documentation

- [Master Blueprint](implementation_plan.md) — Full architecture & decisions
- [Setup Guide](docs/SETUP.md) — Local development setup
- [API Contracts](docs/API_CONTRACTS.md) — API request/response specs

## 👤 Author

**Aashiq Engineer** — VIT Mumbai, Computer Engineering

## 📝 License

This project is for academic purposes.
