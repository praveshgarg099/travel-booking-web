import React, { useState } from 'react'
import { paymentService } from '../../services/paymentService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'
import { CreditCard, Smartphone, Banknote, Building2, ShieldCheck, CheckCircle2, Lock } from 'lucide-react'

export const PaymentForm = ({ booking, packageDetails, onPaymentSuccess }) => {
  const toast = useToast()
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [completedPayment, setCompletedPayment] = useState(null)

  const methods = [
    { id: 'UPI', label: 'UPI / QR', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { id: 'NET_BANKING', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
    { id: 'CASH', label: 'Cash on Arrival', icon: Banknote, desc: 'Pay at travel desk' },
  ]

  const handlePay = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const payload = {
        paymentMethod,
        bookingId: booking.id,
      }

      const response = await paymentService.createPayment(payload)
      setCompletedPayment(response)
      toast.success('Payment submitted successfully!')

      if (onPaymentSuccess) {
        onPaymentSuccess(response)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setErrorMsg(err.message || 'Payment processing failed.')
      toast.error(err.message || 'Payment processing failed.')
    } finally {
      setLoading(false)
    }
  }

  // If payment succeeded, show confirmation card
  if (completedPayment) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--emerald-light)',
            color: 'var(--emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <CheckCircle2 size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
          Payment Processed
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Thank you! Your payment for Booking #{booking.id} has been recorded by the server.
        </p>

        <div
          style={{
            background: 'var(--slate-50)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment ID:</span>
            <span style={{ fontWeight: 700 }}>#{completedPayment.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
            <span style={{ fontWeight: 700, color: 'var(--emerald-dark)' }}>
              {formatCurrency(completedPayment.amount || booking.totalAmount)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Method:</span>
            <span style={{ fontWeight: 600 }}>{completedPayment.paymentMethod}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span className="badge badge-success">{completedPayment.status || 'CONFIRMED'}</span>
          </div>
        </div>

        <a href="/bookings" className="btn btn-primary btn-block">
          View My Bookings
        </a>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--slate-900), var(--slate-800))',
          color: 'var(--white)',
          padding: '1.5rem 2rem',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Checkout & Payment
        </span>
        <h2 style={{ color: 'var(--white)', fontSize: '1.5rem', marginTop: '0.25rem' }}>
          Complete Your Travel Reservation
        </h2>
      </div>

      <div className="card-body" style={{ padding: '2rem' }}>
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--rose-light)',
              color: 'var(--rose)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.25rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Read-Only Backend Booking Summary */}
        <div
          style={{
            background: 'var(--slate-50)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--slate-200)',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
            <span style={{ fontWeight: 700 }}>#{booking.id}</span>
          </div>
          {packageDetails && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Travel Package:</span>
              <span style={{ fontWeight: 600 }}>{packageDetails.title}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Departure Date:</span>
            <span>{formatDate(booking.bookingDate)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Guests:</span>
            <span>{booking.numberOfPeople} person(s)</span>
          </div>
          <div
            style={{
              borderTop: '1px dashed var(--slate-300)',
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Amount Calculated by Backend:</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            * This amount is strictly determined by your Spring Boot server calculation.
          </p>
        </div>

        {/* Payment Method Selector */}
        <form onSubmit={handlePay}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Select Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {methods.map((method) => {
                const Icon = method.icon
                const isSelected = paymentMethod === method.id
                return (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--slate-200)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--white)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--slate-100)',
                        color: isSelected ? 'var(--white)' : 'var(--slate-600)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                        {method.label}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {method.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Lock size={18} />
            <span>
              {loading ? 'Processing Payment...' : `Pay ${formatCurrency(booking.totalAmount)}`}
            </span>
          </button>

          <div
            style={{
              marginTop: '1.25rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={16} color="var(--emerald)" />
            <span>Demo payment integration using your Spring Boot REST backend</span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm
