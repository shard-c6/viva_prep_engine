'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

interface HeaderProps {
  user: UserProfile | null
}

export default function Header({ user }: HeaderProps) {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="header" id="main-header">
      <Link href="/" className="header-logo">
        <span className="header-logo-icon">🎓</span>
        <span>VERA</span>
      </Link>

      <nav className="header-nav">
        {user ? (
          <>
            <Link href="/dashboard" className="btn btn-ghost">
              Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user.avatar_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatar_url}
                  alt={user.github_username}
                  className="header-avatar"
                />
              )}
              <span className="header-username">{user.github_username}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost" id="logout-btn">
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={handleLogin} className="btn btn-primary" id="login-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </button>
        )}
      </nav>
    </header>
  )
}
