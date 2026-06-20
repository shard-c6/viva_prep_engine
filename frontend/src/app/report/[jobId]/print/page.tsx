'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Job, Report } from '@/lib/types'

export default function PrintReportPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/')
        return
      }

      const { data: jobData } = await supabase.from('jobs').select('*').eq('id', jobId).single()
      if (jobData) setJob(jobData as Job)

      const { data: reportData } = await supabase.from('reports').select('*').eq('job_id', jobId).single()
      if (reportData) setReport(reportData as Report)

      setLoading(false)
    }

    init()
  }, [jobId, router])

  // Trigger print dialog once loaded
  useEffect(() => {
    if (!loading && job && report) {
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [loading, job, report])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Preparing document...</div>
  }

  if (!job || !report) {
    return <div style={{ padding: '2rem' }}>Report not found.</div>
  }

  return (
    <div className="print-layout">
      {/* Cover Page */}
      <div className="print-page cover-page">
        <div style={{ textAlign: 'center', marginTop: '30vh' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Project Report</h1>
          <h2 style={{ fontSize: '2rem', color: '#555', marginBottom: '2rem' }}>
            {job.repo_owner}/{job.repo_name}
          </h2>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>
            <p>Tech Stack: {job.tech_stack}</p>
            <p>Prepared by VERA (Viva Evaluation and Report Automator)</p>
            <p>Date: {new Date(job.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="page-break" />

      {/* Report Sections */}
      <div className="print-page">
        <h2 className="print-section-title">1. Project Overview & Report</h2>
        {[
          { heading: 'Problem Statement', content: report.report_sections.problem_statement },
          { heading: 'System Design', content: report.report_sections.system_design },
          { heading: 'Execution Flow', content: report.report_sections.execution_flow },
          { heading: 'Tech Stack Rationale', content: report.report_sections.tech_stack_rationale },
          { heading: 'Key Algorithms', content: report.report_sections.key_algorithms },
          { heading: 'Strengths', content: report.report_sections.strengths?.length ? '- ' + report.report_sections.strengths.join('\n- ') : 'N/A' },
          { heading: 'Improvement Areas', content: report.report_sections.improvement_areas?.length ? '- ' + report.report_sections.improvement_areas.join('\n- ') : 'N/A' },
        ].map((section, idx) => (
          <div key={idx} style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              {section.heading}
            </h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>

      <div className="page-break" />

      {/* Architecture Section */}
      <div className="print-page">
        <h2 className="print-section-title">2. Architecture Breakdown</h2>
        {report.architecture_summary && (
          <p style={{ marginBottom: '2rem', fontStyle: 'italic' }}>
            {report.architecture_summary}
          </p>
        )}
        <table className="print-table">
          <thead>
            <tr>
              <th>File Path</th>
              <th>Language</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {report.components.map((comp, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{comp.file_path}</td>
                <td style={{ fontWeight: 'bold' }}>{comp.language}</td>
                <td>{comp.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="page-break" />

      {/* Flashcards Section */}
      <div className="print-page">
        <h2 className="print-section-title">3. Viva Preparation (Flashcards)</h2>
        <p style={{ marginBottom: '2rem' }}>Difficulty Level: <span style={{ textTransform: 'capitalize' }}>{job.viva_difficulty}</span></p>
        
        {report.viva_flashcards.map((card, idx) => (
          <div key={idx} className="print-flashcard">
            <h4>Q{idx + 1}: {card.question}</h4>
            <p style={{ marginTop: '0.5rem' }}><strong>Answer:</strong> {card.model_answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
