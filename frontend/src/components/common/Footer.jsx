import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, Heart, Mail, Phone, MapPin, Shield, Award, Clock } from 'lucide-react'

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--slate-900)',
        color: 'var(--slate-300)',
        padding: '4rem 0 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Col 1: Brand */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: 'var(--white)',
                fontWeight: 800,
                fontSize: '1.4rem',
                marginBottom: '1rem',
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
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--slate-400)', marginBottom: '1.25rem' }}>
              Curating unforgettable travel experiences and authentic journeys worldwide. Safe, verified, and transparent travel bookings.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={16} color="var(--emerald)" /> Verified Trips
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={16} color="var(--amber)" /> Best Rates
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ color: 'var(--white)', fontSize: '1rem', marginBottom: '1.2rem', fontWeight: 600 }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/" style={{ color: 'var(--slate-300)' }} onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-300)')}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/packages" style={{ color: 'var(--slate-300)' }} onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-300)')}>
                  Explore All Packages
                </Link>
              </li>
              <li>
                <Link to="/dashboard" style={{ color: 'var(--slate-300)' }} onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-300)')}>
                  User Dashboard
                </Link>
              </li>
              <li>
                <Link to="/bookings" style={{ color: 'var(--slate-300)' }} onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')} onMouseLeave={(e) => (e.target.style.color = 'var(--slate-300)')}>
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Destinations */}
          <div>
            <h4 style={{ color: 'var(--white)', fontSize: '1rem', marginBottom: '1.2rem', fontWeight: 600 }}>
              Destinations
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/packages" style={{ color: 'var(--slate-300)' }}>
                  Santorini, Greece
                </Link>
              </li>
              <li>
                <Link to="/packages" style={{ color: 'var(--slate-300)' }}>
                  Kyoto & Tokyo, Japan
                </Link>
              </li>
              <li>
                <Link to="/packages" style={{ color: 'var(--slate-300)' }}>
                  Bali & Gili Islands, Indonesia
                </Link>
              </li>
              <li>
                <Link to="/packages" style={{ color: 'var(--slate-300)' }}>
                  Swiss Alps & Interlaken
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h4 style={{ color: 'var(--white)', fontSize: '1rem', marginBottom: '1.2rem', fontWeight: 600 }}>
              Need Help?
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="var(--primary)" /> support@yatramigo.com
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="var(--primary)" /> +1 (800) 555-TRAVEL
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--primary)" /> 24/7 Concierge Service
              </p>
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
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Crafted with <Heart size={14} color="var(--rose)" fill="var(--rose)" /> for travelers worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
