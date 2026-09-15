import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../../services/bookingService'
import { packageService } from '../../services/packageService'
import { paymentAdminService } from '../../services/paymentAdminService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
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
  Briefcase
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

  // Cancel target
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)

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
      if (paymentsData.status === 'fulfilled' && paymentsData.value) {
        paymentsData.value.forEach((pay) => {
          payMap[pay.bookingId] = pay
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
    if (!cancelTargetId) return
    try {
      setCancelLoading(true)
      await bookingService.deleteBooking(cancelTargetId)
      toast.success(`Booking #${cancelTargetId} cancelled successfully. Seats returned to package.`)
      // Refresh list
      await fetchAdminBookings()
      setCancelTargetId(null)
    } catch (err) {
      console.error('Failed to cancel booking:', err)
      toast.error(err.message || 'Could not cancel booking.')
    } finally {
      setCancelLoading(false)
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
                          <span className={`badge ${pay.status === 'SUCCESS' ? 'badge-success' : pay.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
                            {pay.status === 'SUCCESS' ? 'Paid' : pay.status}
                          </span>
                        ) : (
                          <span className="badge badge-warning">Unpaid</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            to={`/bookings/${b.id}`}
                            className="btn btn-secondary btn-sm"
                            title="Open full booking details"
                          >
                            <Eye size={14} /> Details
                          </Link>
                          <button
                            onClick={() => setCancelTargetId(b.id)}
                            className="btn btn-danger btn-sm"
                            title={pay?.status === 'SUCCESS' ? "Warning: Paid reservation. Deletion will remove financial record" : "Permanently delete booking"}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        onConfirm={handleConfirmCancel}
        title="Delete Traveler Booking"
        message={`Are you sure you want to permanently delete booking #${cancelTargetId}? The reservation will be removed from the database and the ${
          bookings.find((x) => x.id === cancelTargetId)?.numberOfPeople || ''
        } seat(s) will be returned to the travel package.${
          paymentsMap[cancelTargetId]?.status === 'SUCCESS'
            ? ' WARNING: This booking has a completed payment record that will also be removed by the server.'
            : ''
        }`}
        confirmText="Yes, Delete Booking"
        confirmVariant="danger"
        loading={cancelLoading}
      />
    </div>
  )
}

export default ManageBookings
