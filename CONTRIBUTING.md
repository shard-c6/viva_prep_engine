# Contributing to VERA

Thank you for your interest in contributing to VERA (Viva Evaluation and Report Automator)! We welcome all contributions from bug reports to feature suggestions and code changes.

Please follow these guidelines to ensure a smooth contribution process.

---

## 🚀 Getting Started

1. **Fork the Repository:** Create a fork of this repository on GitHub.
2. **Clone Locally:**
   ```bash
   git clone https://github.com/your-username/viva_prep_engine.git
   cd viva_prep_engine
   ```
3. **Set Up the Environment:** Follow the instructions in the [Setup Guide](SETUP.md) to set up Supabase, AWS SAM, and Next.js.
4. **Create a Branch:** Create a branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

---

## 🎨 Code Style & Standards

### Frontend (Next.js)
- Write clean React components with descriptive names.
- Keep TypeScript types clean and avoid using `any`.
- Check styling rules and class name structures in [globals.css](frontend/src/app/globals.css).
- Format and lint your code before committing:
  ```bash
  cd frontend
  npm run lint
  ```

### Backend (Python Lambda)
- Adhere to PEP 8 standards.
- Keep handlers and service modules separated logically.
- Add descriptive docstrings and type annotations to all functions.

---

## 💬 Commit Message Convention

We follow standard Conventional Commits conventions. Please write commit messages in the following format:

- `feat: add PDF report download option`
- `fix: correct token count parsing logic for Gemini`
- `docs: update setup steps for GitHub OAuth`
- `style: format flashcard components`
- `refactor: extract chunking logic from downloader`

---

## 📬 Pull Request Process

1. Ensure all code tests locally and builds cleanly.
2. Update the documentation (like API specs or guides) if your changes introduce new endpoints, schema columns, or user configurations.
3. Push your branch to GitHub and create a Pull Request against our `master` branch.
4. Fill in the Pull Request template completely so we understand your change.
