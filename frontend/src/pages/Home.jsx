import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { packageService } from '../services/packageService'
import { destinationService } from '../services/destinationService'
import { reviewService } from '../services/reviewService'
import TravelPackageCard from '../components/packages/TravelPackageCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ReviewCard from '../components/reviews/ReviewCard'
import { Compass, Search, ShieldCheck, Award, HeartHandshake, Headphones, ArrowRight, Sparkles, MapPin, Calendar, Users } from 'lucide-react'

export const Home = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [pkgData, destData, revData] = await Promise.allSettled([
          packageService.getAllPackages(),
          destinationService.getAllDestinations(),
          reviewService.getAllReviews(),
        ])

        if (pkgData.status === 'fulfilled') setPackages(pkgData.value)
        if (destData.status === 'fulfilled') setDestinations(destData.value)
        if (revData.status === 'fulfilled') setReviews(revData.value)
      } catch (err) {
        console.error('Failed to load homepage data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/packages?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/packages')
    }
  }

  // Helper to map destination ID to name
  const getDestinationName = (destId) => {
    if (!destId || destinations.length === 0) return ''
    const found = destinations.find((d) => Number(d.id) === Number(destId))
    return found ? `${found.name}` : ''
  }

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          minHeight: '620px',
          background: 'linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80") center/cover no-repeat',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--white)',
          padding: '5rem 0',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#7dd3fc',
                marginBottom: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Sparkles size={16} /> Curated Worldwide Expeditions
            </span>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                color: 'var(--white)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
              }}
            >
              Explore The World With Unmatched Freedom
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: 'var(--slate-200)',
                lineHeight: 1.6,
                marginBottom: '2.5rem',
                maxWidth: '640px',
                margin: '0 auto 2.5rem',
              }}
            >
              Discover handpicked itineraries, seamless seat reservations, and transparent booking directly verified by our concierge.
            </p>

            {/* Travel Search Widget */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-2xl)',
                padding: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                boxShadow: 'var(--shadow-xl)',
                maxWidth: '620px',
                margin: '0 auto',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, paddingLeft: '1rem' }}>
                <Search size={20} color="var(--slate-400)" />
                <input
                  type="text"
                  placeholder="Where do you want to explore? (e.g. Alps, Bali, Paris)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '1rem',
                    color: 'var(--slate-800)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-xl)' }}
              >
                <span>Find Tours</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section style={{ backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border-subtle)', padding: '2rem 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                {packages.length || '15'}+
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                Curated Travel Packages
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                {destinations.length || '10'}+
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                Global Destinations
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                100%
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                Verified Instant Confirmation
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                4.9 / 5
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                Traveler Satisfaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR TRAVEL PACKAGES */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '2.5rem',
              gap: '1rem',
            }}
          >
            <div>
              <span
                style={{
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Top Rated Itineraries
              </span>
              <h2 style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>Popular Travel Packages</h2>
            </div>
            <Link to="/packages" className="btn btn-outline btn-sm">
              <span>View All Packages</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching available packages from server..." />
          ) : packages.length === 0 ? (
            <div
              className="card"
              style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--white)' }}
            >
              <Compass size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Packages Available Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Your Spring Boot database does not currently have active travel packages.
              </p>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Tip: Log in as an Administrator and use the "Seed Demo Data" button in the Admin Console to instantly populate the application.
              </p>
              <Link to="/login" className="btn btn-primary btn-sm">
                Login to Seed Data
              </Link>
            </div>
          ) : (
            <div className="grid-3 animate-fade-in-up delay-200">
              {packages.slice(0, 6).map((pkg) => (
                <TravelPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  destinationName={getDestinationName(pkg.destinationId)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--white)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span
              style={{
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              The Yatramigo Guarantee
            </span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              Why Book Your Journey With Us?
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              From transparent calculations to instant seat locking, every detail is engineered for stress-free travel.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Feature 1 */}
            <div
              className="card animate-fade-in-up"
              style={{
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Direct Backend Verification</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every reservation is synced live with database seat pools. No double bookings, no seat uncertainty.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="card animate-fade-in-up delay-100"
              style={{
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--emerald-light)',
                  color: 'var(--emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Award size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Transparent Pricing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Total payment amounts are calculated transparently by backend business logic with zero hidden markups.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="card animate-fade-in-up delay-200"
              style={{
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--amber-light)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <HeartHandshake size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Flexible Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Update guest counts or cancel unpaid bookings directly from your personal dashboard in real-time.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="card animate-fade-in-up delay-300"
              style={{
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--rose-light)',
                  color: 'var(--rose)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Headphones size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>24/7 Concierge Care</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Our travel assistants and guides ensure your journey from departure to homecoming is seamless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. REVIEWS SHOWCASE */}
      {reviews.length > 0 && (
        <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-main)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
              <span
                style={{
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Community Feedback
              </span>
              <h2 style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>
                Loved By Travelers Worldwide
              </h2>
            </div>

            <div className="grid-3 animate-fade-in-up delay-200">
              {reviews.slice(0, 3).map((rev) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CALL TO ACTION */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--slate-900) 0%, #0369a1 100%)',
          color: 'var(--white)',
          padding: '5rem 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--white)', marginBottom: '1rem' }}>
              Ready For Your Next Adventure?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#e0f2fe', marginBottom: '2rem', lineHeight: 1.6 }}>
              Browse through all our travel itineraries and reserve your spot today with verified booking confirmation.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/packages" className="btn btn-accent btn-lg">
                Explore All Packages
              </Link>
              <Link
                to="/register"
                className="btn btn-outline btn-lg"
                style={{ color: 'var(--white)', borderColor: 'var(--white)' }}
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
