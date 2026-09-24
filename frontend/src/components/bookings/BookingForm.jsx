import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { bookingService } from '../../services/bookingService'
import { formatCurrency, getTodayDateString } from '../../utils/formatters'
import { Calendar, Users, ShieldCheck, CreditCard, Sparkles, CheckCircle, Info } from 'lucide-react'

export const BookingForm = ({ travelPackage, onBookingSuccess }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [bookingDate, setBookingDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const availableSeats = travelPackage?.availableSeats || 0
  const isSoldOut = availableSeats <= 0
  const today = getTodayDateString()

  const unitPrice = travelPackage?.price || 0
  const calculatedTotal = unitPrice * numberOfPeople

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    if (!bookingDate) {
      setErrorMsg('Please select a travel departure date.')
      return
    }

    if (bookingDate < today) {
      setErrorMsg('Travel departure date cannot be in the past.')
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
      toast.success('Reservation initiated successfully!')

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
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: '90px',
      }}
    >
      {/* Top Price Header */}
      <div
        style={{
          backgroundColor: 'var(--slate-900)',
          color: 'var(--white)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Price per traveler
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)', marginTop: '0.2rem' }}>
            {formatCurrency(unitPrice)}
          </div>
        </div>
        <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
          {isSoldOut ? 'Sold Out' : `${availableSeats} Seats Left`}
        </span>
      </div>

      <div className="card-body" style={{ padding: '1.75rem' }}>
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '1.25rem',
              border: '1px solid #fca5a5',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Booking Date */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="bookingDate" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} color="var(--primary)" />
              Departure Date
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
              style={{ fontSize: '0.95rem' }}
            />
            <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Choose a date starting from today onwards
            </span>
          </div>

          {/* Number of People */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="numberOfPeople" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={16} color="var(--primary)" />
              Number of Guests
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNumberOfPeople((prev) => Math.max(1, prev - 1))}
                disabled={numberOfPeople <= 1 || isSoldOut || loading}
                style={{ width: '42px', height: '42px', padding: 0, fontSize: '1.2rem', fontWeight: 700 }}
                aria-label="Decrease travelers"
              >
                −
              </button>
              <input
                id="numberOfPeople"
                type="number"
                min="1"
                max={availableSeats || 1}
                className="form-control"
                style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', height: '42px' }}
                value={numberOfPeople}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) setNumberOfPeople(Math.max(1, Math.min(availableSeats || 10, val)))
                }}
                disabled={isSoldOut || loading}
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNumberOfPeople((prev) => Math.min(availableSeats, prev + 1))}
                disabled={numberOfPeople >= availableSeats || isSoldOut || loading}
                style={{ width: '42px', height: '42px', padding: 0, fontSize: '1.2rem', fontWeight: 700 }}
                aria-label="Increase travelers"
              >
                +
              </button>
            </div>
          </div>

          {/* Transparent Cost Breakdown */}
          <div
            style={{
              background: 'var(--slate-50)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              <span>Base Fare ({numberOfPeople} {numberOfPeople > 1 ? 'travelers' : 'traveler'})</span>
              <span>{formatCurrency(unitPrice * numberOfPeople)}</span>
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
              <span>Taxes, permits & GST</span>
              <span style={{ fontWeight: 600 }}>All-inclusive</span>
            </div>

            <div
              style={{
                borderTop: '1px dashed var(--slate-300)',
                paddingTop: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '1rem' }}>Total Amount</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSoldOut || loading}
            style={{ fontWeight: 700, padding: '0.85rem 1rem' }}
          >
            {loading ? (
              'Securing Reservation...'
            ) : isSoldOut ? (
              'Package Sold Out'
            ) : !isAuthenticated ? (
              'Sign In to Book'
            ) : (
              'Reserve Package Now'
            )}
          </button>

          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={16} color="var(--emerald)" />
            <span>Instant Confirmation & Free Cancellation Guarantee</span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingForm
