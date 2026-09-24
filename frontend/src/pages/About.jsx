import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, ShieldCheck, CreditCard, Calendar, MapPin, Mail, Clock, ArrowRight } from 'lucide-react'

export const About = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: 'calc(100vh - 72px)', padding: '3.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '0.35rem 0.95rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}
          >
            <Compass size={16} />
            <span>About Yatramigo</span>
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              color: 'var(--slate-900)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}
          >
            Travel Booking Made Simple
          </h1>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            Yatramigo is a travel booking platform designed to help users discover destinations and book travel packages with confidence and transparency.
          </p>
        </div>

        {/* Platform Overview Card */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            backgroundColor: 'var(--white)',
            marginBottom: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--slate-900)' }}>
            Our Purpose
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '1rem', marginBottom: '1.25rem' }}>
            Planning a vacation should be clear and reliable. Yatramigo connects travelers with curated holiday itineraries across India, providing verified availability, direct database reservation locking, and full transparency in costs.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '1rem' }}>
            Whether you are exploring coastal shores in Goa, cultural heritage in Jaipur, or high-altitude valleys in Manali and Kashmir, Yatramigo organizes itineraries with detailed schedules, transparent inclusions, and direct booking confirmation.
          </p>
        </div>

        {/* Core Platform Pillars */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--slate-900)' }}>
            What Yatramigo Provides
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Pillar 1 */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Compass size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
                Curated Travel Packages
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every package provides day-by-day itineraries, verified hotel and meal inclusions, and transparent pricing.
              </p>
            </div>

            {/* Pillar 2 */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--emerald-light)',
                  color: 'var(--emerald-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
                Verified Database Allocation
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Seats are synchronized directly with live database records, eliminating overbooking and reservation uncertainty.
              </p>
            </div>

            {/* Pillar 3 */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--amber-light)',
                  color: 'var(--amber-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <CreditCard size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
                Secure Payment Processing
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Checkout using authorized Razorpay payment gateway integration with instant receipt generation and invoice access.
              </p>
            </div>

            {/* Pillar 4 */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--purple-light)',
                  color: 'var(--purple-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Calendar size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
                Traveler Portal
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Manage your reservations, view upcoming departure schedules, and download booking vouchers from your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Verification Information */}
        <div
          className="card"
          style={{
            padding: '2rem 2.5rem',
            backgroundColor: 'var(--white)',
            marginBottom: '3rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
            Operations & Support Desk
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Mail size={18} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Contact Email
                </span>
                <a href="mailto:support@yatramigo.dev" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  support@yatramigo.dev
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Clock size={18} color="var(--emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Concierge Desk Hours
                </span>
                <span style={{ color: 'var(--slate-800)', fontWeight: 600, fontSize: '0.95rem' }}>
                  Daily 08:00 – 22:00 IST
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={18} color="var(--amber)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Operating Hubs
                </span>
                <span style={{ color: 'var(--slate-800)', fontWeight: 600, fontSize: '0.95rem' }}>
                  New Delhi & Bengaluru, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation CTA */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/packages" className="btn btn-primary btn-lg">
            <span>Explore All Packages</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/" className="btn btn-outline btn-lg">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default About
