import React from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Calendar, CreditCard, User, Star, ShieldCheck } from 'lucide-react'

export const DashboardLayout = () => {
  const { user } = useAuth()

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/bookings', label: 'My Bookings', icon: Calendar },
    { to: '/payments', label: 'My Payments', icon: CreditCard },
    { to: '/reviews', label: 'Reviews', icon: Star },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', padding: '2.5rem 0' }}>
        <div className="container">
          {user?.role === 'ADMIN' && (
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1.5px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                <ShieldCheck size={18} />
                <span>Administrator Session Active</span>
              </div>
              <Link to="/admin/packages" id="traveler-dashboard-admin-packages-link" className="btn btn-primary btn-sm">
                + Add New Package / Manage Packages →
              </Link>
            </div>
          )}
          {/* Welcome header banner */}
          <div
            className="card"
            style={{
              padding: '1.75rem 2rem',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: 'var(--white)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primary-light)',
                }}
              >
                Traveler Portal
              </span>
              <h1 style={{ color: 'var(--white)', fontSize: '1.85rem', marginTop: '0.25rem' }}>
                Welcome back, {user?.name || 'Traveler'}!
              </h1>
              <p style={{ color: 'var(--slate-300)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                Manage your journeys, track payments, and review your vacation experiences.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-success" style={{ padding: '0.45rem 0.85rem' }}>
                Verified Member
              </span>
            </div>
          </div>

          {/* Main Dashboard Grid: Sidebar + Content */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
            className="dashboard-grid"
          >
            {/* Sidebar Navigation */}
            <aside
              className="card"
              style={{
                padding: '1rem',
                position: 'sticky',
                top: '90px',
              }}
            >
              <div
                style={{
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  color: 'var(--slate-400)',
                  textTransform: 'uppercase',
                  padding: '0.5rem 0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Account Navigation
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.925rem',
                        fontWeight: 600,
                        color: isActive ? 'var(--primary-dark)' : 'var(--slate-700)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        transition: 'all 0.15s ease',
                      })}
                    >
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </nav>
            </aside>

            {/* Sub-view outlet */}
            <main style={{ minWidth: 0 }}>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <Footer />

      <style>{`
        @media (max-width: 840px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout
