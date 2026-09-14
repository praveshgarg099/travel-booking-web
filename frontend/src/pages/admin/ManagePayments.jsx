import React, { useState, useEffect, useMemo } from 'react'
import { paymentAdminService } from '../../services/paymentAdminService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import PaymentDetailModal from '../../components/admin/PaymentDetailModal'
import { CreditCard, Search, Filter, Eye, DollarSign, Activity, XCircle, CheckCircle } from 'lucide-react'

export const ManagePayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState(null)
  
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

  // Calculate Revenue Dashboard Metrics
  const metrics = useMemo(() => {
    const defaultMetrics = { totalRevenue: 0, totalCount: 0, successCount: 0, failedCount: 0, pendingCount: 0 }
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
      
      // 3. Search Term (Payment ID, Customer Name, Email, Booking ID, Package)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesName = p.customerName?.toLowerCase().includes(lowerSearch)
        const matchesEmail = p.customerEmail?.toLowerCase().includes(lowerSearch)
        const matchesPackage = p.travelPackageName?.toLowerCase().includes(lowerSearch)
        const matchesId = p.paymentId?.toString().includes(lowerSearch)
        const matchesBookingId = p.bookingId?.toString().includes(lowerSearch)
        const matchesRzpPayId = p.razorpayPaymentId?.toLowerCase().includes(lowerSearch)
        const matchesRzpOrderId = p.razorpayOrderId?.toLowerCase().includes(lowerSearch)
        
        if (!matchesName && !matchesEmail && !matchesPackage && !matchesId && !matchesBookingId && !matchesRzpPayId && !matchesRzpOrderId) {
          return false
        }
      }
      return true
    })
  }, [payments, statusFilter, methodFilter, searchTerm])

  if (loading) return <LoadingSpinner />
  if (errorMsg) return <ErrorMessage message={errorMsg} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={24} color="#3b82f6" /> Manage Payments
        </h1>
      </div>

      {/* REVENUE DASHBOARD CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#16a34a', borderRadius: '50%' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Revenue (Success)</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(metrics.totalRevenue)}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '50%' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Transactions</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{metrics.totalCount}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '50%' }}>
            <XCircle size={24} />
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Failed Payments</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{metrics.failedCount}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {/* SEARCH & FILTERS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
            <Search size={18} color="#9ca3af" style={{ marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search by ID, Customer Name, Email, Booking ID, Package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="#6b7280" />
              <select
                className="input"
                style={{ padding: '0.5rem', width: 'auto', fontSize: '0.875rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="input"
                style={{ padding: '0.5rem', width: 'auto', fontSize: '0.875rem' }}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">All Methods</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="NET_BANKING">Net Banking</option>
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem' }}>Payment ID</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Booking & Package</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Method</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.paymentId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '1rem', fontWeight: '500', color: '#1f2937' }}>
                      <div>#{p.paymentId}</div>
                      {p.razorpayPaymentId && (
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace' }}>
                          {p.razorpayPaymentId}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>{p.customerName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.customerEmail}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '2px' }}>{p.travelPackageName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Booking #{p.bookingId}</p>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#059669' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                      {p.paymentMethod}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                      {p.paymentDate ? formatDate(p.paymentDate) : '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="btn btn-outline"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentDetailModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </div>
  )
}
