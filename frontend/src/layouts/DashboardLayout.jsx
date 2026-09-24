import React from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Calendar, CreditCard, User, Star, ShieldCheck, ChevronRight } from 'lucide-react'

export const DashboardLayout = () => {
  const { user } = useAuth()

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/bookings', label: 'My Bookings', icon: Calendar },
    { to: '/payments', label: 'My Payments', icon: CreditCard },
    { to: '/reviews', label: 'My Reviews', icon: Star },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Navbar />

      <div style={{ flex: 1, padding: '2rem 0 4rem' }}>
        <div className="container">
          {/* Admin Banner if logged in as Admin */}
          {user?.role === 'ADMIN' && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: 'var(--radius-xl)',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                <ShieldCheck size={18} />
                <span>Administrator Privileges Active</span>
              </div>
              <Link to="/admin/packages" id="traveler-dashboard-admin-packages-link" className="btn btn-primary btn-sm">
                Package Operations →
              </Link>
            </div>
          )}

          {/* Main Dashboard Grid: Sidebar + Subview Outlet */}
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
                padding: '1.25rem',
                position: 'sticky',
                top: '90px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {(user?.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {user?.name || 'Traveler'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  padding: '0.4rem 0.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                Traveler Portal
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: isActive ? 'var(--primary-dark)' : 'var(--slate-700)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        transition: 'all 0.15s ease',
                      })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} style={{ opacity: 0.6 }} />
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
