# 🎓 VERA: Defense Guide

> [!TIP]
> This guide provides typical examiner questions about VERA's (Viva Evaluation and Report Automator) internal architecture, along with the ideal conceptual answers you should study before your oral defense.

## 1. System Architecture & Cloud Choices

**Q: Why did you choose a Serverless architecture instead of deploying a simple Flask/Express app on an EC2 instance or Heroku?**
* **Model Answer:** Serverless (AWS Lambda + SQS) is highly scalable and cost-effective. Since codebase analysis is bursty—students might submit 100 repositories the night before a deadline, and 0 for the rest of the month—Lambda scales infinitely on demand without paying for idle compute time. An EC2 instance would either crash under sudden load or waste money sitting idle.

**Q: Explain the role of AWS SQS in your application. Why not have the Next.js frontend call the Lambda function directly?**
* **Model Answer:** SQS acts as a buffer and provides decoupling. If Next.js called Lambda directly and the Lambda took 3 minutes to analyze a massive repository, the HTTP connection would time out and fail. By using SQS, Next.js can quickly drop the request into the queue and return a success to the user immediately (202 Accepted). SQS also provides built-in retry mechanisms and a Dead Letter Queue if processing fails.

**Q: What is a Dead Letter Queue (DLQ)? Why do you need it?**
* **Model Answer:** If a Lambda function repeatedly fails to process a message (for example, due to an unhandled exception or bug), SQS will retry it up to a configured limit (3 times in our setup). Instead of retrying forever (a "poison pill"), SQS moves the failing message to a Dead Letter Queue. This protects the system from endless loops and allows developers to inspect the failed messages later without data loss.

## 2. Database & State Management

**Q: Your Next.js frontend needs to know when the background job finishes. How does it know?**
* **Model Answer:** When the Next.js frontend receives the `job_id` from Supabase during the initial submission, it enters a polling loop (using `GET /api/status/:jobId`). It checks the Supabase `jobs` table every few seconds. Once the Lambda worker finishes processing, it updates the status from `processing` to `completed`. The frontend detects this state change and fetches the final AI report.

**Q: What is Row Level Security (RLS) in Supabase and how did you use it?**
* **Model Answer:** RLS ensures that users can only access their own data. We applied RLS policies to the `jobs` and `reports` tables, checking that the user's Auth token (`auth.uid()`) matches the `user_id` of the row. This prevents Student A from reading Student B's code reports via the API. The backend Lambda safely bypasses this rule by using the Supabase `service_role` key, which is strictly kept server-side.

## 3. AI & Prompt Engineering

**Q: Why did you use Gemini 2.5 Flash-Lite instead of a heavier model like GPT-4 or Claude Opus?**
* **Model Answer:** Gemini Flash-Lite provides the best trade-off between speed, cost, and context window size. Since we are passing entire repositories (up to 200 files) into the prompt, we need a massive context window (Gemini supports up to 1M tokens) that is cheap and incredibly fast. We are summarizing code, not solving complex mathematical reasoning, so the "Flash-Lite" tier is perfect for the task.

**Q: LLMs (Large Language Models) are known to hallucinate or return improperly formatted text. How do you guarantee the AI returns a valid architecture report that your UI can render?**
* **Model Answer:** We don't rely on string parsing or regular expressions. We use Gemini's **Structured Output / JSON Schema Enforcement** feature. By passing a strict JSON Schema (`response_schema`) inside the API request, we physically constrain the model's output generation to match our database columns perfectly (e.g., an array of flashcard objects, a specific component breakdown format). This guarantees valid, parsable JSON 100% of the time.

## 4. Edge Cases & Security

**Q: What happens if a user submits a 5 GB repository like the Linux Kernel?**
* **Model Answer:** The Lambda worker has strict safeguards built-in (`code_chunker.py`). Before calling the AI, it evaluates the total size of the downloaded tarball and the total number of files. If the repository exceeds 50MB or 200 code files, it immediately aborts, updates the database job status to `failed` with a `REPO_TOO_LARGE` error code, and skips the AI processing entirely, preventing massive API bills and out-of-memory errors.

**Q: How are you managing API keys and secrets?**
* **Model Answer:** We use environment variables for both the Vercel frontend and AWS backend. In AWS Lambda, secrets like the `GEMINI_API_KEY` and `GITHUB_PAT` are encrypted at rest using AWS KMS (Key Management Service) and only injected into the runtime environment during execution. They are never hardcoded in the Git repository.
