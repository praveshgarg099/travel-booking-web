import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { ShieldCheck, Package, MapPin, Users, LayoutDashboard, AlertTriangle } from 'lucide-react'

export const AdminLayout = () => {
  const adminNavItems = [
    { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/packages', label: 'Manage Packages', icon: Package },
    { to: '/admin/destinations', label: 'Manage Destinations', icon: MapPin },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', padding: '2.5rem 0' }}>
        <div className="container">
          {/* Admin Header Banner */}
          <div
            className="card"
            style={{
              padding: '1.75rem 2rem',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
              color: 'var(--white)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <ShieldCheck size={20} color="#7dd3fc" />
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#bae6fd',
                  }}
                >
                  Admin Control Center
                </span>
              </div>
              <h1 style={{ color: 'var(--white)', fontSize: '1.85rem' }}>System Administration</h1>
              <p style={{ color: '#e0f2fe', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                Create travel packages, coordinate destinations, and administer user records directly in Spring Boot.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-warning" style={{ padding: '0.45rem 0.85rem' }}>
                Full Access
              </span>
            </div>
          </div>

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
                Admin Navigation
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
