# 📡 API Contracts & Database Schemas

> [!NOTE]
> This document details the exact communication contracts between the Next.js Frontend and the AWS Backend, as well as the JSON schemas strictly enforced via Gemini AI generation.

## 1. REST Endpoints

### 🟢 `POST /api/analyze`
**Host:** AWS API Gateway

Submits a new repository analysis job. The Next.js frontend calls this endpoint after successfully inserting a new job record in Supabase.

#### Request Body
```json
{
  "job_id": "uuid-from-supabase-insert",
  "repo_url": "https://github.com/owner/project",
  "tech_stack": "Python",
  "viva_difficulty": "intermediate"
}
```

#### Response: `202 Accepted`
Indicates the message was successfully queued onto SQS.
```json
{
  "message": "Analysis queued successfully",
  "job_id": "uuid-from-supabase-insert"
}
```

#### Error Responses
| HTTP | Error Code | Description |
|------|-----------|-------------|
| `400` | `INVALID_REQUEST` | Missing one or more required fields |
| `500` | `INTERNAL_ERROR` | Internal server or queuing error |

---

## 2. Supabase Tables & Polling Interfaces

The frontend polls Supabase directly (typically via a Next.js Server Action or API Route proxy) for the status of the job and to fetch the final results.

### Job Status Polling
**Table:** `public.jobs`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | The unique job_id |
| `status` | `text` | Current status: `queued`, `processing`, `completed`, or `failed` |
| `error_code` | `text` | Only populated if failed (e.g. `REPO_TOO_LARGE`, `INVALID_REPO`) |
| `error_message` | `text` | Human-readable explanation of the error |

---

## 3. Gemini Enforced JSON Schemas

The following JSON structures are what the backend enforces via Gemini's `response_schema` when prompting for results. The final results are saved into the `public.reports` table.

### `REPORT_SCHEMA` (Top-level)
Saved in the `reports` table.
```json
{
  "architecture_summary": "String: A 2-3 paragraph high-level overview of the codebase.",
  "components": [ "...see COMPONENT_SCHEMA..." ],
  "report_sections": { "...see REPORT_SECTIONS_SCHEMA..." },
  "viva_flashcards": [ "...see FLASHCARD_SCHEMA..." ]
}
```

### `COMPONENT_SCHEMA`
Details the breakdown for each significant code file.
```json
{
  "file_path": "String: Relative path (e.g. 'src/main.py')",
  "language": "String: Programming language",
  "purpose": "String: One-sentence description of the file's role",
  "key_functions": ["Array of Strings: important function names"],
  "dependencies": ["Array of Strings: External imports"],
  "complexity": "String: 'low', 'medium', or 'high'",
  "lines_of_code": "Integer: approximate lines"
}
```

### `REPORT_SECTIONS_SCHEMA`
Structured data for generating the detailed project report.
```json
{
  "problem_statement": "String: What problem does this project solve?",
  "system_design": "String: High-level architecture and patterns",
  "execution_flow": "String: Step-by-step execution flow",
  "tech_stack_rationale": "String: Why specific technologies were used",
  "key_algorithms": "String: Notable algorithms or data structures",
  "strengths": ["Array of Strings: What the project does well"],
  "improvement_areas": ["Array of Strings: Areas for future improvement"]
}
```

### `FLASHCARD_SCHEMA`
Targeted preparation questions specifically tailored to the codebase and chosen difficulty.
```json
{
  "id": "Integer: 1-10",
  "difficulty": "String: 'beginner', 'intermediate', or 'advanced'",
  "question": "String: A Viva question specific to this codebase",
  "model_answer": "String: A comprehensive model answer",
  "follow_up": "String: A follow-up question an evaluator might ask",
  "topic_tag": "String: Category tag (e.g., 'framework_selection')"
}
```
