import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../../services/bookingService'
import { packageService } from '../../services/packageService'
import { paymentAdminService } from '../../services/paymentAdminService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Trash2,
  Users,
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  FileDown,
  Loader2
} from 'lucide-react'

export const ManageBookings = () => {
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [packagesMap, setPackagesMap] = useState({})
  const [paymentsMap, setPaymentsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal targets
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Voucher download state
  const [downloadingId, setDownloadingId] = useState(null)

  const handleDownloadVoucher = async (bookingId) => {
    try {
      setDownloadingId(bookingId)
      await bookingService.downloadVoucher(bookingId)
      toast.success(`Voucher for Booking #${bookingId} downloaded!`)
    } catch (err) {
      console.error('Failed to download voucher:', err)
      toast.error(`Failed to download voucher for Booking #${bookingId}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const fetchAdminBookings = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const [bookingsData, pkgsData, paymentsData] = await Promise.allSettled([
        bookingService.getAllBookings(),
        packageService.getAllPackages(),
        paymentAdminService.getAllPayments(),
      ])

      const bList = bookingsData.status === 'fulfilled' ? bookingsData.value || [] : []
      setBookings(bList)

      const pMap = {}
      if (pkgsData.status === 'fulfilled' && pkgsData.value) {
        pkgsData.value.forEach((p) => {
          pMap[p.id] = p
        })
      }
      setPackagesMap(pMap)

      const payMap = {}
      if (paymentsData.status === 'fulfilled' && Array.isArray(paymentsData.value)) {
        const sortedPayments = [...paymentsData.value].sort((a, b) => (a.paymentId || 0) - (b.paymentId || 0))
        sortedPayments.forEach((pay) => {
          const current = payMap[pay.bookingId]
          if (!current) {
            payMap[pay.bookingId] = pay
          } else if (current.status === 'SUCCESS' || current.status === 'REFUNDED' || current.status === 'PARTIALLY_REFUNDED') {
            if (pay.status === 'SUCCESS' || pay.status === 'REFUNDED' || pay.status === 'PARTIALLY_REFUNDED') {
              payMap[pay.bookingId] = pay
            }
          } else {
            payMap[pay.bookingId] = pay
          }
        })
      }
      setPaymentsMap(payMap)
    } catch (err) {
      console.error('Error fetching admin bookings:', err)
      setErrorMsg(err.message || 'Failed to fetch bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminBookings()
  }, [])

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    try {
      setCancelLoading(true)
      await bookingService.cancelBooking(cancelTarget.id)
      toast.success(`Booking #${cancelTarget.id} cancelled successfully. Seats returned and payment audit records preserved.`)
      setCancelTarget(null)
      await fetchAdminBookings()
    } catch (err) {
      console.error('Failed to cancel booking:', err)
      toast.error(err.message || 'Could not cancel booking.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      await bookingService.deleteBooking(deleteTarget.id)
      toast.success(`Booking #${deleteTarget.id} deleted successfully.`)
      setDeleteTarget(null)
      await fetchAdminBookings()
    } catch (err) {
      console.error('Failed to delete booking:', err)
      toast.error(err.message || 'Could not delete booking.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const summary = {
      totalCount: bookings.length,
      confirmedCount: 0,
      cancelledCount: 0,
      pendingCount: 0,
      totalBookingValue: 0,
    }

    bookings.forEach((b) => {
      summary.totalBookingValue += b.totalAmount || 0
      const s = b.status?.toUpperCase()
      if (s === 'CONFIRMED') summary.confirmedCount += 1
      else if (s === 'CANCELLED') summary.cancelledCount += 1
      else if (s === 'PENDING') summary.pendingCount += 1
    })

    return summary
  }, [bookings])

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && b.status?.toUpperCase() !== statusFilter) {
        return false
      }

      // 2. Search Term
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const idMatch = b.id?.toString().includes(q)
        const customerMatch = b.customerName?.toLowerCase().includes(q)
        const emailMatch = b.customerEmail?.toLowerCase().includes(q)
        const pkgMatch = (b.packageTitle || packagesMap[b.travelPackageId]?.title)?.toLowerCase().includes(q)
        const userMatch = b.userId?.toString().includes(q)

        if (!idMatch && !customerMatch && !emailMatch && !pkgMatch && !userMatch) {
          return false
        }
      }

      return true
    })
  }, [bookings, statusFilter, searchTerm, packagesMap])

  if (loading) {
    return <LoadingSpinner message="Loading all booking records..." fullPage />
  }

  if (errorMsg) {
    return <ErrorMessage message={errorMsg} onRetry={fetchAdminBookings} />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} color="var(--primary)" /> Manage Bookings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            Inspect, track, and manage all traveler reservations across all customer accounts.
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Bookings</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>{metrics.totalCount}</p>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#16a34a', borderRadius: '50%' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Confirmed</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{metrics.confirmedCount}</p>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '50%' }}>
            <XCircle size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Cancelled</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{metrics.cancelledCount}</p>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#d97706', borderRadius: '50%' }}>
            <IndianRupee size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Booking Value</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{formatCurrency(metrics.totalBookingValue)}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {/* SEARCH & FILTERS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
            <Search size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search by ID, Customer, Email, Package title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--slate-600)" />
            <select
              className="input"
              style={{ padding: '0.5rem', width: 'auto', fontSize: '0.875rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Bookings Found"
            description={searchTerm || statusFilter !== 'ALL' ? 'Try adjusting your search query or filter.' : 'No reservations found in the database.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--slate-600)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Booking</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Package</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date & Guests</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const pkg = packagesMap[b.travelPackageId]
                  const pkgTitle = b.packageTitle || pkg?.title || `Package #${b.travelPackageId}`
                  const pay = paymentsMap[b.id]
                  const isCancelled = b.status?.toUpperCase() === 'CANCELLED'

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row-hover">
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                        #{b.id}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: 600, color: 'var(--slate-900)', marginBottom: '2px' }}>
                          {b.customerName || `User #${b.userId}`}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {b.customerEmail || `ID: #${b.userId}`}
                        </p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '2px', maxWidth: '200px' }}>
                          {pkgTitle}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Package ID #{b.travelPackageId}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                        <div>{formatDate(b.bookingDate)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {b.numberOfPeople} traveler{b.numberOfPeople > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {pay ? (
                          <>
                            <PaymentStatusBadge status={pay.status} />
                            {isCancelled && pay.status === 'SUCCESS' && (
                              <Link
                                to="/admin/payments"
                                style={{ display: 'block', fontSize: '0.72rem', color: '#7e22ce', fontWeight: 600, marginTop: '4px', textDecoration: 'none' }}
                                title="Go to Manage Payments to process refund"
                              >
                                Refund Eligible →
                              </Link>
                            )}
                          </>
                        ) : (
                          <span className="badge badge-warning">Unpaid</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleDownloadVoucher(b.id)}
                            disabled={downloadingId === b.id}
                            className="btn btn-outline btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              borderColor: '#cbd5e1',
                              color: '#1e3a8a',
                              padding: '0.25rem 0.6rem'
                            }}
                            title="Download official PDF trip voucher & tax invoice"
                          >
                            {downloadingId === b.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <FileDown size={13} />
                            )}
                            Voucher
                          </button>

                          <Link
                            to={`/bookings/${b.id}`}
                            className="btn btn-secondary btn-sm"
                            title="Open full booking details"
                          >
                            <Eye size={14} /> Details
                          </Link>

                          {/* Show Cancel / Void for active (not cancelled) bookings */}
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelTarget(b)}
                              className="btn btn-warning btn-sm"
                              title="Cancel / void booking, restore seats and preserve audit records"
                            >
                              <XCircle size={14} /> Cancel / Void
                            </button>
                          )}

                          {/* Never show Delete for confirmed or successfully paid bookings */}
                          {!((b.status?.toUpperCase() === 'CONFIRMED') || (pay?.status === 'SUCCESS')) && (
                            <button
                              onClick={() => setDeleteTarget(b)}
                              className="btn btn-danger btn-sm"
                              title="Permanently delete unfinalized booking"
                            >
                              <Trash2 size={14} /> Delete
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

      {/* Cancel / Void Confirmation Modal */}
      <ConfirmationDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel / Void Traveler Booking"
        message={
          cancelTarget ? (
            <div style={{ textAlign: 'left', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
                Are you sure you want to cancel/void booking #{cancelTarget.id}?
              </p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>The booking status will become <strong>CANCELLED</strong>.</li>
                <li>{cancelTarget.numberOfPeople || 1} reserved seat(s) will be returned to the travel package.</li>
                <li>All successful payment and financial audit records will be <strong>strictly preserved</strong>.</li>
                <li>Any pending payment attempts will be marked as <strong>FAILED</strong>.</li>
                <li style={{ marginTop: '0.4rem', color: '#b45309', fontWeight: 600 }}>
                  Note: This administrative action voids the reservation and does not automatically issue a payment refund.
                </li>
              </ul>
            </div>
          ) : ''
        }
        confirmText="Yes, Cancel Booking"
        confirmVariant="warning"
        loading={cancelLoading}
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Booking"
        message={
          deleteTarget ? (
            <div style={{ textAlign: 'left', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
                Are you sure you want to permanently delete booking #{deleteTarget.id}?
              </p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>This permanently removes the booking and non-finalized payment records from the database.</li>
                <li>This operation cannot be undone.</li>
                {deleteTarget.status !== 'CANCELLED' && (
                  <li>{deleteTarget.numberOfPeople || 1} seat(s) will be returned to the package.</li>
                )}
              </ul>
            </div>
          ) : ''
        }
        confirmText="Yes, Delete Permanently"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}

export default ManageBookings
