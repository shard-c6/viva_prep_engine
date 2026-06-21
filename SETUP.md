# VERA — Setup & Deployment Guide (Phase 2)

Welcome to Phase 2! To get VERA (Viva Evaluation and Report Automator) running, you need to configure the external services (Supabase, GitHub, Gemini) and deploy the AWS infrastructure.

Follow these steps in order.

---

## 1. Prerequisites

Ensure you have the following installed on your local machine:
- [AWS CLI](https://aws.amazon.com/cli/) (configured with your AWS credentials: `aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.12)

---

## 2. Supabase Setup (Database & Auth)

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once created, go to **Project Settings -> API**.
   - Copy your **Project URL**
   - Copy your **anon** `public` key (for the frontend)
   - Copy your **service_role** `secret` key (for the AWS Lambda backend)
3. Go to the **SQL Editor** in Supabase.
   - Paste the contents of `docs/001_initial_schema.sql` and click **Run**. This sets up the tables, RLS, and triggers.

---

## 3. GitHub Setup (OAuth & API Access)

### A. OAuth App (for User Login)
1. Go to your GitHub account **Settings -> Developer Settings -> OAuth Apps -> New OAuth App**.
2. Application name: `VERA`
3. Homepage URL: `http://localhost:3000` (Update to your Vercel URL later)
4. Authorization callback URL: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
5. Click **Register application**.
6. Generate a **Client Secret**.
7. Go back to your **Supabase Dashboard -> Authentication -> Providers -> GitHub**.
   - Enable GitHub.
   - Paste the **Client ID** and **Client Secret**.
   - Click Save.

### B. Personal Access Token (for the Backend Bot)
*It is highly recommended to create a dedicated GitHub account (e.g., `viva-prep-bot`) for this so you don't hit your personal rate limits.*
1. Log in to the bot GitHub account.
2. Go to **Settings -> Developer Settings -> Personal Access Tokens -> Tokens (classic)**.
3. Generate a new token. It **does not need any scopes** (no checkboxes selected) since it only accesses public repositories. It just increases your API rate limit from 60/hr to 5000/hr.
4. Copy the PAT.

---

## 4. Gemini AI Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Copy the API Key.

---

## 5. AWS Deployment (Backend)

Now you will deploy the SQS queue, Lambda functions, and API Gateway.

1. Open your terminal and navigate to the `infra` directory:
   ```bash
   cd infra
   ```
2. Build the SAM application:
   ```bash
   sam build
   ```
3. Deploy the application:
   ```bash
   sam deploy --guided
   ```
4. **SAM Deploy Prompts:**
   - Stack Name: `viva-prep-engine`
   - AWS Region: (Choose your region, e.g., `us-east-1`)
   - Parameter `GeminiApiKey`: Paste your Gemini key.
   - Parameter `SupabaseUrl`: Paste your Supabase Project URL.
   - Parameter `SupabaseServiceKey`: Paste your Supabase `service_role` key.
   - Parameter `GitHubPat`: Paste your GitHub PAT.
   - Parameter `AllowedOrigin`: Leave as `*` for now (update to your Vercel URL later).
   - Confirm changes before deploy: `Y`
   - Allow SAM CLI IAM role creation: `Y`
   - Disable authorization on API Gateway? `Y` (Our API is public but expects a valid job_id).
   - Save arguments to configuration file: `Y`

5. Once deployment is complete, SAM will output the **ApiEndpoint**. Copy this URL!

---

## 6. Frontend Setup & Run

1. Open `.env.example` in the root of the project.
2. Copy it to `frontend/.env.local`:
   ```bash
   cp .env.example frontend/.env.local
   ```
3. Edit `frontend/.env.local` and fill in the values:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase `anon` key
   - `NEXT_PUBLIC_API_GATEWAY_URL`: The `ApiEndpoint` you got from the AWS SAM deployment.
4. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser. You should be able to log in with GitHub and submit a repository!

---

## 7. Production Deployment (Vercel)

When you're ready to share this with others:
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import the repository.
3. Set the Framework Preset to **Next.js**.
4. Set the Root Directory to `frontend`.
5. Add the Environment Variables from your `.env.local` file.
6. Deploy!
7. **Important Updates:**
   - Update your GitHub OAuth App's Homepage URL and Callback URL if necessary.
   - Update your Supabase Auth Site URL and Redirect URLs to your new Vercel domain.
   - Redeploy your AWS SAM stack, changing the `AllowedOrigin` parameter to your Vercel domain to secure your API Gateway.

---

## 8. Running Backend Unit Tests (Phase 3)

The backend includes an offline unit test suite to validate repository downloading, code chunking, and payload construction.

To run the unit tests locally:

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run pytest:
   ```bash
   python3 -m pytest tests/ -v
   ```

### Test Suite Structure

| Test File | Target Module | Scope |
|-----------|---------------|-------|
| `tests/test_repo_downloader.py` | `repo_downloader.py` | GitHub URL parsing and error code mapping |
| `tests/test_code_chunker.py` | `code_chunker.py` | Extension filtering, directory pruning, and file truncation |
| `tests/test_ai_engine.py` | `ai_engine.py` | AI payload serialization and mock response parsing |
