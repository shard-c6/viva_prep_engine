'use client'

import type { ReportSections } from '@/lib/types'

interface ReportViewerProps {
  sections: ReportSections
}

const SECTION_LABELS: { key: keyof ReportSections; label: string; icon: string }[] = [
  { key: 'problem_statement', label: 'Problem Statement', icon: '🎯' },
  { key: 'system_design', label: 'System Design', icon: '🏗️' },
  { key: 'execution_flow', label: 'Execution Flow', icon: '🔄' },
  { key: 'tech_stack_rationale', label: 'Technology Rationale', icon: '⚙️' },
  { key: 'key_algorithms', label: 'Key Algorithms', icon: '🧮' },
]

export default function ReportViewer({ sections }: ReportViewerProps) {
  return (
    <div className="animate-fade-in report-prose">
      {SECTION_LABELS.map(({ key, label, icon }) => (
        <div key={key} className="card report-section-card">
          <div className="report-section-label">
            {icon} {label}
          </div>
          <div className="report-section-content">
            {sections[key] as string}
          </div>
        </div>
      ))}

      {/* Strengths & Improvements side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        <div className="card report-section-card">
          <div className="report-section-label">💪 Strengths</div>
          <ul style={{ paddingLeft: 'var(--space-lg)', color: 'var(--success)' }}>
            {sections.strengths.map((s, i) => (
              <li key={i} style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="card report-section-card">
          <div className="report-section-label">📈 Areas for Improvement</div>
          <ul style={{ paddingLeft: 'var(--space-lg)' }}>
            {sections.improvement_areas.map((s, i) => (
              <li key={i} style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
