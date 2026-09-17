import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export const GoogleSignInButton = ({ text = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [showDevModal, setShowDevModal] = useState(false)
  const [devEmail, setDevEmail] = useState('traveler.google@yatramigo.dev')
  const [devName, setDevName] = useState('')
  const [gisLoaded, setGisLoaded] = useState(false)
  const googleBtnContainerRef = useRef(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google Sign-In was cancelled or failed.')
      return
    }

    try {
      setLoading(true)
      const user = await loginWithGoogle(response.credential)
      toast.success(`Welcome to Yatramigo, ${user.name}!`)
      const dest = location.state?.from?.pathname || (user.role === 'ADMIN' ? '/admin' : '/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      console.error('Google login error:', err)
      toast.error(err.message || 'Google sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!googleClientId) return

    let checkCount = 0
    const maxChecks = 30 // 3 seconds total

    const tryInitGis = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
          })

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: 380,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          })
          setGisLoaded(true)
          return true
        } catch (e) {
          console.warn('Google Identity Services initialization warning:', e)
        }
      }
      return false
    }

    if (tryInitGis()) return

    const interval = setInterval(() => {
      checkCount++
      if (tryInitGis() || checkCount >= maxChecks) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [googleClientId, text])

  const handleClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else if (import.meta.env.DEV) {
      // Dev mode fallback - ONLY available in development environment
      setShowDevModal(true)
    } else {
      toast.error('Google Sign-In is not configured. Please sign in with email and password.')
    }
  }

  const handleDevGoogleLogin = async (e) => {
    e.preventDefault()
    if (!devEmail.trim()) return

    if (!import.meta.env.DEV) {
      toast.error('Simulated authentication is strictly disabled in production.')
      return
    }

    try {
      setLoading(true)
      const mockToken = devName.trim()
        ? `test_google_token_${devName.trim()}:${devEmail.trim()}`
        : `test_google_token_${devEmail.trim()}`
      const user = await loginWithGoogle(mockToken)
      toast.success(`Google Sign-In successful for ${user.name || devEmail}!`)
      setShowDevModal(false)
      const dest = location.state?.from?.pathname || (user.role === 'ADMIN' ? '/admin' : '/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      console.error('Dev Google login error:', err)
      toast.error(err.message || 'Google Sign-In failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '44px' }}>
      {/* Official Google Identity Services Button Container */}
      {googleClientId && (
        <div
          ref={googleBtnContainerRef}
          style={{
            width: '100%',
            minHeight: '44px',
            display: gisLoaded ? 'flex' : 'none',
            justifyContent: 'center',
          }}
        />
      )}

      {/* Fallback button when GIS is loading or when clientId is not provided */}
      {(!googleClientId || !gisLoaded) && (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="btn btn-outline"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            backgroundColor: 'var(--white)',
            color: 'var(--slate-800)',
            borderColor: 'var(--border-subtle)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--slate-50)'
            e.currentTarget.style.borderColor = 'var(--slate-300)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--white)'
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Connecting with Google...' : text}</span>
        </button>
      )}

      {/* Dev Mode Simulation Modal - Strictly gated to DEV mode only */}
      {import.meta.env.DEV && showDevModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-2xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#E8F0FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--slate-900)' }}>Google Sign-In</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {googleClientId ? 'Google OAuth2 Gateway' : 'Development Simulation Mode'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Sign in with your Google Account. For local development, you can test immediate single sign-on with any Google email:
            </p>

            <form onSubmit={handleDevGoogleLogin}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="e.g. Pravesh Garg"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Google Account Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDevModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoogleSignInButton
