'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Job } from '@/lib/types'

/**
 * V2 Realtime hook — subscribes to Postgres changes on the jobs table.
 * Replaces useJobPolling's 4-second setInterval with instant push updates.
 *
 * Falls back to a one-time fetch on mount if the channel fails to connect.
 */
export function useJobSubscription(userId: string | null) {
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
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 1. Initial fetch
    fetchJobs()

    // 2. Subscribe to realtime changes on the jobs table for this user
    const channel = supabase
      .channel(`user-jobs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as Job, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === (payload.new as Job).id ? (payload.new as Job) : j
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) =>
              prev.filter((j) => j.id !== (payload.old as Partial<Job>).id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup: remove channel on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchJobs])

  return { jobs, loading, refetch: fetchJobs }
}
