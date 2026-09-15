import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import { packageService } from '../services/packageService'
import { paymentService } from '../services/paymentService'
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters'
import { useToast } from '../context/ToastContext'
import BookingStatusBadge from '../components/bookings/BookingStatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import ConfirmationDialog from '../components/common/ConfirmationDialog'
import Modal from '../components/common/Modal'
import { ArrowLeft, Calendar, Users, CreditCard, Edit3, Trash2, CheckCircle2, ShieldCheck, AlertCircle, Printer, Star } from 'lucide-react'

export const BookingDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [booking, setBooking] = useState(null)
  const [travelPackage, setTravelPackage] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Edit booking state
  const [isEditing, setIsEditing] = useState(false)
  const [editPeople, setEditPeople] = useState(1)
  const [editDate, setEditDate] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Cancel state
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchDetails = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const b = await bookingService.getBookingById(id)
      setBooking(b)
      setEditPeople(b.numberOfPeople)
      setEditDate(b.bookingDate)

      // Fetch package
      try {
        const p = await packageService.getPackageById(b.travelPackageId)
        setTravelPackage(p)
      } catch (err) {
        console.warn('Could not load package info:', err)
      }

      // Check if paid
      try {
        const payments = await paymentService.getAllPayments()
        const match = payments.find((pay) => Number(pay.bookingId) === Number(b.id) && pay.status === 'SUCCESS')
          || payments.find((pay) => Number(pay.bookingId) === Number(b.id))
        setPayment(match || null)
      } catch (err) {
        console.warn('Could not check payments:', err)
      }
    } catch (err) {
      console.error('Error fetching booking details:', err)
      setErrorMsg(err.message || 'Could not load booking details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id])

  const handleUpdateBooking = async (e) => {
    e.preventDefault()
    setEditError('')

    const today = getTodayDateString()
    if (editDate < today) {
      setEditError('Booking date cannot be in the past.')
      return
    }

    try {
      setEditLoading(true)
      const payload = {
        numberOfPeople: Number(editPeople),
        bookingDate: editDate,
        travelPackageId: booking.travelPackageId,
      }

      const updated = await bookingService.updateBooking(booking.id, payload)
      setBooking(updated)
      setIsEditing(false)
      toast.success('Booking updated successfully!')
      fetchDetails()
    } catch (err) {
      console.error('Update booking failed:', err)
      setEditError(err.message || 'Failed to update booking.')
      toast.error(err.message || 'Failed to update booking.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    try {
      setCancelLoading(true)
      await bookingService.deleteBooking(booking.id)
      toast.success('Booking has been cancelled.')
      navigate('/bookings')
    } catch (err) {
      console.error('Cancellation failed:', err)
      toast.error(err.message || 'Failed to cancel booking.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading booking details..." fullPage />
  }

  if (errorMsg || !booking) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <ErrorMessage
          title="Booking Not Found"
          message={errorMsg || 'Unable to retrieve the requested booking.'}
          onRetry={fetchDetails}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/bookings" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to My Bookings
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = (payment && payment.status === 'SUCCESS') || booking.status === 'CONFIRMED'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/bookings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--slate-600)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Bookings
        </Link>
      </div>

      <div className="card" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--slate-900), var(--slate-800))',
            color: 'var(--white)',
            padding: '1.75rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textTransform: 'uppercase' }}>
              Booking Reference
            </span>
            <h1 style={{ color: 'var(--white)', fontSize: '1.65rem' }}>Reservation #{booking.id}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookingStatusBadge status={booking.status} />
            {isPaid ? (
              <span className="badge badge-success">Paid</span>
            ) : (
              <span className="badge badge-warning">Awaiting Payment</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="card-body" style={{ padding: '2rem' }}>
          {/* Package Info */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              {travelPackage?.title || `Package #${booking.travelPackageId}`}
            </h2>
            {travelPackage?.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {travelPackage.description}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              background: 'var(--slate-50)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              border: '1px solid var(--slate-200)',
              marginBottom: '2rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Departure Date
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
                <Calendar size={18} color="var(--primary)" />
                {formatDate(booking.bookingDate)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Travelers
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
                <Users size={18} color="var(--primary)" />
                {booking.numberOfPeople} person{booking.numberOfPeople > 1 ? 's' : ''}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Price per Traveler
              </span>
              <div style={{ fontWeight: 700, marginTop: '0.25rem', color: 'var(--slate-800)' }}>
                {travelPackage ? formatCurrency(travelPackage.price) : '—'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Authoritative Total (INR)
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '0.25rem' }}>
                {formatCurrency(booking.totalAmount)}
              </div>
            </div>
          </div>

          {/* Payment Status Box */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: `1.5px solid ${isPaid ? 'var(--emerald)' : booking.status === 'CANCELLED' ? 'var(--rose)' : 'var(--amber)'}`,
              backgroundColor: isPaid ? 'var(--emerald-light)' : booking.status === 'CANCELLED' ? 'var(--rose-light)' : 'var(--amber-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isPaid ? (
                <CheckCircle2 size={24} color="var(--emerald-dark)" />
              ) : (
                <AlertCircle size={24} color={booking.status === 'CANCELLED' ? 'var(--rose)' : '#b45309'} />
              )}
              <div>
                <div style={{ fontWeight: 700, color: isPaid ? 'var(--emerald-dark)' : booking.status === 'CANCELLED' ? 'var(--rose)' : '#b45309', fontSize: '0.95rem' }}>
                  {isPaid ? 'Payment Confirmed' : booking.status === 'CANCELLED' ? 'Booking Cancelled' : 'Payment Pending'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--slate-700)' }}>
                  {isPaid
                    ? (payment ? `Payment ID #${payment.id} via ${payment.paymentMethod || 'Online'}` : 'Reservation is confirmed and verified.')
                    : booking.status === 'CANCELLED'
                    ? 'This booking was cancelled and is no longer active.'
                    : 'Reserve this itinerary by completing the Razorpay payment.'}
                </div>
              </div>
            </div>

            {!isPaid && booking.status === 'PENDING_PAYMENT' && (
              <Link to={`/checkout/${booking.id}`} className="btn btn-primary btn-sm">
                <CreditCard size={16} />
                Pay {formatCurrency(booking.totalAmount)}
              </Link>
            )}
          </div>

          {/* Actions Bar */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {!isPaid && booking.status !== 'CANCELLED' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Edit3 size={16} />
                  Update Date & Seats
                </button>
              )}

              {isPaid && (
                <>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Printer size={16} />
                    Print Confirmation
                  </button>

                  <Link
                    to={`/packages/${booking.travelPackageId}`}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Star size={16} color="#b45309" />
                    Review Package
                  </Link>
                </>
              )}
            </div>

            {!isPaid && booking.status !== 'CANCELLED' && (
              <button
                onClick={() => setIsCancelOpen(true)}
                className="btn btn-danger btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Trash2 size={16} />
                Cancel Reservation
              </button>
            )}

            {isPaid && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Reservation confirmed. For changes or refunds, please contact support.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Booking Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Update Booking Details">
        <form onSubmit={handleUpdateBooking}>
          {editError && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--rose-light)',
                color: 'var(--rose)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {editError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="editDate">
              New Travel Date
            </label>
            <input
              id="editDate"
              type="date"
              className="form-control"
              min={getTodayDateString()}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              disabled={editLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="editPeople">
              Number of Guests
            </label>
            <input
              id="editPeople"
              type="number"
              min="1"
              max={50}
              className="form-control"
              value={editPeople}
              onChange={(e) => setEditPeople(e.target.value)}
              disabled={editLoading}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
              disabled={editLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel This Reservation?"
        message="Cancelling this booking will release your reserved seats back to the available seat pool."
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        loading={cancelLoading}
      />
    </div>
  )
}

export default BookingDetails
