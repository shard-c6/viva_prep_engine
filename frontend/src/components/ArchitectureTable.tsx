'use client'

import type { Component } from '@/lib/types'

interface ArchitectureTableProps {
  components: Component[]
  summary: string
}

export default function ArchitectureTable({ components, summary }: ArchitectureTableProps) {
  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="report-section-label">Architecture Overview</div>
        <div className="report-section-content">{summary}</div>
      </div>

      <table className="arch-table" id="architecture-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Language</th>
            <th>Purpose</th>
            <th>Key Functions</th>
            <th>Dependencies</th>
            <th>Complexity</th>
            <th>LOC</th>
          </tr>
        </thead>
        <tbody>
          {components.map((comp, i) => (
            <tr key={i}>
              <td className="file-path">{comp.file_path}</td>
              <td>{comp.language}</td>
              <td>{comp.purpose}</td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {comp.key_functions.slice(0, 4).map((fn, j) => (
                    <code
                      key={j}
                      style={{
                        fontSize: '0.78rem',
                        background: 'var(--bg-elevated)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        color: 'var(--accent-secondary)',
                      }}
                    >
                      {fn}
                    </code>
                  ))}
                  {comp.key_functions.length > 4 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      +{comp.key_functions.length - 4} more
                    </span>
                  )}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {comp.dependencies.slice(0, 3).map((dep, j) => (
                    <span
                      key={j}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <span className={`complexity-badge complexity-${comp.complexity}`}>
                  {comp.complexity}
                </span>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {comp.lines_of_code}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
