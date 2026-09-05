import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import { packageService } from '../services/packageService'
import PaymentForm from '../components/payments/PaymentForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { ArrowLeft } from 'lucide-react'

export const Payment = () => {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [travelPackage, setTravelPackage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const b = await bookingService.getBookingById(bookingId)
      setBooking(b)

      if (b.travelPackageId) {
        try {
          const pkg = await packageService.getPackageById(b.travelPackageId)
          setTravelPackage(pkg)
        } catch (e) {
          console.warn('Could not load package details for payment:', e)
        }
      }
    } catch (err) {
      console.error('Failed to load booking for payment:', err)
      setErrorMsg(err.message || 'Could not retrieve booking for checkout.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [bookingId])

  if (loading) {
    return <LoadingSpinner message="Preparing checkout with backend..." fullPage />
  }

  if (errorMsg || !booking) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <ErrorMessage
          title="Checkout Unavailable"
          message={errorMsg || 'Booking could not be loaded.'}
          onRetry={loadData}
        />
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/bookings" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to My Bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem 0 3rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
        <Link
          to={`/bookings/${booking.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--slate-600)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Booking #{booking.id}
        </Link>
      </div>

      <PaymentForm booking={booking} packageDetails={travelPackage} />
    </div>
  )
}

export default Payment
