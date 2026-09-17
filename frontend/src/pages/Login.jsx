import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { Compass, Mail, Lock, ArrowRight, AlertCircle, MailCheck, HelpCircle, X } from 'lucide-react'

export const Login = () => {
  const { user, isAuthenticated, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Redirect already authenticated users to dashboard or target route
  useEffect(() => {
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || (user?.role === 'ADMIN' ? '/admin' : '/dashboard')
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, navigate, location.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setNeedsVerification(false)

    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      const loggedInUser = await login({
        email: formData.email.trim(),
        password: formData.password,
      })

      toast.success(`Welcome back, ${loggedInUser.name}!`)
      const dest = location.state?.from?.pathname || (loggedInUser.role === 'ADMIN' ? '/admin' : '/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      const isUnverified =
        err.status === 403 && (err.message || '').toLowerCase().includes('verif')

      if (isUnverified) {
        setNeedsVerification(true)
        setErrorMsg('Please verify your email address to log in.')
      } else {
        setErrorMsg(err.message || 'Invalid email or password.')
      }
      toast.error(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-main)',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-xl)' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), #0284c7)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Compass size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Welcome back to Yatramigo</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Access your travel bookings, receipts, and reviews.
          </p>
        </div>

        {needsVerification && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fffbeb',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              border: '1px solid #fde68a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontWeight: 600, fontSize: '0.9rem' }}>
              <MailCheck size={18} />
              <span>Email Verification Required</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309', lineHeight: 1.4 }}>
              Your account requires a quick one-time email verification before signing in.
            </p>
            <Link
              to={`/verify-email?email=${encodeURIComponent(formData.email.trim())}`}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start' }}
            >
              Verify Email Now
            </Link>
          </div>
        )}

        {errorMsg && !needsVerification && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--rose-light)',
              color: 'var(--rose)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              fontWeight: 500,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Sign-In */}
        <div style={{ marginBottom: '1.25rem' }}>
          <GoogleSignInButton text="Continue with Google" />
        </div>

        {/* Divider matching Section 1 wireframe */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 0.75rem', fontWeight: 600, color: 'var(--slate-400)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="loginEmail"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="email"
              />
              <Mail
                size={18}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="loginPassword">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="loginPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <Lock
                size={18}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: '1.25rem' }}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <span>Login</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              Forgot password?
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-2xl)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--slate-400)',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--slate-900)' }}>Forgot Password?</h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '1rem' }}>
              If your account was created with Google, you can sign in directly using <strong>Continue with Google</strong>.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              For email and password accounts, please contact our support desk at{' '}
              <a href="mailto:support@yatramigo.dev" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                support@yatramigo.dev
              </a>{' '}
              for secure credential recovery.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setShowForgotModal(false)}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
