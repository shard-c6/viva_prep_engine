'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TECH_STACKS, DIFFICULTY_LEVELS } from '@/lib/types'
import type { TechStack, VivaDifficulty } from '@/lib/types'

interface SubmissionFormProps {
  userId: string
  onSubmitted: () => void
}

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[\w\-_.]+\/[\w\-_.]+\/?$/

export default function SubmissionForm({ userId, onSubmitted }: SubmissionFormProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [techStack, setTechStack] = useState<TechStack>('Python')
  const [difficulty, setDifficulty] = useState<VivaDifficulty>('intermediate')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidUrl = GITHUB_URL_REGEX.test(repoUrl.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidUrl) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const url = repoUrl.trim().replace(/\/$/, '')
      const parts = new URL(url).pathname.split('/').filter(Boolean)
      const repoOwner = parts[0]
      const repoName = parts[1].replace(/\.git$/, '')

      // Check rate limits
      const { data: activeCount } = await supabase.rpc('count_active_jobs', {
        p_user_id: userId,
      })

      if (activeCount !== null && activeCount >= 5) {
        setError('You have 5 active analyses running. Wait for some to complete.')
        setSubmitting(false)
        return
      }

      const { data: dailyCount } = await supabase.rpc('count_daily_jobs', {
        p_user_id: userId,
      })

      if (dailyCount !== null && dailyCount >= 20) {
        setError('You\'ve reached your daily limit of 20 analyses. Try again tomorrow.')
        setSubmitting(false)
        return
      }

      // Insert job into Supabase
      const { data: job, error: insertError } = await supabase
        .from('jobs')
        .insert({
          user_id: userId,
          repo_url: url,
          repo_owner: repoOwner,
          repo_name: repoName,
          tech_stack: techStack,
          viva_difficulty: difficulty,
          status: 'queued',
        })
        .select('id')
        .single()

      if (insertError || !job) {
        setError('Failed to create analysis job. Please try again.')
        setSubmitting(false)
        return
      }

      // Send to API Gateway → SQS
      const apiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL
      if (apiUrl) {
        await fetch(`${apiUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            repo_url: url,
            tech_stack: techStack,
            viva_difficulty: difficulty,
          }),
        })
      }

      // Reset form and notify parent
      setRepoUrl('')
      onSubmitted()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="submit-form glass" id="submission-form">
      <h3 style={{ marginBottom: 'var(--space-lg)', fontWeight: 700 }}>
        ✨ Analyze a Repository
      </h3>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner-icon">⚠️</span>
          <div className="error-banner-content">
            <div className="error-banner-message">{error}</div>
          </div>
        </div>
      )}

      <div className="submit-form-grid">
        <div className="form-group">
          <label htmlFor="repo-url" className="label">GitHub Repository URL</label>
          <input
            id="repo-url"
            type="url"
            className="input"
            placeholder="https://github.com/username/project"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tech-stack" className="label">Tech Stack</label>
          <select
            id="tech-stack"
            className="input select"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value as TechStack)}
            disabled={submitting}
          >
            {TECH_STACKS.map((ts) => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="difficulty" className="label">Viva Difficulty</label>
          <select
            id="difficulty"
            className="input select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as VivaDifficulty)}
            disabled={submitting}
          >
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} — {d.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="submit-form-actions">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting || !repoUrl.trim()}
          id="submit-analysis-btn"
        >
          {submitting ? (
            <>
              <span className="spinner" />
              Submitting...
            </>
          ) : (
            <>🚀 Analyze Repository</>
          )}
        </button>
      </div>
    </form>
  )
}
