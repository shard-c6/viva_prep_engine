'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import SubmissionForm from '@/components/SubmissionForm'
import JobStatusCard from '@/components/JobStatusCard'
import { useJobSubscription } from '@/hooks/useJobSubscription'
import { createClient } from '@/lib/supabase'
import type { UserProfile, Job } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // V2: Supabase Realtime subscription replaces polling
  const { jobs, refetch } = useJobSubscription(userId)

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

      if (profile) {
        setUser(profile as UserProfile)
      } else {
        setUser({
          id: authUser.id,
          github_username: authUser.user_metadata?.user_name || authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url || '',
          created_at: authUser.created_at,
        })
      }

      setLoading(false)
    }

    init()
  }, [router])

  const handleDeleteJob = async (jobId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('jobs').delete().eq('id', jobId)
    if (!error) {
      refetch()
    } else {
      alert('Failed to delete job: ' + error.message)
    }
  }

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
          onSubmitted={() => refetch()}
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
                <JobStatusCard key={job.id} job={job} onDelete={handleDeleteJob} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
