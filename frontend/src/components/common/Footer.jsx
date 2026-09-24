import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, Heart, Mail, Phone, MapPin, Shield, Award, Clock, ArrowRight } from 'lucide-react'

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--slate-950)',
        color: 'var(--slate-300)',
        padding: '4.5rem 0 2rem',
        marginTop: 'auto',
        borderTop: '1px solid var(--slate-800)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Col 1: Brand & Identity */}
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: 'var(--white)',
                fontWeight: 800,
                fontSize: '1.45rem',
                marginBottom: '1rem',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Compass size={22} color="var(--white)" />
              </div>
              <span>
                Yatra<span style={{ color: 'var(--primary-light)' }}>migo</span>
              </span>
            </Link>
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: '1.65',
                color: 'var(--slate-400)',
                marginBottom: '1.5rem',
              }}
            >
              Curating authentic travel itineraries and stress-free vacations. Transparent pricing, verified backend reservations, and seamless online payments.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--slate-300)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} color="var(--emerald)" />
                <span>100% Real Database Seat Confirmation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="var(--amber)" />
                <span>Authorized Razorpay Payment Processing</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4
              style={{
                color: 'var(--white)',
                fontSize: '1rem',
                marginBottom: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Explore
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/packages" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  All Travel Packages
                </Link>
              </li>
              <li>
                <Link to="/#destinations" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Popular Destinations
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  About Yatramigo
                </Link>
              </li>
              <li>
                <Link to="/dashboard" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Traveler Portal
                </Link>
              </li>
              <li>
                <Link to="/bookings" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Destinations */}
          <div>
            <h4
              style={{
                color: 'var(--white)',
                fontSize: '1rem',
                marginBottom: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Destinations
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/packages?q=Goa" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Goa Beaches & Coastal Life
                </Link>
              </li>
              <li>
                <Link to="/packages?q=Jaipur" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Jaipur Royal Heritage
                </Link>
              </li>
              <li>
                <Link to="/packages?q=Manali" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Manali Himalayan Adventures
                </Link>
              </li>
              <li>
                <Link to="/packages?q=Kerala" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Kerala Backwaters & Tea Gardens
                </Link>
              </li>
              <li>
                <Link to="/packages?q=Kashmir" style={{ color: 'var(--slate-400)', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.target.style.color = 'var(--white)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-400)')}>
                  Kashmir Valley Serenity
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Concierge & Support */}
          <div>
            <h4
              style={{
                color: 'var(--white)',
                fontSize: '1rem',
                marginBottom: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Travel Concierge
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <Mail size={16} color="var(--primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.775rem' }}>Support Email</span>
                  <a href="mailto:support@yatramigo.dev" style={{ color: 'var(--white)', fontWeight: 500 }}>
                    support@yatramigo.dev
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <Clock size={16} color="var(--emerald)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.775rem' }}>Concierge Desk</span>
                  <span style={{ color: 'var(--white)', fontWeight: 500 }}>Daily 08:00 – 22:00 IST</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <MapPin size={16} color="var(--amber)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.775rem' }}>Verified Operations</span>
                  <span style={{ color: 'var(--white)', fontWeight: 500 }}>New Delhi & Bengaluru, India</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--slate-800)',
            paddingTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--slate-500)',
          }}
        >
          <p>© {new Date().getFullYear()} Yatramigo Travel Bookings. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span>INR (₹) Transparent Pricing</span>
            <span>Razorpay Authoritative Gateway</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              Crafted with <Heart size={14} color="var(--rose)" fill="var(--rose)" /> for travelers.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
