import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bookingService } from '../services/bookingService'
import { paymentService } from '../services/paymentService'
import { reviewService } from '../services/reviewService'
import { packageService } from '../services/packageService'
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters'
import BookingStatusBadge from '../components/bookings/BookingStatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import {
  Calendar,
  CreditCard,
  Star,
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  User,
  ShieldCheck,
  Luggage,
} from 'lucide-react'

export const Dashboard = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [reviews, setReviews] = useState([])
  const [packagesMap, setPackagesMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [bookingsData, paymentsData, reviewsData, packagesData] = await Promise.allSettled([
          bookingService.getAllBookings(),
          paymentService.getAllPayments(),
          reviewService.getMyReviews(),
          packageService.getAllPackages(),
        ])

        if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value || [])
        if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value || [])
        if (reviewsData.status === 'fulfilled') setReviews(reviewsData.value || [])

        if (packagesData.status === 'fulfilled' && packagesData.value) {
          const map = {}
          packagesData.value.forEach((p) => {
            map[p.id] = p
          })
          setPackagesMap(map)
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Paid booking IDs set
  const paidBookingIds = useMemo(() => {
    return new Set(payments.filter((p) => p.status === 'SUCCESS').map((p) => Number(p.bookingId)))
  }, [payments])

  const today = getTodayDateString()

  // Real backend-derived metrics
  const { upcomingTrips, pastTrips, pendingPaymentBookings } = useMemo(() => {
    const upcoming = []
    const past = []
    const pending = []

    bookings.forEach((b) => {
      const isPaid = paidBookingIds.has(Number(b.id)) || b.status === 'CONFIRMED'
      if (b.status === 'CANCELLED') {
        // Skip cancelled from upcoming
      } else if (b.status === 'PENDING_PAYMENT' && !isPaid) {
        pending.push(b)
      } else if (isPaid) {
        if (b.bookingDate && b.bookingDate >= today) {
          upcoming.push(b)
        } else {
          past.push(b)
        }
      }
    })

    // Sort upcoming by departure date ascending
    upcoming.sort((a, b) => (a.bookingDate || '').localeCompare(b.bookingDate || ''))
    // Sort pending by ID descending (newest first)
    pending.sort((a, b) => b.id - a.id)

    return { upcomingTrips: upcoming, pastTrips: past, pendingPaymentBookings: pending }
  }, [bookings, paidBookingIds, today])

  const nextUpcomingTrip = upcomingTrips[0] || null

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." fullPage />
  }

  return (
    <div>
      {/* 1. Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--slate-900) 0%, #0369a1 100%)',
          color: 'var(--white)',
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#7dd3fc',
                marginBottom: '0.75rem',
              }}
            >
              <ShieldCheck size={14} /> Traveler Portal
            </span>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--white)', marginBottom: '0.35rem' }}>
              Welcome back, {user?.name || 'Traveler'}!
            </h1>
            <p style={{ color: '#e0f2fe', fontSize: '0.95rem', margin: 0, maxWidth: '560px', lineHeight: 1.5 }}>
              Track your verified reservations, manage upcoming tour schedules, and review your payment receipts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/packages" className="btn btn-accent" style={{ padding: '0.75rem 1.25rem' }}>
              <Compass size={16} /> Explore Packages
            </Link>
            <Link
              to="/profile"
              className="btn btn-outline"
              style={{ color: 'var(--white)', borderColor: 'rgba(255, 255, 255, 0.4)', padding: '0.75rem 1.25rem' }}
            >
              <User size={16} /> My Profile
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Pending Payment Alert Banner (if any) */}
      {pendingPaymentBookings.length > 0 && (
        <div
          className="card animate-fade-in"
          style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.975rem' }}>
                Pending Reservation Awaiting Payment ({pendingPaymentBookings.length})
              </div>
              <div style={{ fontSize: '0.875rem', color: '#b45309', marginTop: '0.15rem' }}>
                Booking #{pendingPaymentBookings[0].id} for "
                {packagesMap[pendingPaymentBookings[0].travelPackageId]?.title || `Package #${pendingPaymentBookings[0].travelPackageId}`}
                " requires payment to confirm your seat reservation.
              </div>
            </div>
          </div>

          <Link
            to={`/checkout/${pendingPaymentBookings[0].id}`}
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: '#b45309', borderColor: '#b45309', padding: '0.55rem 1.15rem' }}
          >
            Complete Payment ({formatCurrency(pendingPaymentBookings[0].totalAmount)})
          </Link>
        </div>
      )}

      {/* 3. Stat Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Bookings */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Bookings
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {bookings.length}
            </div>
          </div>
        </div>

        {/* Upcoming Trips */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              color: 'var(--emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Luggage size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Upcoming Trips
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--emerald-dark)' }}>
              {upcomingTrips.length}
            </div>
          </div>
        </div>

        {/* Payments Made */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--emerald-light)',
              color: 'var(--emerald-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Payments
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {payments.filter((p) => p.status === 'SUCCESS').length}
            </div>
          </div>
        </div>

        {/* My Reviews */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--amber-light)',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Star size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reviews Written
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {reviews.length}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Next Upcoming Journey Card (if exists) */}
      {nextUpcomingTrip && (
        <div
          className="card"
          style={{
            padding: '1.75rem',
            marginBottom: '2rem',
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--primary-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>
                <CheckCircle2 size={13} /> Next Upcoming Departure
              </span>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--slate-900)', marginTop: '0.25rem' }}>
                {packagesMap[nextUpcomingTrip.travelPackageId]?.title || `Package #${nextUpcomingTrip.travelPackageId}`}
              </h2>
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', color: 'var(--slate-600)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} color="var(--primary)" />
                  {formatDate(nextUpcomingTrip.bookingDate)}
                </span>
                <span>
                  <strong>Guests:</strong> {nextUpcomingTrip.numberOfPeople} traveler{nextUpcomingTrip.numberOfPeople > 1 ? 's' : ''}
                </span>
                <span>
                  <strong>Amount:</strong> {formatCurrency(nextUpcomingTrip.totalAmount)}
                </span>
              </div>
            </div>

            <Link to={`/bookings/${nextUpcomingTrip.id}`} className="btn btn-secondary btn-sm">
              <span>View Itinerary Details</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* 5. Recent Bookings Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-900)' }}>Recent Bookings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: 0 }}>
              Showing your most recent reservations
            </p>
          </div>
          <Link to="/bookings" className="btn btn-outline btn-sm">
            View All ({bookings.length})
          </Link>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {bookings.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <Compass size={44} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: 'var(--slate-800)' }}>No Travel Bookings Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                You have not booked any travel packages yet. Explore our curated destinations and reserve your departure!
              </p>
              <Link to="/packages" className="btn btn-primary btn-sm">
                Browse Travel Packages
              </Link>
            </div>
          ) : (
            <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Package Title</th>
                    <th>Travel Date</th>
                    <th>Guests</th>
                    <th>Total Amount</th>
                    <th>Booking Status</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((booking) => {
                    const isPaid = paidBookingIds.has(Number(booking.id)) || booking.status === 'CONFIRMED'
                    const packageObj = packagesMap[booking.travelPackageId]
                    const packageName = packageObj?.title || `Package #${booking.travelPackageId}`
                    return (
                      <tr key={booking.id}>
                        <td style={{ fontWeight: 700 }}>#{booking.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{packageName}</td>
                        <td>{formatDate(booking.bookingDate)}</td>
                        <td>
                          {booking.numberOfPeople} guest{booking.numberOfPeople > 1 ? 's' : ''}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {formatCurrency(booking.totalAmount)}
                        </td>
                        <td>
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td>
                          {isPaid ? (
                            <span className="badge badge-success">Paid</span>
                          ) : booking.status === 'CANCELLED' ? (
                            <span className="badge badge-neutral">Cancelled</span>
                          ) : (
                            <span className="badge badge-warning">Awaiting Payment</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <Link
                              to={`/bookings/${booking.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.65rem' }}
                            >
                              Details
                            </Link>
                            {booking.status === 'PENDING_PAYMENT' && !isPaid && (
                              <Link
                                to={`/checkout/${booking.id}`}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.25rem 0.65rem' }}
                              >
                                Pay Now
                              </Link>
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
      </div>

      {/* 6. Quick Access Navigation Hub */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <Link
          to="/packages"
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem' }}>Browse Tours</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Explore worldwide adventures</div>
          </div>
        </Link>

        <Link
          to="/bookings"
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: 'var(--emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem' }}>My Bookings</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage reservations & dates</div>
          </div>
        </Link>

        <Link
          to="/payments"
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--emerald-light)',
              color: 'var(--emerald-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem' }}>Payment Receipts</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View verified transactions</div>
          </div>
        </Link>

        <Link
          to="/reviews"
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--amber-light)',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem' }}>Traveler Reviews</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your feedback & ratings</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
