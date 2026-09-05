import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Compass, Menu, X, User as UserIcon, LogOut, ShieldCheck, Calendar, CreditCard, LayoutDashboard, ChevronDown } from 'lucide-react'

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const closeMenus = () => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }

  return (
    <header
      className="glass-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        width: '100%',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={closeMenus}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontWeight: 800,
            fontSize: '1.4rem',
            color: 'var(--slate-900)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), #0284c7)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Compass size={22} />
          </div>
          <span>
            Wander<span style={{ color: 'var(--primary)' }}>lust</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.75rem',
          }}
          className="desktop-nav"
        >
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary)' : 'var(--slate-700)',
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/packages"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--primary)' : 'var(--slate-700)',
            })}
          >
            Explore Packages
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                style={({ isActive }) => ({
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                })}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/bookings"
                style={({ isActive }) => ({
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                })}
              >
                My Bookings
              </NavLink>
            </>
          )}

          {isAdmin && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: isActive ? 'var(--primary-dark)' : 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
              })}
            >
              <ShieldCheck size={16} />
              Admin Portal
            </NavLink>
          )}
        </nav>

        {/* Right CTA / Auth controls */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1rem',
          }}
          className="desktop-auth"
        >
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--slate-800)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.name?.split(' ')[0] || 'My Account'}</span>
                <ChevronDown size={14} color="var(--slate-500)" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    padding: '0.75rem 0',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 1rem 0.75rem',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                      {user?.name}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email}
                    </p>
                    <span
                      className={`badge ${isAdmin ? 'badge-primary' : 'badge-neutral'}`}
                      style={{ marginTop: '0.4rem' }}
                    >
                      {isAdmin ? 'ADMIN' : 'TRAVELER'}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={closeMenus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <UserIcon size={16} />
                    My Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={closeMenus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <Link
                    to="/bookings"
                    onClick={closeMenus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Calendar size={16} />
                    Bookings
                  </Link>
                  <Link
                    to="/payments"
                    onClick={closeMenus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CreditCard size={16} />
                    Payments
                  </Link>

                  {isAdmin && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.4rem 0' }}>
                      <Link
                        to="/admin"
                        onClick={closeMenus}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.65rem 1rem',
                          fontSize: '0.875rem',
                          color: 'var(--primary)',
                          fontWeight: 600,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <ShieldCheck size={16} />
                        Admin Dashboard
                      </Link>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.65rem 1rem',
                        fontSize: '0.875rem',
                        color: 'var(--rose)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--rose-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: 'var(--slate-800)',
          }}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--white)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <NavLink
            to="/"
            onClick={closeMenus}
            style={{ fontWeight: 600, color: 'var(--slate-700)', padding: '0.4rem 0' }}
          >
            Home
          </NavLink>
          <NavLink
            to="/packages"
            onClick={closeMenus}
            style={{ fontWeight: 600, color: 'var(--slate-700)', padding: '0.4rem 0' }}
          >
            Explore Packages
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={closeMenus}
                style={{ fontWeight: 600, color: 'var(--slate-700)', padding: '0.4rem 0' }}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/bookings"
                onClick={closeMenus}
                style={{ fontWeight: 600, color: 'var(--slate-700)', padding: '0.4rem 0' }}
              >
                My Bookings
              </NavLink>
              <NavLink
                to="/payments"
                onClick={closeMenus}
                style={{ fontWeight: 600, color: 'var(--slate-700)', padding: '0.4rem 0' }}
              >
                My Payments
              </NavLink>
              <NavLink
                to="/profile"
                onClick={closeMenus}
                style={{ fontWeight: 600, color: 'var(--slate-700)', padding: '0.4rem 0' }}
              >
                My Profile
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMenus}
                  style={{ fontWeight: 700, color: 'var(--primary)', padding: '0.4rem 0' }}
                >
                  Admin Portal
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', color: 'var(--rose)' }}
              >
                <LogOut size={16} />
                Log Out ({user?.name})
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to="/login" onClick={closeMenus} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                Log In
              </Link>
              <Link to="/register" onClick={closeMenus} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Inline styles for media query toggling */}
      <style>{`
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .desktop-auth { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-auth { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  )
}

export default Navbar
