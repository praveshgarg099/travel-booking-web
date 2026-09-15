import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { bookingService } from '../../services/bookingService'
import { formatCurrency, getTodayDateString } from '../../utils/formatters'
import { Calendar, Users, ShieldCheck, CreditCard, Sparkles } from 'lucide-react'

export const BookingForm = ({ travelPackage, onBookingSuccess }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [bookingDate, setBookingDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const availableSeats = travelPackage.availableSeats || 0
  const isSoldOut = availableSeats <= 0
  const today = getTodayDateString()

  const unitPrice = travelPackage.price || 0
  const calculatedTotal = unitPrice * numberOfPeople

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    if (!bookingDate) {
      setErrorMsg('Please select a booking date.')
      return
    }

    if (bookingDate < today) {
      setErrorMsg('Booking date cannot be in the past.')
      return
    }

    if (numberOfPeople > availableSeats) {
      setErrorMsg(`Only ${availableSeats} seat(s) remaining for this package.`)
      return
    }

    try {
      setLoading(true)
      const payload = {
        numberOfPeople: Number(numberOfPeople),
        bookingDate,
        travelPackageId: travelPackage.id,
      }

      const createdBooking = await bookingService.createBooking(payload)
      toast.success('Booking confirmed successfully!')

      if (onBookingSuccess) {
        onBookingSuccess(createdBooking)
      } else {
        // Direct to checkout for payment or booking details
        navigate(`/checkout/${createdBooking.id}`)
      }
    } catch (err) {
      console.error('Booking failed:', err)
      setErrorMsg(err.message || 'Failed to create booking.')
      toast.error(err.message || 'Failed to create booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        boxShadow: 'var(--shadow-lg)',
        border: '1.5px solid var(--primary-light)',
        position: 'sticky',
        top: '90px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--slate-900)',
          color: 'var(--white)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>
            Price per person
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--white)' }}>
            {formatCurrency(unitPrice)}
          </div>
        </div>
        <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-success'}`}>
          {isSoldOut ? 'Sold Out' : `${availableSeats} Seats`}
        </span>
      </div>

      <div className="card-body">
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

        <form onSubmit={handleSubmit}>
          {/* Booking Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="bookingDate">
              <Calendar size={15} style={{ display: 'inline', marginRight: '4px' }} />
              Travel Date
            </label>
            <input
              id="bookingDate"
              type="date"
              className="form-control"
              min={today}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              disabled={isSoldOut || loading}
              required
            />
            <span className="form-hint">Departure must be today or in the future</span>
          </div>

          {/* Number of People */}
          <div className="form-group">
            <label className="form-label" htmlFor="numberOfPeople">
              <Users size={15} style={{ display: 'inline', marginRight: '4px' }} />
              Guests (Seats)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setNumberOfPeople((prev) => Math.max(1, prev - 1))}
                disabled={numberOfPeople <= 1 || isSoldOut || loading}
                style={{ width: '38px', height: '38px', padding: 0 }}
              >
                -
              </button>
              <input
                id="numberOfPeople"
                type="number"
                min="1"
                max={availableSeats || 1}
                className="form-control"
                style={{ textAlign: 'center', fontWeight: 700 }}
                value={numberOfPeople}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) setNumberOfPeople(Math.max(1, val))
                }}
                disabled={isSoldOut || loading}
                required
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setNumberOfPeople((prev) => Math.min(availableSeats, prev + 1))}
                disabled={numberOfPeople >= availableSeats || isSoldOut || loading}
                style={{ width: '38px', height: '38px', padding: 0 }}
              >
                +
              </button>
            </div>
          </div>

          {/* Calculated Cost Breakdown */}
          <div
            style={{
              background: 'var(--slate-50)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              margin: '1.25rem 0',
              border: '1px solid var(--slate-200)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              <span>Price per traveler</span>
              <span>{formatCurrency(unitPrice)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              <span>Number of travelers</span>
              <span>{numberOfPeople}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: 'var(--slate-600)',
                fontStyle: 'italic',
                marginBottom: '0.5rem',
              }}
            >
              <span>Calculation</span>
              <span>{formatCurrency(unitPrice)} × {numberOfPeople} traveler{numberOfPeople > 1 ? 's' : ''}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: 'var(--emerald-dark)',
                marginBottom: '0.75rem',
              }}
            >
              <span>Booking fee & Taxes</span>
              <span>Included</span>
            </div>
            <div
              style={{
                borderTop: '1px dashed var(--slate-300)',
                paddingTop: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Estimated Total</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
              * Calculated authoritatively by server upon reservation
            </p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSoldOut || loading}
          >
            {loading ? (
              'Confirming Booking...'
            ) : isSoldOut ? (
              'Package Sold Out'
            ) : !isAuthenticated ? (
              'Sign In to Reserve'
            ) : (
              'Reserve Package Now'
            )}
          </button>

          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={16} color="var(--emerald)" />
            <span>Instant confirmation & Secure checkout</span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingForm
