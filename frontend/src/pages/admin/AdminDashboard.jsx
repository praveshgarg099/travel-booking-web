import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { packageService } from '../../services/packageService'
import { destinationService } from '../../services/destinationService'
import { authService } from '../../services/authService'
import { bookingService } from '../../services/bookingService'
import { paymentAdminService } from '../../services/paymentAdminService'
import { reviewService } from '../../services/reviewService'
import { formatCurrency } from '../../utils/formatters'
import { seedBackendDatabase } from '../../data/demoData'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  Package,
  MapPin,
  Users,
  Calendar,
  Plus,
  ShieldCheck,
  ArrowRight,
  Server,
  Database,
  CreditCard,
  Star,
  DollarSign
} from 'lucide-react'

export const AdminDashboard = () => {
  const toast = useToast()
  const [stats, setStats] = useState({
    packagesCount: 0,
    destinationsCount: 0,
    usersCount: 0,
    bookingsCount: 0,
    paymentsCount: 0,
    totalRevenue: 0,
    reviewsCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const [pkgs, dests, users, bookings, payments, reviews] = await Promise.allSettled([
        packageService.getAllPackages(),
        destinationService.getAllDestinations(),
        authService.getAllUsers(),
        bookingService.getAllBookings(),
        paymentAdminService.getAllPayments(),
        reviewService.getAllReviews(),
      ])

      const paymentsList = payments.status === 'fulfilled' && Array.isArray(payments.value) ? payments.value : []
      const revenue = paymentsList.reduce((acc, p) => {
        return p.status === 'SUCCESS' ? acc + (Number(p.amount) || 0) : acc
      }, 0)

      setStats({
        packagesCount: pkgs.status === 'fulfilled' && Array.isArray(pkgs.value) ? pkgs.value.length : 0,
        destinationsCount: dests.status === 'fulfilled' && Array.isArray(dests.value) ? dests.value.length : 0,
        usersCount: users.status === 'fulfilled' && Array.isArray(users.value) ? users.value.length : 0,
        bookingsCount: bookings.status === 'fulfilled' && Array.isArray(bookings.value) ? bookings.value.length : 0,
        paymentsCount: paymentsList.length,
        totalRevenue: revenue,
        reviewsCount: reviews.status === 'fulfilled' && Array.isArray(reviews.value) ? reviews.value.length : 0,
      })
    } catch (err) {
      console.error('Failed to load admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const handleSeed = async () => {
    try {
      setIsSeeding(true)
      const res = await seedBackendDatabase(destinationService, packageService)
      toast.success(`Successfully seeded ${res.destinationsCount} destinations and ${res.packagesCount} packages!`)
      fetchAdminStats()
    } catch (err) {
      toast.error('Failed to seed data. Check console for details.')
    } finally {
      setIsSeeding(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Gathering server metrics..." fullPage />
  }

  const statCards = [
    {
      title: 'Packages',
      count: stats.packagesCount,
      icon: Package,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      link: '/admin/packages',
      subtext: 'Manage & Add Packages',
    },
    {
      title: 'Destinations',
      count: stats.destinationsCount,
      icon: MapPin,
      color: 'var(--emerald-dark)',
      bg: 'var(--emerald-light)',
      link: '/admin/destinations',
      subtext: 'Cities & locations',
    },
    {
      title: 'Total Bookings',
      count: stats.bookingsCount,
      icon: Calendar,
      color: 'var(--slate-800)',
      bg: 'var(--slate-100)',
      link: '/admin/bookings',
      subtext: 'Manage reservations',
    },
    {
      title: 'Completed Revenue',
      count: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: '#059669',
      bg: '#dcfce7',
      link: '/admin/payments',
      subtext: `${stats.paymentsCount} transactions`,
      isCurrency: true,
    },
    {
      title: 'Registered Users',
      count: stats.usersCount,
      icon: Users,
      color: '#b45309',
      bg: 'var(--amber-light)',
      link: '/admin/users',
      subtext: 'View user accounts',
    },
    {
      title: 'Traveler Reviews',
      count: stats.reviewsCount,
      icon: Star,
      color: '#d97706',
      bg: '#fef3c7',
      link: '/admin/reviews',
      subtext: 'Feedback & ratings',
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Administrator Console</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
          Real-time metrics connected directly to Spring Boot backend and PostgreSQL database.
        </p>
      </div>

      {/* 6 Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} to={card.link} className="card card-hover" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {card.title}
                </span>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: card.bg,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ fontSize: card.isCurrency ? '1.65rem' : '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {card.count}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {card.subtext} <ArrowRight size={14} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--slate-900)' }}>
          Quick Administration Actions
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/packages"
            id="admin-dashboard-add-package-btn"
            data-testid="admin-dashboard-add-package-btn"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Plus size={16} />
            + Add New Package
          </Link>
          <Link to="/admin/destinations" className="btn btn-secondary btn-sm">
            <Plus size={16} />
            Add Destination
          </Link>
          <Link to="/admin/bookings" className="btn btn-secondary btn-sm">
            <Calendar size={16} />
            Inspect Bookings
          </Link>
          <Link to="/admin/payments" className="btn btn-secondary btn-sm">
            <CreditCard size={16} />
            Manage Payments
          </Link>
          <Link to="/admin/users" className="btn btn-secondary btn-sm">
            <Users size={16} />
            Inspect User Accounts
          </Link>
          <Link to="/admin/reviews" className="btn btn-secondary btn-sm">
            <Star size={16} />
            Moderate Reviews
          </Link>
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="btn btn-sm"
            style={{
              backgroundColor: 'var(--amber-light)',
              color: '#b45309',
              border: '1px solid #fcd34d',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: isSeeding ? 'not-allowed' : 'pointer',
            }}
          >
            <Database size={16} />
            {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
          </button>
        </div>
      </div>

      {/* Backend API Grounding Info */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          border: '1.5px dashed var(--slate-300)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <Server size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--slate-800)' }}>
            Connected Spring Boot REST API
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          All package, destination, user, booking, payment, and review records directly execute Spring Boot JPA transactions against PostgreSQL. Role enforcement is validated on the backend by Spring Security with JWT Bearer tokens.
        </p>
      </div>
    </div>
  )
}

export default AdminDashboard
