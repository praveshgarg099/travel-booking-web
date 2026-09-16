import React, { useState } from 'react'
import Modal from '../common/Modal'
import PaymentStatusBadge from '../payments/PaymentStatusBadge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { paymentAdminService } from '../../services/paymentAdminService'
import { useToast } from '../../context/ToastContext'
import { User, CreditCard, Map, FileText, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react'

const PaymentDetailModal = ({ isOpen, onClose, payment, onRefundSuccess }) => {
  const toast = useToast()
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  if (!payment) return null

  const alreadyRefunded = payment.refundAmount || 0
  const remainingRefundable = Math.max(0, payment.amount - alreadyRefunded)
  const isRefundable = (payment.status === 'SUCCESS' || payment.status === 'PARTIALLY_REFUNDED') && remainingRefundable > 0

  const handleOpenRefundForm = () => {
    setRefundAmount(remainingRefundable.toString())
    setRefundReason('')
    setShowRefundForm(true)
  }

  const handleProcessRefund = async (e) => {
    e.preventDefault()
    const amt = parseFloat(refundAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive refund amount.')
      return
    }
    if (amt > remainingRefundable) {
      toast.error(`Refund amount cannot exceed remaining balance of ${formatCurrency(remainingRefundable)}.`)
      return
    }

    try {
      setRefundLoading(true)
      const res = await paymentAdminService.issueRefund(payment.paymentId, {
        amount: amt,
        reason: refundReason.trim() || 'Administrative cancellation refund',
      })
      toast.success(res.message || `Successfully processed refund of ${formatCurrency(amt)}.`)
      setShowRefundForm(false)
      if (onRefundSuccess) {
        onRefundSuccess(res)
      }
      onClose()
    } catch (err) {
      console.error('Failed to issue refund:', err)
      toast.error(err.message || 'Failed to process refund.')
    } finally {
      setRefundLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Payment Info */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1f2937', margin: 0 }}>
              <CreditCard size={18} /> Payment Information
            </h4>
            {isRefundable && !showRefundForm && (
              <button
                type="button"
                onClick={handleOpenRefundForm}
                className="btn btn-warning btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                <RotateCcw size={14} /> Issue Refund
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment ID</p>
              <p style={{ fontWeight: '500' }}>#{payment.paymentId}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Original Amount</p>
              <p style={{ fontWeight: '600', color: '#059669' }}>{formatCurrency(payment.amount)}</p>
            </div>
            {payment.razorpayOrderId && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Razorpay Order ID</p>
                <p style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.8rem' }}>{payment.razorpayOrderId}</p>
              </div>
            )}
            {payment.razorpayPaymentId && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Razorpay Payment ID</p>
                <p style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.8rem' }}>{payment.razorpayPaymentId}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment Method</p>
              <p style={{ fontWeight: '500' }}>{payment.paymentMethod}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Status</p>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment Date</p>
              <p style={{ fontWeight: '500' }}>{payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Refund Form (Active when clicking Issue Refund) */}
        {showRefundForm && (
          <section style={{ border: '1px solid #fed7aa', backgroundColor: '#fff7ed', padding: '1.25rem', borderRadius: '8px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9a3412', marginBottom: '0.75rem', fontSize: '1rem' }}>
              <RotateCcw size={16} /> Issue Razorpay Refund
            </h4>
            <p style={{ fontSize: '0.825rem', color: '#7c2d12', marginBottom: '1rem' }}>
              Process a full or partial financial refund for Payment #{payment.paymentId}. Successful payment audit history will be preserved and status will update to REFUNDED.
            </p>
            <form onSubmit={handleProcessRefund}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600 }}>Refund Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={remainingRefundable}
                    className="form-control"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                    disabled={refundLoading}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#9a3412' }}>Max refundable: {formatCurrency(remainingRefundable)}</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600 }}>Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Booking cancelled by customer"
                    className="form-control"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    disabled={refundLoading}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRefundForm(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={refundLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-warning btn-sm"
                  disabled={refundLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RotateCcw size={14} />
                  {refundLoading ? 'Processing...' : 'Confirm & Issue Refund'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Refund Details (when refunded) */}
        {(payment.refundId || payment.status === 'REFUNDED' || payment.status === 'PARTIALLY_REFUNDED') && (
          <section>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#7e22ce' }}>
              <RotateCcw size={18} /> Refund Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#faf5ff', border: '1px solid #f3e8ff', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Refund Reference ID</p>
                <p style={{ fontWeight: '600', fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b21a8' }}>
                  {payment.refundId || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Refunded</p>
                <p style={{ fontWeight: '700', color: '#7e22ce' }}>{formatCurrency(payment.refundAmount || payment.amount)}</p>
              </div>
              {payment.refundDate && (
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Refund Date</p>
                  <p style={{ fontWeight: '500' }}>{formatDate(payment.refundDate)}</p>
                </div>
              )}
              {payment.refundReason && (
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Reason</p>
                  <p style={{ fontWeight: '500' }}>{payment.refundReason}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Customer Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <User size={18} /> Customer Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Customer Name</p>
              <p style={{ fontWeight: '500' }}>{payment.customerName}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Customer Email</p>
              <p style={{ fontWeight: '500' }}>{payment.customerEmail}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>User ID</p>
              <p style={{ fontWeight: '500' }}>#{payment.userId}</p>
            </div>
          </div>
        </section>

        {/* Booking Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <FileText size={18} /> Booking Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Booking ID</p>
              <p style={{ fontWeight: '500' }}>#{payment.bookingId}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Booking Date</p>
              <p style={{ fontWeight: '500' }}>{payment.bookingDate ? formatDate(payment.bookingDate) : 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Number of People</p>
              <p style={{ fontWeight: '500' }}>{payment.numberOfPeople}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Booking Amount</p>
              <p style={{ fontWeight: '500' }}>{formatCurrency(payment.totalBookingAmount)}</p>
            </div>
          </div>
        </section>

        {/* Travel Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <Map size={18} /> Travel Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Travel Package</p>
              <p style={{ fontWeight: '500' }}>{payment.travelPackageName}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Destination</p>
              <p style={{ fontWeight: '500' }}>{payment.destinationName || 'Not specified'}</p>
            </div>
          </div>
        </section>

      </div>
    </Modal>
  )
}

export default PaymentDetailModal
