import Link from 'next/link'
import Header from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function LandingPage() {
  let user = null

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      user = profile
    }
  } catch {
    // Not logged in
  }

  return (
    <>
      <Header user={user} />

      <main>
        {/* Hero Section */}
        <section className="hero" id="hero">
          <div className="hero-badge">
            🚀 Built for Engineering Students
          </div>

          <h1 className="hero-title">
            Turn Your <span className="gradient-text">GitHub Repo</span> Into a
            Viva-Ready Report
          </h1>

          <p className="hero-subtitle">
            Paste your repository link. Get an AI-powered architecture breakdown,
            structured project report, and 10 targeted Viva flashcards — in minutes.
          </p>

          <div className="hero-cta">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg" id="cta-dashboard">
                🎯 Go to Dashboard
              </Link>
            ) : (
              <Link href="#features" className="btn btn-primary btn-lg" id="cta-get-started">
                Get Started — It&apos;s Free
              </Link>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              Learn More
            </a>
          </div>
        </section>

        {/* Features Grid */}
        <section className="features" id="features">
          <div className="feature-card card glass">
            <span className="feature-icon">📊</span>
            <h3 className="feature-title">Architecture Breakdown</h3>
            <p className="feature-desc">
              See every file, function, and dependency mapped out in a clean table.
              Understand your project structure at a glance — the way an evaluator would review it.
            </p>
          </div>

          <div className="feature-card card glass">
            <span className="feature-icon">📝</span>
            <h3 className="feature-title">Structured Report</h3>
            <p className="feature-desc">
              Auto-generated project report covering problem statement, system design,
              execution flow, and technology rationale. Ready for submission formatting.
            </p>
          </div>

          <div className="feature-card card glass">
            <span className="feature-icon">🎓</span>
            <h3 className="feature-title">Viva Flashcards</h3>
            <p className="feature-desc">
              10 targeted questions based on YOUR specific code — not generic textbook questions.
              Choose beginner, intermediate, or advanced difficulty to match your evaluator.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          padding: 'var(--space-3xl) var(--space-lg)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>
            How It <span className="gradient-text">Works</span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-xl)',
          }}>
            {[
              { step: '01', title: 'Paste Link', desc: 'Enter your public GitHub repository URL' },
              { step: '02', title: 'Select Options', desc: 'Choose tech stack and Viva difficulty' },
              { step: '03', title: 'AI Analyzes', desc: 'Our cloud pipeline processes your code' },
              { step: '04', title: 'Get Results', desc: 'View your report, architecture table & flashcards' },
            ].map((item) => (
              <div key={item.step} style={{ padding: 'var(--space-lg)' }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 'var(--space-sm)',
                }}>
                  {item.step}
                </div>
                <h4 style={{ marginBottom: 'var(--space-xs)' }}>{item.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: 'var(--space-2xl)',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          position: 'relative',
          zIndex: 1,
        }}>
          <p>
            Built by <strong style={{ color: 'var(--text-secondary)' }}>Aashiq Engineer</strong> — VIT Mumbai, Computer Engineering
          </p>
          <p style={{ marginTop: 'var(--space-sm)' }}>
            Powered by Gemini AI · AWS Lambda · Supabase
          </p>
        </footer>
      </main>
    </>
  )
}
