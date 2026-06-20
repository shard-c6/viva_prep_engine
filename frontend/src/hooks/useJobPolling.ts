'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Job } from '@/lib/types'

/**
 * Custom hook for polling job status from Supabase.
 * Polls every 4 seconds while any job is in a non-terminal state.
 */
export function useJobPolling(userId: string | null) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    if (!userId) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setJobs(data as Job[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    // Poll if there are any active jobs
    const hasActiveJobs = jobs.some(
      (j) => j.status === 'queued' || j.status === 'processing'
    )

    if (hasActiveJobs) {
      const interval = setInterval(fetchJobs, 4000)
      return () => clearInterval(interval)
    }
  }, [jobs, fetchJobs])

  return { jobs, loading, refetch: fetchJobs }
}
