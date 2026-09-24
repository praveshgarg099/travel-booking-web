import React from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { ShieldCheck, Package, MapPin, Users, LayoutDashboard, CreditCard, Calendar, Star, ChevronRight, ExternalLink } from 'lucide-react'

export const AdminLayout = () => {
  const adminNavItems = [
    { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/packages', label: 'Travel Packages', icon: Package },
    { to: '/admin/destinations', label: 'Destinations', icon: MapPin },
    { to: '/admin/bookings', label: 'All Bookings', icon: Calendar },
    { to: '/admin/payments', label: 'Payment Audit', icon: CreditCard },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/reviews', label: 'Review Moderation', icon: Star },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Navbar />

      <div style={{ flex: 1, padding: '2rem 0 4rem' }}>
        <div className="container">
          {/* Admin Layout Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
            className="admin-grid"
          >
            {/* Admin Sidebar */}
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
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                    Admin Console
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                    Superuser
                  </span>
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
                Management
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {adminNavItems.map((item) => {
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

              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1.25rem', paddingTop: '1rem' }}>
                <Link
                  to="/packages"
                  className="btn btn-ghost btn-sm btn-block"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={14} /> View Live Storefront
                </Link>
              </div>
            </aside>

            {/* Admin Main Content */}
            <main style={{ minWidth: 0 }}>
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 840px) {
          .admin-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLayout
