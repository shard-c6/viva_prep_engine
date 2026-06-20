/* =============================================
   Shared TypeScript Types
   ============================================= */

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type TechStack = 'C' | 'C++' | 'Java' | 'Python' | 'JavaScript'

export type VivaDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Job {
  id: string
  user_id: string
  repo_url: string
  repo_owner: string
  repo_name: string
  tech_stack: TechStack
  viva_difficulty: VivaDifficulty
  status: JobStatus
  error_code: string | null
  error_message: string | null
  file_count: number | null
  total_size_bytes: number | null
  processing_started_at: string | null
  processing_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Component {
  file_path: string
  language: string
  purpose: string
  key_functions: string[]
  dependencies: string[]
  complexity: 'low' | 'medium' | 'high'
  lines_of_code: number
}

export interface ReportSections {
  problem_statement: string
  system_design: string
  execution_flow: string
  tech_stack_rationale: string
  key_algorithms: string
  strengths: string[]
  improvement_areas: string[]
}

export interface Flashcard {
  id: number
  difficulty: VivaDifficulty
  question: string
  model_answer: string
  follow_up: string
  topic_tag: string
}

export interface Report {
  id: string
  job_id: string
  architecture_summary: string
  components: Component[]
  report_sections: ReportSections
  viva_flashcards: Flashcard[]
  model_used: string
  input_tokens: number | null
  output_tokens: number | null
  created_at: string
}

export interface UserProfile {
  id: string
  github_username: string
  avatar_url: string | null
  created_at: string
}

// Error codes from the backend
export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_URL: 'Please enter a valid public GitHub repository URL.',
  REPO_NOT_FOUND: 'Repository not found. Make sure it exists and is public.',
  REPO_TOO_LARGE: 'This repository exceeds our 50MB / 200 file limit.',
  UNSUPPORTED_LANGUAGE: 'No supported code files found (.py, .java, .c, .cpp, .js, .ts).',
  EMPTY_REPO: 'This repository appears to be empty.',
  AI_TIMEOUT: 'AI analysis timed out. Please try again.',
  AI_ERROR: 'AI analysis failed. Please try again later.',
  RATE_LIMITED: 'You\'ve reached the maximum of 5 active analyses.',
  DAILY_LIMIT_REACHED: 'You\'ve reached your daily limit of 20 analyses.',
  GITHUB_RATE_LIMITED: 'GitHub API rate limit exceeded. Please try again later.',
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
}

export const TECH_STACKS: TechStack[] = ['Python', 'JavaScript', 'Java', 'C', 'C++']

export const DIFFICULTY_LEVELS: { value: VivaDifficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Syntax & basic concepts' },
  { value: 'intermediate', label: 'Intermediate', description: 'Design decisions & patterns' },
  { value: 'advanced', label: 'Advanced', description: 'Architecture & scalability' },
]
