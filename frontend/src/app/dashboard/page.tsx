'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import SubmissionForm from '@/components/SubmissionForm'
import JobStatusCard from '@/components/JobStatusCard'
import { createClient } from '@/lib/supabase'
import type { UserProfile, Job } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setJobs(data as Job[])
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/')
        return
      }

      setUserId(authUser.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) setUser(profile as UserProfile)

      await fetchJobs(authUser.id)
      setLoading(false)
    }

    init()
  }, [router, fetchJobs])

  // Polling for active jobs
  useEffect(() => {
    if (!userId) return

    const hasActive = jobs.some(
      (j) => j.status === 'queued' || j.status === 'processing'
    )

    if (hasActive) {
      const interval = setInterval(() => fetchJobs(userId), 4000)
      return () => clearInterval(interval)
    }
  }, [userId, jobs, fetchJobs])

  if (loading) {
    return (
      <>
        <Header user={null} />
        <div className="loading-screen">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <span className="loading-text">Loading your dashboard...</span>
        </div>
      </>
    )
  }

  return (
    <>
      <Header user={user} />

      <div className="dashboard" id="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome back, <span className="gradient-text">{user?.github_username}</span>
          </h1>
        </div>

        <SubmissionForm
          userId={userId!}
          onSubmitted={() => fetchJobs(userId!)}
        />

        <div style={{ marginTop: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            📋 Your Analyses
          </h2>

          {jobs.length === 0 ? (
            <div className="jobs-empty card">
              <div className="jobs-empty-icon">📭</div>
              <p>No analyses yet. Submit your first repository above!</p>
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => (
                <JobStatusCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
