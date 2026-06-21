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
      setTimeout(() => {
        window.print()
      }, 600)
    }
  }, [loading, job, report])

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'Georgia, serif' }}>Preparing document...</div>
  }

  if (!job || !report) {
    return <div style={{ padding: '2rem', fontFamily: 'Georgia, serif' }}>Report not found.</div>
  }

  const sections = report.report_sections

  return (
    <div className="print-layout">
      {/* ============== Cover Page ============== */}
      <div className="print-page cover-page">
        <div style={{ textAlign: 'center', marginTop: '28vh' }}>
          <h1 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            VERA — Project Analysis Report
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#777', marginBottom: '2.5rem' }}>
            Viva Evaluation and Report Automator
          </p>
          <hr style={{ maxWidth: '180px', margin: '0 auto 2.5rem', border: '1px solid #ddd' }} />
          <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '0.5rem' }}>
            {job.repo_owner}/{job.repo_name}
          </h2>
          <p style={{ color: '#999', fontSize: '0.95rem' }}>
            {job.repo_url}
          </p>
          <div style={{ marginTop: '3rem', color: '#888', fontSize: '0.9rem', lineHeight: 2 }}>
            <p>Tech Stack: <strong style={{ color: '#555' }}>{job.tech_stack}</strong></p>
            <p>Difficulty: <strong style={{ color: '#555', textTransform: 'capitalize' }}>{job.viva_difficulty}</strong></p>
            {job.file_count && <p>Files Analyzed: <strong style={{ color: '#555' }}>{job.file_count}</strong></p>}
            <p>Generated: <strong style={{ color: '#555' }}>
              {new Date(report.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </strong></p>
          </div>
        </div>
      </div>

      <div className="page-break" />

      {/* ============== Architecture Summary ============== */}
      <div className="print-page">
        <h2 className="print-section-title">1. Architecture Summary</h2>
        {report.architecture_summary && (
          <p style={{ lineHeight: 1.8, marginBottom: '2rem' }}>
            {report.architecture_summary}
          </p>
        )}

        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
          Component Breakdown
        </h3>
        <table className="print-table">
          <thead>
            <tr>
              <th>File Path</th>
              <th>Language</th>
              <th>Purpose</th>
              <th>Complexity</th>
              <th>LOC</th>
            </tr>
          </thead>
          <tbody>
            {report.components.map((comp, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{comp.file_path}</td>
                <td>{comp.language}</td>
                <td>{comp.purpose}</td>
                <td style={{ textTransform: 'capitalize' }}>{comp.complexity}</td>
                <td>{comp.lines_of_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="page-break" />

      {/* ============== Project Report Sections ============== */}
      <div className="print-page">
        <h2 className="print-section-title">2. Detailed Project Report</h2>

        {[
          { heading: '2.1 Problem Statement', content: sections.problem_statement },
          { heading: '2.2 System Design', content: sections.system_design },
          { heading: '2.3 Execution Flow', content: sections.execution_flow },
          { heading: '2.4 Tech Stack Rationale', content: sections.tech_stack_rationale },
          { heading: '2.5 Key Algorithms', content: sections.key_algorithms },
        ].map((section, idx) => (
          <div key={idx} style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              {section.heading}
            </h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {section.content}
            </div>
          </div>
        ))}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            2.6 Strengths
          </h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: '1.2rem' }}>
            {sections.strengths?.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            2.7 Areas for Improvement
          </h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: '1.2rem' }}>
            {sections.improvement_areas?.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="page-break" />

      {/* ============== Viva Flashcards ============== */}
      <div className="print-page">
        <h2 className="print-section-title">3. Viva Preparation Flashcards</h2>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          {report.viva_flashcards.length} questions at the <em style={{ textTransform: 'capitalize' }}>{job.viva_difficulty}</em> difficulty level, tailored to your codebase.
        </p>

        {report.viva_flashcards.map((card, idx) => (
          <div key={idx} className="print-flashcard">
            <h4 style={{ marginBottom: '0.5rem' }}>
              Q{idx + 1}. {card.question}
            </h4>
            <p style={{ lineHeight: 1.7, marginBottom: '0.5rem' }}>
              <strong>Model Answer:</strong> {card.model_answer}
            </p>
            {card.follow_up && (
              <p style={{ lineHeight: 1.7, color: '#555', fontSize: '0.9rem' }}>
                <strong>Follow-up:</strong> {card.follow_up}
              </p>
            )}
            <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Topic: {card.topic_tag}
            </p>
          </div>
        ))}
      </div>

      {/* ============== Footer ============== */}
      <div className="print-page" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <hr style={{ margin: '2rem 0', border: '0.5px solid #eee' }} />
        <p style={{ color: '#bbb', fontSize: '0.8rem' }}>
          Generated by VERA — Viva Evaluation and Report Automator
        </p>
        {report.input_tokens && (
          <p style={{ color: '#ccc', fontSize: '0.75rem' }}>
            Model: {report.model_used} | {report.input_tokens.toLocaleString()} input tokens / {report.output_tokens?.toLocaleString()} output tokens
          </p>
        )}
      </div>
    </div>
  )
}
