import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Compass, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export const Register = () => {
  const { login } = useAuth()
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
      setErrorMsg('Passwords do not match.')
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
      toast.success('Account created successfully! Logging you in...')

      // Automatically sign the user in with new credentials
      try {
        await login({
          email: formData.email.trim(),
          password: formData.password,
        })
        navigate('/dashboard', { replace: true })
      } catch (loginErr) {
        // Fallback to login page if immediate token acquisition fails
        navigate('/login', { replace: true })
      }
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
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-xl)' }}>
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
          <h1 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Join Wanderlust</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Create an account to book tours, manage reservations, and leave verified reviews.
          </p>
        </div>

        {errorMsg && (
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

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="registerName">
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="registerName"
                name="name"
                type="text"
                placeholder="Sarah Jenkins"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
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

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="registerEmail">
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="registerEmail"
                name="email"
                type="email"
                placeholder="sarah@example.com"
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

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="registerPassword">
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="registerPassword"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
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
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat password"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
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

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                <span>Create Account</span>
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
