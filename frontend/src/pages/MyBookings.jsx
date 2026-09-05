import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import { packageService } from '../services/packageService'
import { paymentService } from '../services/paymentService'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useToast } from '../context/ToastContext'
import BookingStatusBadge from '../components/bookings/BookingStatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import ConfirmationDialog from '../components/common/ConfirmationDialog'
import { Calendar, Trash2, CreditCard, ArrowRight, Compass, Eye } from 'lucide-react'

export const MyBookings = () => {
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [packagesMap, setPackagesMap] = useState({})
  const [paidBookingIds, setPaidBookingIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const [bookingsData, pkgsData, paymentsData] = await Promise.all([
        bookingService.getAllBookings(),
        packageService.getAllPackages(),
        paymentService.getAllPayments(),
      ])

      setBookings(bookingsData || [])

      const map = {}
      if (pkgsData) {
        pkgsData.forEach((p) => {
          map[p.id] = p
        })
      }
      setPackagesMap(map)

      if (paymentsData) {
        setPaidBookingIds(new Set(paymentsData.map((p) => Number(p.bookingId))))
      }
    } catch (err) {
      console.error('Failed to load bookings:', err)
      setErrorMsg(err.message || 'Could not load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleConfirmCancel = async () => {
    if (!deleteTargetId) return
    try {
      setDeleteLoading(true)
      await bookingService.deleteBooking(deleteTargetId)
      toast.success(`Booking #${deleteTargetId} has been cancelled.`)
      setBookings((prev) => prev.filter((b) => b.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Failed to cancel booking:', err)
      toast.error(err.message || 'Could not cancel booking.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Retrieving your bookings..." fullPage />
  }

  if (errorMsg) {
    return (
      <ErrorMessage
        title="Failed to Load Bookings"
        message={errorMsg}
        onRetry={fetchBookings}
      />
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>My Bookings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            View and manage your tour reservations and departure schedules.
          </p>
        </div>
        <Link to="/packages" className="btn btn-primary btn-sm">
          <Compass size={16} />
          Book New Package
        </Link>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Travel Bookings Yet"
          description="You haven't made any package bookings yet. Discover our top destinations and reserve your journey!"
          actionText="Explore Packages"
          actionLink="/packages"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.map((b) => {
            const pkg = packagesMap[b.travelPackageId]
            const isPaid = paidBookingIds.has(Number(b.id))

            return (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                }}
              >
                {/* Left info */}
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Booking #{b.id}
                    </span>
                    <BookingStatusBadge status={b.status} />
                    {isPaid ? (
                      <span className="badge badge-success">Payment Received</span>
                    ) : (
                      <span className="badge badge-warning">Unpaid</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                    {pkg?.title || `Travel Package #${b.travelPackageId}`}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                      color: 'var(--slate-600)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span>
                      <strong>Date:</strong> {formatDate(b.bookingDate)}
                    </span>
                    <span>
                      <strong>Guests:</strong> {b.numberOfPeople} person{b.numberOfPeople > 1 ? 's' : ''}
                    </span>
                    {pkg?.duration && (
                      <span>
                        <strong>Duration:</strong> {pkg.duration} Days
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                      Total Amount
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      {formatCurrency(b.totalAmount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/bookings/${b.id}`} className="btn btn-secondary btn-sm" title="View details & edit">
                      <Eye size={15} />
                      Details
                    </Link>

                    {!isPaid && (
                      <Link to={`/checkout/${b.id}`} className="btn btn-primary btn-sm">
                        <CreditCard size={15} />
                        Pay Now
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(b.id)}
                      className="btn btn-danger btn-sm"
                      title="Cancel booking"
                    >
                      <Trash2 size={15} />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Travel Booking"
        message={`Are you sure you want to cancel booking #${deleteTargetId}? Your reserved seats will be returned to the travel package.`}
        confirmText="Yes, Cancel Booking"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}

export default MyBookings
