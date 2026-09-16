import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authService } from '../services/authService'
import { MailCheck, ArrowRight, RefreshCw, AlertCircle, ShieldCheck, Mail } from 'lucide-react'

export const VerifyEmail = () => {
  const { completeVerification } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const initialEmail = location.state?.email || searchParams.get('email') || ''
  const [email, setEmail] = useState(initialEmail)
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail)

  // 6 digit code state
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [errorMsg, setErrorMsg] = useState('')

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/[^0-9]/g, '')
    const newDigits = [...codeDigits]

    if (cleanVal.length > 1) {
      // Handle paste of whole code
      const pasted = cleanVal.slice(0, 6).split('')
      pasted.forEach((char, i) => {
        newDigits[i] = char
      })
      setCodeDigits(newDigits)
      const nextIndex = Math.min(pasted.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    newDigits[index] = cleanVal
    setCodeDigits(newDigits)

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '')
    if (!pastedData) return

    const newDigits = [...codeDigits]
    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newDigits[i] = pastedData[i]
    }
    setCodeDigits(newDigits)
    const focusIdx = Math.min(pastedData.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  const handleVerify = async (e) => {
    e?.preventDefault()
    setErrorMsg('')

    const code = codeDigits.join('')
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.')
      return
    }

    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.')
      return
    }

    try {
      setLoading(true)
      const user = await completeVerification({
        email: email.trim(),
        code,
      })

      toast.success(`Email verified successfully! Welcome, ${user.name}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Verification error:', err)
      setErrorMsg(err.message || 'Verification failed. Please ensure the code is correct.')
      toast.error(err.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMsg('Please provide a valid email address to resend the code.')
      return
    }

    try {
      setResending(true)
      setErrorMsg('')
      await authService.resendVerification(email.trim())
      toast.success('A new 6-digit verification code has been dispatched!')
      setResendCooldown(60)
      setCodeDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      console.error('Resend error:', err)
      setErrorMsg(err.message || 'Failed to resend code. Please try again.')
      toast.error(err.message || 'Failed to resend verification code.')
    } finally {
      setResending(false)
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
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary), #0284c7)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 6px 16px rgba(2, 132, 199, 0.35)',
            }}
          >
            <MailCheck size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Verify Your Email</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
            We sent a 6-digit verification code to
          </p>

          {/* Email badge / edit toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginTop: '0.5rem',
            }}
          >
            <Mail size={15} />
            <span>{email || 'your email'}</span>
            <button
              type="button"
              onClick={() => setIsEditingEmail(!isEditingEmail)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                marginLeft: '0.25rem',
              }}
            >
              {isEditingEmail ? 'Done' : 'Change'}
            </button>
          </div>
        </div>

        {/* Editable email input if toggled */}
        {isEditingEmail && (
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="verifyEmailInput">
              Email Address
            </label>
            <input
              id="verifyEmailInput"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        )}

        {/* Error notification */}
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

        {/* OTP Input Form */}
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              className="form-label"
              style={{ textAlign: 'center', display: 'block', marginBottom: '0.75rem' }}
            >
              Enter 6-Digit Code
            </label>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  style={{
                    width: '50px',
                    height: '56px',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    borderRadius: 'var(--radius-md)',
                    border: digit ? '2px solid var(--primary)' : '1.5px solid var(--border-subtle)',
                    backgroundColor: digit ? 'var(--white)' : 'var(--slate-50)',
                    color: 'var(--slate-900)',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: digit ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || codeDigits.join('').length !== 6}
            style={{ marginTop: '1rem' }}
          >
            {loading ? (
              'Verifying Code...'
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Resend Code Section */}
        <div
          style={{
            marginTop: '1.75rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          Didn't receive the email?{' '}
          {resendCooldown > 0 ? (
            <span style={{ fontWeight: 600, color: 'var(--slate-600)' }}>
              Resend code in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: resending ? 'not-allowed' : 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {resending ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>Resend Code</span>
            </button>
          )}
        </div>

        {/* Dev note */}
        <div
          style={{
            marginTop: '2rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--slate-600)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Development Notice:</strong> If live SMTP email credentials are not set in your environment, the 6-digit verification code is printed directly to the Spring Boot backend console.
          </span>
        </div>

        {/* Back to sign in */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already verified?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
