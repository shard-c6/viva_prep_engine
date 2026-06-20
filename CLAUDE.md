# VERA Development Ruleset

This file guides code generation and helper command execution for VERA (Viva Evaluation and Report Automator).

---

## 🛠️ CLI Reference

### Frontend (Next.js)
- **Install Dependencies:** `cd frontend && npm install`
- **Run Dev Server:** `cd frontend && npm run dev`
- **Run Linter:** `cd frontend && npm run lint`
- **Build Production:** `cd frontend && npm run build`

### Backend (Python Lambda)
- **Install Dependencies:** `cd backend && pip install -r requirements.txt`
- **Syntax Validation Check:** `python -m py_compile backend/*.py`
- **Local Tests:** `cd backend && pytest` (for future tests)

### Infrastructure (AWS SAM)
- **Build Stack:** `cd infra && sam build`
- **Deploy Stack (Guided):** `cd infra && sam deploy --guided`
- **Deploy Stack (Direct):** `cd infra && sam deploy`

---

## 🎨 Coding Guidelines

### 1. General Constraints
- **Decoupling:** Keep Next.js logic completely separated from AWS Lambda worker functions. Communication must occur asynchronously via the SQS Queue.
- **Git Conventions:** Write commit messages following the Conventional Commits specification (e.g., `feat: ...`, `fix: ...`, `chore: ...`).

### 2. Frontend Guidelines
- **Strict Linting:** Ensure all React effects avoid synchronous state updates or complex dependency arrays that trigger linter errors.
- **Image Elements:** Suppress or replace dynamic third-party avatar tags with appropriate next/image configs or explicit linter rule exceptions if host patterns are dynamic.

### 3. Backend Guidelines
- **Safe Tarball Extraction:** Validate all paths when unpacking downloaded archives to prevent directory traversal vulnerabilities.
- **Strict Schemas:** Always utilize Gemini's `response_schema` parameters to guarantee exact JSON mappings into Supabase reports.
