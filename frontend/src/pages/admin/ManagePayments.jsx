import React, { useState, useEffect, useMemo } from 'react'
import { paymentAdminService } from '../../services/paymentAdminService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import PaymentDetailModal from '../../components/admin/PaymentDetailModal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import { useToast } from '../../context/ToastContext'
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  IndianRupee,
  Activity,
  XCircle,
  CheckCircle,
  RotateCcw,
  Banknote
} from 'lucide-react'

const formatPaymentMethod = (method) => {
  switch (method) {
    case 'CARD':
      return 'Card / Online'
    case 'UPI':
      return 'UPI'
    case 'NET_BANKING':
      return 'Net Banking'
    case 'CASH':
      return 'Cash on Arrival'
    default:
      return method || 'Pending Selection'
  }
}

export const ManagePayments = () => {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState(null)

  // Confirm Payment Modal
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')

  useEffect(() => {
    fetchAdminPayments()
  }, [])

  const fetchAdminPayments = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const data = await paymentAdminService.getAllPayments()
      setPayments(data || [])
    } catch (err) {
      console.error('Error fetching admin payments:', err)
      setErrorMsg(err.message || 'Failed to fetch payments.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!confirmTarget) return
    try {
      setConfirmLoading(true)
      await paymentAdminService.confirmPayment(confirmTarget.paymentId)
      toast.success(`Payment #${confirmTarget.paymentId} confirmed as SUCCESS. Booking #${confirmTarget.bookingId} is now CONFIRMED.`)
      setConfirmTarget(null)
      if (selectedPayment?.paymentId === confirmTarget.paymentId) {
        setSelectedPayment(null)
      }
      await fetchAdminPayments()
    } catch (err) {
      console.error('Failed to confirm payment:', err)
      toast.error(err.message || 'Could not confirm payment.')
    } finally {
      setConfirmLoading(false)
    }
  }

  // Calculate Revenue Dashboard Metrics
  const metrics = useMemo(() => {
    const defaultMetrics = { totalRevenue: 0, totalCount: 0, successCount: 0, failedCount: 0, pendingCount: 0, refundedCount: 0, refundedAmount: 0 }
    if (!payments || payments.length === 0) return defaultMetrics

    return payments.reduce((acc, curr) => {
      acc.totalCount += 1
      if (curr.status === 'SUCCESS') {
        acc.successCount += 1
        acc.totalRevenue += curr.amount || 0
      } else if (curr.status === 'FAILED') {
        acc.failedCount += 1
      } else if (curr.status === 'PENDING') {
        acc.pendingCount += 1
      } else if (curr.status === 'REFUNDED' || curr.status === 'PARTIALLY_REFUNDED') {
        acc.refundedCount += 1
        acc.refundedAmount += curr.refundAmount || curr.amount || 0
      }
      return acc
    }, defaultMetrics)
  }, [payments])

  // Apply filters and search
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false

      // 2. Method Filter
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false

      // 3. Search Term (Payment ID, Customer Name, Email, Booking ID, Package, Refund ID)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesName = p.customerName?.toLowerCase().includes(lowerSearch)
        const matchesEmail = p.customerEmail?.toLowerCase().includes(lowerSearch)
        const matchesPackage = p.travelPackageName?.toLowerCase().includes(lowerSearch)
        const matchesId = p.paymentId?.toString().includes(lowerSearch)
        const matchesBookingId = p.bookingId?.toString().includes(lowerSearch)
        const matchesRzpPayId = p.razorpayPaymentId?.toLowerCase().includes(lowerSearch)
        const matchesRzpOrderId = p.razorpayOrderId?.toLowerCase().includes(lowerSearch)
        const matchesRefundId = p.refundId?.toLowerCase().includes(lowerSearch)

        if (!matchesName && !matchesEmail && !matchesPackage && !matchesId && !matchesBookingId && !matchesRzpPayId && !matchesRzpOrderId && !matchesRefundId) {
          return false
        }
      }
      return true
    })
  }, [payments, statusFilter, methodFilter, searchTerm])

  if (loading) return <LoadingSpinner />
  if (errorMsg) return <ErrorMessage message={errorMsg} onRetry={fetchAdminPayments} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={26} color="#0284c7" /> Manage Payments & Refunds
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            Inspect financial transactions, verify cash payments, and issue Razorpay refunds.
          </p>
        </div>
      </div>

      {/* REVENUE DASHBOARD CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#16a34a', borderRadius: '50%' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Gross Revenue</p>
            <p style={{ fontSize: '1.45rem', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(metrics.totalRevenue)}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '50%' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total Transactions</p>
            <p style={{ fontSize: '1.45rem', fontWeight: '700', color: '#1f2937' }}>{metrics.totalCount}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#faf5ff', color: '#7e22ce', borderRadius: '50%' }}>
            <RotateCcw size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total Refunded ({metrics.refundedCount})</p>
            <p style={{ fontSize: '1.45rem', fontWeight: '700', color: '#7e22ce' }}>{formatCurrency(metrics.refundedAmount)}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '50%' }}>
            <XCircle size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Failed Payments</p>
            <p style={{ fontSize: '1.45rem', fontWeight: '700', color: '#1f2937' }}>{metrics.failedCount}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {/* SEARCH & FILTERS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
            <Search size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search by ID, Customer Name, Email, Booking ID, Package, Refund ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="input"
                style={{ padding: '0.45rem 0.65rem', width: 'auto', fontSize: '0.875rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="REFUNDED">Refunded</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="input"
                style={{ padding: '0.45rem 0.65rem', width: 'auto', fontSize: '0.875rem' }}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">All Methods</option>
                <option value="CARD">Card / Online</option>
                <option value="UPI">UPI</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash on Arrival</option>
              </select>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            message={searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' ? "Try adjusting your search or filters." : "There are no payment records in the system."}
          />
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--slate-600)', fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Booking & Package</th>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Method</th>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.65rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.65rem', textAlign: 'right', minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isRefundable = (p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED') && (p.amount > (p.refundAmount || 0))
                  const isPending = p.status === 'PENDING'

                  return (
                    <tr key={p.paymentId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '0.75rem 0.65rem', fontWeight: '600', color: 'var(--slate-900)' }}>
                        <div>#{p.paymentId}</div>
                        {p.razorpayPaymentId && (
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {p.razorpayPaymentId}
                          </div>
                        )}
                        {p.refundId && (
                          <div style={{ fontSize: '0.68rem', color: '#7e22ce', fontFamily: 'monospace', marginTop: '2px' }}>
                            {p.refundId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem' }}>
                        <p style={{ fontWeight: '600', color: 'var(--slate-900)', marginBottom: '2px', fontSize: '0.875rem' }}>{p.customerName || 'Unknown'}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.customerEmail || 'N/A'}</p>
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--slate-800)', fontWeight: 500, marginBottom: '2px' }}>{p.travelPackageName || 'Package'}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Booking #{p.bookingId}</p>
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem', fontWeight: '700', color: p.status === 'REFUNDED' ? '#7e22ce' : (p.status === 'FAILED' ? '#dc2626' : '#059669'), fontSize: '0.925rem' }}>
                        {formatCurrency(p.amount)}
                        {p.refundAmount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#7e22ce', fontWeight: 600 }}>
                            Refunded: {formatCurrency(p.refundAmount)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem', fontSize: '0.825rem', color: 'var(--slate-700)', fontWeight: 500 }}>
                        {formatPaymentMethod(p.paymentMethod)}
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem', fontSize: '0.825rem', color: '#64748b' }}>
                        {p.paymentDate ? formatDate(p.paymentDate) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem' }}>
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {isPending && (
                            <button
                              onClick={() => setConfirmTarget(p)}
                              className="btn btn-sm"
                              title="Confirm payment received (e.g. Cash on Arrival)"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: '#059669',
                                borderColor: '#059669',
                                color: '#fff'
                              }}
                            >
                              <CheckCircle size={13} /> Confirm
                            </button>
                          )}

                          {isRefundable && (
                            <button
                              onClick={() => setSelectedPayment(p)}
                              className="btn btn-warning btn-sm"
                              title="Issue refund via Razorpay"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <RotateCcw size={13} /> Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentDetailModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        onPaymentUpdated={() => fetchAdminPayments()}
        onRefundSuccess={() => fetchAdminPayments()}
      />

      {/* Confirm Payment Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmPayment}
        title="Confirm Payment Received"
        message={`Confirm that payment of ${confirmTarget ? formatCurrency(confirmTarget.amount) : ''} for Booking #${confirmTarget?.bookingId} has been collected? This will mark the payment as SUCCESS and the reservation as CONFIRMED.`}
        confirmText="Yes, Confirm Payment"
        confirmVariant="primary"
        loading={confirmLoading}
      />
    </div>
  )
}

export default ManagePayments
