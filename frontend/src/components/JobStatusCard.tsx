'use client'

import Link from 'next/link'
import type { Job } from '@/lib/types'
import { ERROR_MESSAGES } from '@/lib/types'

interface JobStatusCardProps {
  job: Job
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

function StatusBadge({ status }: { status: Job['status'] }) {
  const labels: Record<Job['status'], string> = {
    queued: '⏳ Queued',
    processing: '⚙️ Processing',
    completed: '✅ Completed',
    failed: '❌ Failed',
  }

  return (
    <span className={`badge badge-${status}`}>
      {labels[status]}
    </span>
  )
}

export default function JobStatusCard({ job }: JobStatusCardProps) {
  const isClickable = job.status === 'completed'
  const errorMessage = job.error_code
    ? ERROR_MESSAGES[job.error_code] || job.error_message || 'An error occurred'
    : null

  const content = (
    <div className={`job-card card ${isClickable ? '' : ''}`} id={`job-${job.id}`}>
      <div className="job-card-info">
        <div className="job-card-repo">
          <span>📁</span>
          <span>{job.repo_owner}/{job.repo_name}</span>
        </div>
        <div className="job-card-meta">
          <span>{job.tech_stack}</span>
          <span>•</span>
          <span style={{ textTransform: 'capitalize' }}>{job.viva_difficulty}</span>
          <span>•</span>
          <span>{formatTime(job.created_at)}</span>
          {job.file_count && (
            <>
              <span>•</span>
              <span>{job.file_count} files</span>
            </>
          )}
        </div>
        {errorMessage && (
          <div style={{ fontSize: '0.82rem', color: 'var(--error)', marginTop: '4px' }}>
            {errorMessage}
          </div>
        )}
      </div>

      <div className="job-card-actions">
        <StatusBadge status={job.status} />
        {isClickable && (
          <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>→</span>
        )}
      </div>
    </div>
  )

  if (isClickable) {
    return (
      <Link href={`/report/${job.id}`} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    )
  }

  return content
}
