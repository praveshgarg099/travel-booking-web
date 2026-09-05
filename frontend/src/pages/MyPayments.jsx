import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { paymentService } from '../services/paymentService'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useToast } from '../context/ToastContext'
import PaymentStatusBadge from '../components/payments/PaymentStatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import ConfirmationDialog from '../components/common/ConfirmationDialog'
import { CreditCard, Trash2, Calendar, CheckCircle2 } from 'lucide-react'

export const MyPayments = () => {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const data = await paymentService.getAllPayments()
      setPayments(data || [])
    } catch (err) {
      console.error('Error loading payments:', err)
      setErrorMsg(err.message || 'Could not fetch payment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      setDeleteLoading(true)
      await paymentService.deletePayment(deleteTargetId)
      toast.success('Payment record deleted.')
      setPayments((prev) => prev.filter((p) => p.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Failed to delete payment:', err)
      toast.error(err.message || 'Could not delete payment record.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading your payment history..." fullPage />
  }

  if (errorMsg) {
    return (
      <ErrorMessage
        title="Failed to Load Payments"
        message={errorMsg}
        onRetry={fetchPayments}
      />
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>My Payments</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
          Receipts and payment history verified by your Spring Boot server.
        </p>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Payment History Found"
          description="You haven't completed any payments yet. Reserved bookings can be paid from your bookings list."
          actionText="View Bookings"
          actionLink="/bookings"
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking Ref</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>#{p.id}</td>
                    <td>
                      <Link
                        to={`/bookings/${p.bookingId}`}
                        style={{ color: 'var(--primary)', fontWeight: 600 }}
                      >
                        Booking #{p.bookingId}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--emerald-dark)', fontSize: '1rem' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.paymentMethod}</span>
                    </td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => setDeleteTargetId(p.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete payment record"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Record"
        message={`Are you sure you want to delete payment record #${deleteTargetId}?`}
        confirmText="Yes, Delete Record"
        loading={deleteLoading}
      />
    </div>
  )
}

export default MyPayments
