import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { Compass, Mail, Lock, ArrowRight, AlertCircle, MailCheck, HelpCircle, X, ShieldCheck } from 'lucide-react'

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
      setErrorMsg('Please enter both your email and password.')
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
        setErrorMsg('Please verify your email address before logging in.')
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
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2.25rem',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--white)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Compass size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em', margin: 0 }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Sign in to manage your journeys, view confirmed itineraries, and access receipts.
          </p>
        </div>

        {needsVerification && (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#fffbeb',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              border: '1px solid #fde68a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontWeight: 700, fontSize: '0.9rem' }}>
              <MailCheck size={18} />
              <span>Email Verification Required</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309', lineHeight: 1.5 }}>
              Your account requires a quick one-time email verification code before signing in.
            </p>
            <Link
              to={`/verify-email?email=${encodeURIComponent(formData.email.trim())}`}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
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
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              fontWeight: 500,
              border: '1px solid #fca5a5',
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

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 0.85rem', fontWeight: 600, color: 'var(--slate-400)' }}>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="loginEmail" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="loginEmail"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
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
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" htmlFor="loginPassword" style={{ fontWeight: 600, color: 'var(--slate-800)', margin: 0 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="loginPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
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
            style={{ fontWeight: 700, padding: '0.85rem 1rem' }}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
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
          New to Yatramigo?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Create an account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
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
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '2.25rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-2xl)',
              position: 'relative',
              backgroundColor: 'var(--white)',
            }}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--slate-400)',
                padding: '0.25rem',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)' }}>Account Access Assistance</h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: '1rem' }}>
              If your account was registered with Google, you can sign in instantly using the <strong>Continue with Google</strong> option.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              For password assistance or credential reset support, reach out to our traveler support desk at{' '}
              <a href="mailto:support@yatramigo.dev" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                support@yatramigo.dev
              </a>.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setShowForgotModal(false)}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
