import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { paymentService } from '../services/paymentService'
import { bookingService } from '../services/bookingService'
import { packageService } from '../services/packageService'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useToast } from '../context/ToastContext'
import PaymentStatusBadge from '../components/payments/PaymentStatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import { CreditCard, Eye, ShieldCheck, Printer, Copy, Check } from 'lucide-react'

export const MyPayments = () => {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [bookingsMap, setBookingsMap] = useState({})
  const [packagesMap, setPackagesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const fetchPaymentsData = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const [paymentsData, bookingsData, packagesData] = await Promise.all([
        paymentService.getAllPayments(),
        bookingService.getAllBookings(),
        packageService.getAllPackages(),
      ])

      setPayments(paymentsData || [])

      const bMap = {}
      if (bookingsData) {
        bookingsData.forEach((b) => {
          bMap[b.id] = b
        })
      }
      setBookingsMap(bMap)

      const pMap = {}
      if (packagesData) {
        packagesData.forEach((p) => {
          pMap[p.id] = p.title
        })
      }
      setPackagesMap(pMap)
    } catch (err) {
      console.error('Error loading payments:', err)
      setErrorMsg(err.message || 'Could not fetch payment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return <LoadingSpinner message="Loading your payment history..." fullPage />
  }

  if (errorMsg) {
    return (
      <ErrorMessage
        title="Failed to Load Payments"
        message={errorMsg}
        onRetry={fetchPaymentsData}
      />
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>Payment Receipts & History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
          Official, permanent financial audit records verified by your backend and Razorpay gateway.
        </p>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Payment History Found"
          description="You have not completed any payments yet. Reserved bookings can be paid directly from your bookings list."
          actionText="View Bookings"
          actionLink="/bookings"
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Booking Ref</th>
                  <th>Package</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Method</th>
                  <th>Razorpay Reference</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const booking = bookingsMap[p.bookingId]
                  const packageTitle = booking
                    ? packagesMap[booking.travelPackageId] || `Package #${booking.travelPackageId}`
                    : 'Travel Itinerary'

                  return (
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
                      <td style={{ fontWeight: 600, color: 'var(--slate-800)', maxWidth: '200px' }}>
                        {packageTitle}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--emerald-dark)', fontSize: '1rem' }}>
                        {formatCurrency(p.amount)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--slate-600)' }}>
                        {p.currency || 'INR'}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{p.paymentMethod || 'ONLINE'}</span>
                      </td>
                      <td>
                        {p.razorpayPaymentId ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--slate-700)' }}>
                              {p.razorpayPaymentId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.razorpayPaymentId, p.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.15rem 0.35rem', height: 'auto' }}
                              title="Copy Payment ID"
                            >
                              {copiedId === p.id ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A (Cash)</span>
                        )}
                      </td>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td>
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedReceipt({ payment: p, packageTitle, booking })}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Eye size={14} />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Official Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Official Transaction Receipt"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--slate-200)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--emerald-dark)' }}>
                <ShieldCheck size={20} />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Payment Confirmed & Verified</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Payment ID
                  </span>
                  <strong>#{selectedReceipt.payment.id}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Booking Reference
                  </span>
                  <strong>#{selectedReceipt.payment.bookingId}</strong>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Travel Package
                  </span>
                  <strong style={{ color: 'var(--slate-900)' }}>{selectedReceipt.packageTitle}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Amount Paid
                  </span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--emerald-dark)' }}>
                    {formatCurrency(selectedReceipt.payment.amount)}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Currency
                  </span>
                  <strong>INR (₹)</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Payment Method
                  </span>
                  <strong>{selectedReceipt.payment.paymentMethod || 'ONLINE'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Payment Status
                  </span>
                  <strong style={{ color: 'var(--emerald-dark)' }}>
                    {selectedReceipt.payment.status || 'SUCCESS'}
                  </strong>
                </div>

                {bookingsMap[selectedReceipt.payment.bookingId] && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                      Travelers Breakdown
                    </span>
                    <span>
                      {bookingsMap[selectedReceipt.payment.bookingId].numberOfPeople} traveler(s) — Total {formatCurrency(selectedReceipt.payment.amount)}
                    </span>
                  </div>
                )}

                {selectedReceipt.payment.razorpayPaymentId && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                      Razorpay Payment Reference
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {selectedReceipt.payment.razorpayPaymentId}
                    </span>
                  </div>
                )}

                {selectedReceipt.payment.razorpayOrderId && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                      Razorpay Order ID
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {selectedReceipt.payment.razorpayOrderId}
                    </span>
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>
                    Transaction Timestamp
                  </span>
                  <span>{formatDate(selectedReceipt.payment.paymentDate)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MyPayments
