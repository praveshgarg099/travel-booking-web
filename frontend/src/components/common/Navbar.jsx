import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Compass,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Calendar,
  CreditCard,
  LayoutDashboard,
  ChevronDown,
  Search,
  MapPin,
  Info,
  ArrowRight,
} from 'lucide-react'

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [navSearchQuery, setNavSearchQuery] = useState('')
  const [navSearchOpen, setNavSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
    setNavSearchOpen(false)
  }, [location.pathname])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [userDropdownOpen])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Focus search input when toggled open
  useEffect(() => {
    if (navSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [navSearchOpen])

  const handleLogout = () => {
    logout()
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const handleNavSearchSubmit = (e) => {
    e.preventDefault()
    if (navSearchQuery.trim()) {
      navigate(`/packages?q=${encodeURIComponent(navSearchQuery.trim())}`)
      setNavSearchQuery('')
      setNavSearchOpen(false)
      setMobileMenuOpen(false)
    }
  }

  return (
    <header
      className="glass-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        width: '100%',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          gap: '1rem',
        }}
      >
        {/* Left: Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontWeight: 800,
            fontSize: '1.45rem',
            color: 'var(--slate-900)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          aria-label="Yatramigo Travel Home"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Compass size={22} />
          </div>
          <span>
            Yatra<span style={{ color: 'var(--primary)' }}>migo</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
          }}
          aria-label="Main navigation"
        >
          <NavLink
            to="/packages"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.925rem',
              color: isActive ? 'var(--primary)' : 'var(--slate-700)',
              transition: 'color 0.15s ease',
            })}
          >
            Explore
          </NavLink>
          <NavLink
            to="/packages?view=destinations"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '0.925rem',
              color: isActive ? 'var(--primary)' : 'var(--slate-700)',
              transition: 'color 0.15s ease',
            })}
          >
            Destinations
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/bookings"
              style={({ isActive }) => ({
                fontWeight: 600,
                fontSize: '0.925rem',
                color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                transition: 'color 0.15s ease',
              })}
            >
              Bookings
            </NavLink>
          )}
          <a
            href="/#about"
            style={{
              fontWeight: 600,
              fontSize: '0.925rem',
              color: 'var(--slate-700)',
              transition: 'color 0.15s ease',
            }}
          >
            About
          </a>

          {isAdmin && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: isActive ? 'var(--primary-dark)' : 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
              })}
            >
              <ShieldCheck size={15} />
              Admin Portal
            </NavLink>
          )}
        </nav>

        {/* Right Side: Desktop Search & Auth Controls */}
        <div
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          {/* Quick Search Bar / Toggle */}
          {navSearchOpen ? (
            <form
              onSubmit={handleNavSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--white)',
                border: '1.5px solid var(--primary)',
                borderRadius: 'var(--radius-full)',
                padding: '0.25rem 0.65rem',
                boxShadow: 'var(--shadow-sm)',
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <Search size={16} color="var(--slate-400)" style={{ marginRight: '0.35rem' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tours..."
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.875rem',
                  color: 'var(--slate-800)',
                  width: '160px',
                  background: 'transparent',
                }}
              />
              <button
                type="button"
                onClick={() => setNavSearchOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-400)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setNavSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--slate-200)',
                background: 'var(--white)',
                color: 'var(--slate-600)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label="Open search input"
              title="Search packages"
            >
              <Search size={17} />
            </button>
          )}

          {/* Unauthenticated: Login & Sign Up buttons */}
          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          ) : (
            /* Authenticated: User profile trigger & dropdown */
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background: 'var(--white)',
                  border: '1px solid var(--slate-200)',
                  padding: '0.35rem 0.85rem 0.35rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--slate-800)',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.name?.split(' ')[0] || 'My Account'}</span>
                <ChevronDown
                  size={14}
                  color="var(--slate-400)"
                  style={{
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    padding: '0.5rem 0',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease-out',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--slate-900)' }}>
                      {user?.name}
                    </p>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.email}
                    </p>
                    <span
                      className={`badge ${isAdmin ? 'badge-primary' : 'badge-neutral'}`}
                      style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}
                    >
                      {isAdmin ? 'ADMIN' : 'TRAVELER'}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <UserIcon size={16} color="var(--slate-500)" />
                    Profile
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LayoutDashboard size={16} color="var(--slate-500)" />
                    Dashboard
                  </Link>

                  <Link
                    to="/bookings"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Calendar size={16} color="var(--slate-500)" />
                    Bookings
                  </Link>

                  <Link
                    to="/payments"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 1rem',
                      fontSize: '0.875rem',
                      color: 'var(--slate-700)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CreditCard size={16} color="var(--slate-500)" />
                    Payments
                  </Link>

                  {isAdmin && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.35rem 0' }}>
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 1rem',
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

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 1rem',
                        fontSize: '0.875rem',
                        color: 'var(--rose)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                        transition: 'background-color 0.1s ease',
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

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-only"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: 'var(--slate-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
          }}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="filter-drawer"
            style={{
              right: 0,
              left: 'auto',
              width: '85%',
              maxWidth: '340px',
              animation: 'slideDrawerRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Compass size={18} />
                </div>
                <span>
                  Yatra<span style={{ color: 'var(--primary)' }}>migo</span>
                </span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={22} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="filter-drawer-body">
              {/* Mobile Search Input */}
              <form onSubmit={handleNavSearchSubmit} style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search tours..."
                    className="form-control"
                    value={navSearchQuery}
                    onChange={(e) => setNavSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.4rem', fontSize: '0.9rem', borderRadius: 'var(--radius-xl)' }}
                  />
                  <Search
                    size={17}
                    color="var(--slate-400)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </form>

              {/* Navigation Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.25rem', letterSpacing: '0.05em' }}>
                  Menu
                </div>

                <NavLink
                  to="/packages"
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isActive ? 'var(--primary)' : 'var(--slate-800)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  })}
                >
                  <Compass size={18} />
                  <span>Explore Packages</span>
                </NavLink>

                <NavLink
                  to="/packages?view=destinations"
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isActive ? 'var(--primary)' : 'var(--slate-800)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  })}
                >
                  <MapPin size={18} />
                  <span>Destinations</span>
                </NavLink>

                <a
                  href="/#about"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--slate-800)',
                  }}
                >
                  <Info size={18} />
                  <span>About Yatramigo</span>
                </a>
              </div>

              {/* Account Section */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', padding: '0 0.5rem 0.5rem', letterSpacing: '0.05em' }}>
                  Account
                </div>

                {isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ padding: '0.5rem 0.85rem', marginBottom: '0.5rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>

                    <NavLink
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 600,
                        fontSize: '0.925rem',
                        color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      })}
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </NavLink>

                    <NavLink
                      to="/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 600,
                        fontSize: '0.925rem',
                        color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      })}
                    >
                      <Calendar size={18} />
                      Bookings
                    </NavLink>

                    <NavLink
                      to="/payments"
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 600,
                        fontSize: '0.925rem',
                        color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      })}
                    >
                      <CreditCard size={18} />
                      Payments
                    </NavLink>

                    <NavLink
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 600,
                        fontSize: '0.925rem',
                        color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      })}
                    >
                      <UserIcon size={18} />
                      Profile Settings
                    </NavLink>

                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.7rem 0.85rem',
                          borderRadius: 'var(--radius-lg)',
                          fontWeight: 700,
                          fontSize: '0.925rem',
                          color: 'var(--primary-dark)',
                          backgroundColor: 'var(--primary-light)',
                          marginTop: '0.25rem',
                        }}
                      >
                        <ShieldCheck size={18} />
                        Admin Dashboard
                      </NavLink>
                    )}

                    <button
                      onClick={handleLogout}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.75rem', color: 'var(--rose)', borderColor: '#fecdd3' }}
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-secondary btn-block"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary btn-block"
                    >
                      Create Free Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
