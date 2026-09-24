import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { Compass, User, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react'

export const Register = () => {
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Redirect already authenticated users to dashboard or admin
  useEffect(() => {
    if (isAuthenticated) {
      const dest = user?.role === 'ADMIN' ? '/admin' : '/dashboard'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMsg('Please complete all required fields.')
      return
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.')
      return
    }

    try {
      setLoading(true)
      const registerPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      }

      await authService.register(registerPayload)
      toast.success('Account created! A 6-digit verification code has been dispatched.')

      // Redirect user to VerifyEmail page with fromRegister flag
      navigate('/verify-email', {
        state: { email: formData.email.trim(), fromRegister: true },
        replace: true,
      })
    } catch (err) {
      console.error('Registration error:', err)
      setErrorMsg(err.message || 'Registration failed. Please check your information.')
      toast.error(err.message || 'Registration failed.')
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
          maxWidth: '480px',
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
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Join Yatramigo to explore curated journeys, manage bookings, and write verified reviews.
          </p>
        </div>

        {errorMsg && (
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

        {/* Google OAuth Sign-Up */}
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
          <span style={{ padding: '0 0.85rem', fontWeight: 600, color: 'var(--slate-400)' }}>or register with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="registerName" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="registerName"
                name="name"
                type="text"
                placeholder="Priya Sharma"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="name"
              />
              <User
                size={18}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="registerEmail" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="registerEmail"
                name="email"
                type="email"
                placeholder="priya@example.com"
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

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="registerPassword" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="registerPassword"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="new-password"
              />
              <Lock
                size={18}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="confirmPassword" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="new-password"
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
              'Creating Account...'
            ) : (
              <>
                <span>Create Account</span>
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
