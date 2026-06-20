'use client'

import { createClient } from '@/lib/supabase'

export default function GetStartedButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button onClick={handleLogin} className="btn btn-primary btn-lg" id="cta-get-started">
      Get Started — It&apos;s Free
    </button>
  )
}
