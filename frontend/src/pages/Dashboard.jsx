import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bookingService } from '../services/bookingService'
import { paymentService } from '../services/paymentService'
import { reviewService } from '../services/reviewService'
import { packageService } from '../services/packageService'
import { formatCurrency, formatDate } from '../utils/formatters'
import BookingStatusBadge from '../components/bookings/BookingStatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Calendar, CreditCard, Star, Compass, ArrowRight, CheckCircle2 } from 'lucide-react'

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
          reviewService.getAllReviews(),
          packageService.getAllPackages(),
        ])

        if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value || [])
        if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value || [])

        if (packagesData.status === 'fulfilled' && packagesData.value) {
          const map = {}
          packagesData.value.forEach((p) => {
            map[p.id] = p.title
          })
          setPackagesMap(map)
        }

        if (reviewsData.status === 'fulfilled' && reviewsData.value && user) {
          const myRevs = reviewsData.value.filter(
            (r) => Number(r.userId) === Number(user.id)
          )
          setReviews(myRevs)
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
  const paidBookingIds = new Set(payments.map((p) => Number(p.bookingId)))

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." fullPage />
  }

  return (
    <div>
      {/* 1. Stat Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              My Bookings
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {bookings.length}
            </div>
          </div>
        </div>

        {/* Total Payments */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--emerald-light)',
              color: 'var(--emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Payments Made
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {payments.length}
            </div>
          </div>
        </div>

        {/* Reviews Left */}
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
            }}
          >
            <Star size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              My Reviews
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {reviews.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Recent Bookings Overview */}
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
          <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-900)' }}>Recent Bookings</h2>
          <Link to="/bookings" className="btn btn-outline btn-sm">
            View All ({bookings.length})
          </Link>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {bookings.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Compass size={40} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Active Bookings</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                You haven't reserved any travel packages yet.
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
                    <th>Booking ID</th>
                    <th>Package</th>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((booking) => {
                    const isPaid = paidBookingIds.has(Number(booking.id))
                    const packageName = packagesMap[booking.travelPackageId] || `Package #${booking.travelPackageId}`
                    return (
                      <tr key={booking.id}>
                        <td style={{ fontWeight: 700 }}>#{booking.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{packageName}</td>
                        <td>{formatDate(booking.bookingDate)}</td>
                        <td>{booking.numberOfPeople} guest{booking.numberOfPeople > 1 ? 's' : ''}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {formatCurrency(booking.totalAmount)}
                        </td>
                        <td>
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Link to={`/bookings/${booking.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.65rem' }}>
                              Details
                            </Link>
                            {!isPaid ? (
                              <Link to={`/checkout/${booking.id}`} className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.65rem' }}>
                                Pay Now
                              </Link>
                            ) : (
                              <span className="badge badge-success" style={{ padding: '0.3rem 0.5rem' }}>
                                Paid
                              </span>
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
    </div>
  )
}

export default Dashboard
