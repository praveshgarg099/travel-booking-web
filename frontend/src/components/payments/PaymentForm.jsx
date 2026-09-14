import React, { useState } from 'react'
import { paymentService } from '../../services/paymentService'
import { loadRazorpayScript } from '../../utils/loadRazorpay'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'
import { CreditCard, Smartphone, Banknote, Building2, ShieldCheck, CheckCircle2, Lock } from 'lucide-react'

export const PaymentForm = ({ booking, packageDetails, onPaymentSuccess }) => {
  const toast = useToast()
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [completedPayment, setCompletedPayment] = useState(null)

  const methods = [
    { id: 'ONLINE', label: 'Razorpay Secure Checkout', icon: Smartphone, desc: 'Cards, UPI, Net Banking, Wallets (Instant)' },
    { id: 'CASH', label: 'Cash on Arrival', icon: Banknote, desc: 'Pay manually at travel desk upon arrival' },
  ]

  const handlePay = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (booking?.status === 'CONFIRMED') {
        setErrorMsg('This booking has already been paid for and confirmed.')
        setLoading(false)
        return
      }
      if (booking?.status === 'CANCELLED') {
        setErrorMsg('Cannot make a payment for a cancelled booking.')
        setLoading(false)
        return
      }

      if (paymentMethod === 'CASH') {
        // Cash on Arrival fallback
        const payload = {
          paymentMethod: 'CASH',
          bookingId: booking.id,
        }
        const response = await paymentService.createPayment(payload)
        setCompletedPayment(response)
        toast.success('Reservation saved with Cash on Arrival!')
        if (onPaymentSuccess) {
          onPaymentSuccess(response)
        }
        return
      }

      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        throw new Error('Could not load Razorpay payment SDK. Please check your internet connection.')
      }

      // 2. Create authoritative Razorpay order via backend
      const orderData = await paymentService.createOrder(booking.id)

      // 3. Configure Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: 'Travel Booking Web',
        description: orderData.packageTitle || 'Travel Package Reservation',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName || '',
          email: orderData.customerEmail || '',
        },
        theme: {
          color: '#0284c7',
        },
        handler: async function (response) {
          try {
            setLoading(true)
            const verifyPayload = {
              bookingId: booking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }

            const verificationResult = await paymentService.verifyPayment(verifyPayload)
            setCompletedPayment({
              id: verificationResult.paymentId,
              razorpayPaymentId: verificationResult.razorpayPaymentId,
              amount: orderData.amount,
              paymentMethod: verificationResult.paymentMethod,
              status: verificationResult.status,
            })
            toast.success('Payment verified and booking confirmed successfully!')
            if (onPaymentSuccess) {
              onPaymentSuccess(verificationResult)
            }
          } catch (verifyErr) {
            console.error('Verification failed:', verifyErr)
            const msg = verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed'
            setErrorMsg(msg)
            toast.error(msg)
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            toast.info('Payment window closed. You can retry payment anytime before reservation expires.')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        setLoading(false)
        const failureDesc = resp.error?.description || 'Payment was unsuccessful.'
        setErrorMsg(failureDesc)
        toast.error(`Payment failed: ${failureDesc}`)
      })

      rzp.open()
    } catch (err) {
      console.error('Payment initiation error:', err)
      const msg = err.response?.data?.message || err.message || 'Payment processing failed.'
      setErrorMsg(msg)
      toast.error(msg)
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
          Payment Confirmed!
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Thank you! Your payment for Booking #{booking.id} has been cryptographically verified and confirmed.
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
          {completedPayment.razorpayPaymentId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Razorpay Payment ID:</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {completedPayment.razorpayPaymentId}
              </span>
            </div>
          )}
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
            <span className="badge badge-success">{completedPayment.status || 'SUCCESS'}</span>
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
            <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Total Amount:</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            * This amount is authoritatively calculated by your backend server.
          </p>
        </div>

        {/* Payment Method Selector */}
        <form onSubmit={handlePay}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Select Payment Gateway / Method
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
              {loading ? 'Connecting to Gateway...' : `Proceed to Pay ${formatCurrency(booking.totalAmount)}`}
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
            <span>Secured with Razorpay 256-bit encryption and backend cryptographic HMAC verification</span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm
