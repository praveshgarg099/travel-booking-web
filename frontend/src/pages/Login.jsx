import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { Compass, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, MailCheck } from 'lucide-react'

export const Login = () => {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)

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
      const user = await login({
        email: formData.email.trim(),
        password: formData.password,
      })

      toast.success(`Welcome back, ${user.name}!`)
      const dest = location.state?.from?.pathname || (user.role === 'ADMIN' ? '/admin' : '/dashboard')
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
          <h1 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Sign In to Yatramigo</h1>
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
          <GoogleSignInButton text="Sign in with Google" />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 0.75rem', fontWeight: 600 }}>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">
              Email Address
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

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
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
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
