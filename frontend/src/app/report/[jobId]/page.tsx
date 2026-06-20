'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import ArchitectureTable from '@/components/ArchitectureTable'
import ReportViewer from '@/components/ReportViewer'
import FlashcardDeck from '@/components/FlashcardDeck'
import { createClient } from '@/lib/supabase'
import type { Job, Report, UserProfile } from '@/lib/types'

type Tab = 'architecture' | 'report' | 'flashcards'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('architecture')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (profile) setUser(profile as UserProfile)

      // Fetch job
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (jobData) setJob(jobData as Job)

      // Fetch report
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('job_id', jobId)
        .single()
      if (reportData) setReport(reportData as Report)

      setLoading(false)
    }

    init()
  }, [jobId, router])

  if (loading) {
    return (
      <>
        <Header user={null} />
        <div className="loading-screen">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <span className="loading-text">Loading report...</span>
        </div>
      </>
    )
  }

  if (!report || !job) {
    return (
      <>
        <Header user={user} />
        <div className="loading-screen">
          <h2>Report not found</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            This report may not exist or is still being processed.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            ← Back to Dashboard
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Header user={user} />

      <div className="report" id="report-view">
        <div className="report-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Link
                href="/dashboard"
                className="btn btn-ghost"
                style={{ marginBottom: 'var(--space-md)', display: 'inline-flex' }}
              >
                ← Back to Dashboard
              </Link>
              <div className="report-repo-name">
                <span>📁</span>
                {job.repo_owner}/{job.repo_name}
              </div>
            </div>
            <Link
              href={`/report/${job.id}/print`}
              target="_blank"
              className="btn btn-primary"
            >
              📥 Download PDF Report
            </Link>
          </div>
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-sm)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}>
            <span>{job.tech_stack}</span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>{job.viva_difficulty} difficulty</span>
            {job.file_count && (
              <>
                <span>•</span>
                <span>{job.file_count} files analyzed</span>
              </>
            )}
            {report.input_tokens && (
              <>
                <span>•</span>
                <span>{report.input_tokens.toLocaleString()} tokens processed</span>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="report-tabs" id="report-tabs" role="tablist">
          {([
            { key: 'architecture' as Tab, label: '📊 Architecture' },
            { key: 'report' as Tab, label: '📝 Report' },
            { key: 'flashcards' as Tab, label: '🎓 Flashcards' },
          ]).map((tab) => (
            <button
              key={tab.key}
              className={`report-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              id={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div role="tabpanel">
          {activeTab === 'architecture' && (
            <ArchitectureTable
              components={report.components}
              summary={report.architecture_summary}
            />
          )}

          {activeTab === 'report' && (
            <ReportViewer sections={report.report_sections} />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardDeck flashcards={report.viva_flashcards} />
          )}
        </div>
      </div>
    </>
  )
}
