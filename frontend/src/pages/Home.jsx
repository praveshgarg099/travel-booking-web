import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { packageService } from '../services/packageService'
import { destinationService } from '../services/destinationService'
import { reviewService } from '../services/reviewService'
import TravelPackageCard from '../components/packages/TravelPackageCard'
import ReviewCard from '../components/reviews/ReviewCard'
import {
  Compass,
  Search,
  ShieldCheck,
  Award,
  HeartHandshake,
  Headphones,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Plane,
  Star,
  Layers,
} from 'lucide-react'

export const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [packages, setPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (location.hash === '#destinations') {
      const el = document.getElementById('destinations')
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 80)
      }
    }
  }, [location.hash, loading])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [pkgData, destData, revData] = await Promise.allSettled([
          packageService.getAllPackages(),
          destinationService.getAllDestinations(),
          reviewService.getAllReviews(),
        ])

        if (pkgData.status === 'fulfilled' && Array.isArray(pkgData.value)) {
          setPackages(pkgData.value)
        }
        if (destData.status === 'fulfilled' && Array.isArray(destData.value)) {
          setDestinations(destData.value)
        }
        if (revData.status === 'fulfilled' && Array.isArray(revData.value)) {
          setReviews(revData.value)
        }
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

  // Derive real review ratings map
  const ratingsMap = useMemo(() => {
    const map = {}
    reviews.forEach((r) => {
      const pkgId = r.travelPackageId
      if (!pkgId) return
      if (!map[pkgId]) {
        map[pkgId] = { total: 0, count: 0, avgRating: 0, reviewCount: 0 }
      }
      map[pkgId].total += Number(r.rating) || 0
      map[pkgId].count += 1
    })
    Object.keys(map).forEach((id) => {
      map[id].avgRating = map[id].count > 0 ? map[id].total / map[id].count : 0
      map[id].reviewCount = map[id].count
    })
    return map
  }, [reviews])

  // Destination ID to name mapping
  const destinationMap = useMemo(() => {
    const map = {}
    destinations.forEach((d) => {
      if (d.id != null) {
        map[d.id] = d.name
      }
    })
    return map
  }, [destinations])

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          minHeight: '620px',
          background:
            'linear-gradient(rgba(15, 23, 42, 0.68), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80") center/cover no-repeat',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--white)',
          padding: '5rem 0',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                padding: '0.4rem 1.15rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#7dd3fc',
                marginBottom: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <Sparkles size={16} /> Curated Worldwide Itineraries
            </span>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                color: 'var(--white)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
              }}
            >
              Discover Your Next Journey
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: 'var(--slate-200)',
                lineHeight: 1.65,
                maxWidth: '660px',
                margin: '0 auto 2.5rem',
              }}
            >
              Explore handpicked destinations, reserve verified tour seats, and experience transparent travel booking with instant confirmation.
            </p>

            {/* Travel Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-2xl)',
                padding: '0.5rem 0.65rem 0.5rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                boxShadow: 'var(--shadow-2xl)',
                maxWidth: '680px',
                margin: '0 auto',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                <Search size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Where do you want to explore? (e.g. Goa, Manali, Jaipur)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '1rem',
                    color: 'var(--slate-800)',
                    background: 'transparent',
                  }}
                  aria-label="Search travel packages"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem', borderRadius: 'var(--radius-xl)' }}
              >
                <span>Find Tours</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. REAL METRICS STRIP (Ground in real data only) */}
      <section
        style={{
          backgroundColor: 'var(--white)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '2.5rem 0',
        }}
      >
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
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
                {packages.length}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.15rem' }}>
                Curated Travel Packages
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
                {destinations.length}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.15rem' }}>
                Global Destinations
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--emerald-dark)', fontFamily: 'var(--font-heading)' }}>
                100%
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.15rem' }}>
                Direct Seat Allocation
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
                {reviews.length}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.15rem' }}>
                Verified Traveler Reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR DESTINATIONS SPOTLIGHT */}
      <section id="destinations" style={{ padding: '5rem 0 3rem', backgroundColor: 'var(--white)' }}>
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
                  fontSize: '0.825rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Top Places To Visit
              </span>
              <h2 style={{ marginTop: '0.35rem' }}>Popular Destinations</h2>
            </div>
            <Link to="/packages" className="btn btn-outline btn-sm">
              <span>View All Tours</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {destinations.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {destinations.slice(0, 4).map((dest) => (
                <Link
                  key={dest.id}
                  to={`/packages?dest=${dest.id}`}
                  className="card card-hover"
                  style={{
                    padding: '1.75rem',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '180px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <MapPin size={18} color="var(--primary)" />
                      <span className="badge badge-primary">{dest.country}</span>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                      {dest.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {dest.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginTop: '1rem',
                    }}
                  >
                    <span>Explore Packages</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          ) : loading ? (
            <div style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
              Loading popular destinations...
            </div>
          ) : null}
        </div>
      </section>

      {/* 4. FEATURED PACKAGES */}
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
                  fontSize: '0.825rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Top Travel Packages
              </span>
              <h2 style={{ marginTop: '0.35rem' }}>Featured Packages</h2>
            </div>
            <Link to="/packages" className="btn btn-outline btn-sm">
              <span>Explore All ({packages.length})</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card" style={{ height: '380px' }}>
                  <div className="skeleton-box" style={{ height: '220px', borderRadius: 0 }} />
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    <div className="skeleton-box" style={{ height: '22px', width: '70%' }} />
                    <div className="skeleton-box" style={{ height: '16px', width: '90%' }} />
                    <div className="skeleton-box" style={{ height: '16px', width: '50%', marginTop: 'auto' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div
              className="card"
              style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--white)' }}
            >
              <Compass size={48} color="var(--primary)" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Packages Available Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                There are currently no active travel packages in the system. Log in as an administrator to seed or create new packages.
              </p>
              <Link to="/login" className="btn btn-primary btn-sm">
                Login as Administrator
              </Link>
            </div>
          ) : (
            <div className="grid-3 animate-fade-in-up delay-100">
              {packages.slice(0, 6).map((pkg) => (
                <TravelPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  destinationName={destinationMap[pkg.destinationId] || ''}
                  ratingData={ratingsMap[pkg.id] || null}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. WHY CHOOSE YATRAMIGO */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--white)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span
              style={{
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.825rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              The Yatramigo Standard
            </span>
            <h2 style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
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
              gap: '1.75rem',
            }}
          >
            {/* Feature 1 */}
            <div
              className="card"
              style={{
                padding: '2.25rem 1.75rem',
                textAlign: 'center',
                backgroundColor: 'var(--slate-50)',
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
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem' }}>Direct Database Confirmation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                Every reservation is synchronized live with backend seat pools. No double bookings, no reservation uncertainty.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="card"
              style={{
                padding: '2.25rem 1.75rem',
                textAlign: 'center',
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--emerald-light)',
                  color: 'var(--emerald-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Award size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem' }}>Transparent Pricing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                Total payment amounts are calculated transparently with zero hidden markups. Standard INR payment processing.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="card"
              style={{
                padding: '2.25rem 1.75rem',
                textAlign: 'center',
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--amber-light)',
                  color: 'var(--amber-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <HeartHandshake size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem' }}>Flexible Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                Update guest counts or cancel unpaid bookings directly from your personal dashboard in real-time.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="card"
              style={{
                padding: '2.25rem 1.75rem',
                textAlign: 'center',
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--purple-light)',
                  color: 'var(--purple-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Headphones size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem' }}>24/7 Concierge Support</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                Our travel assistants and support desk ensure your journey from booking to departure is smooth and effortless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span
              style={{
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.825rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Simple & Transparent
            </span>
            <h2 style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
              How Yatramigo Works
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Booking your dream holiday takes only three effortless steps.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              position: 'relative',
            }}
          >
            {/* Step 1 */}
            <div className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Choose Itinerary</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Filter packages by destination, duration, price, and seat availability. Inspect full itineraries and inclusions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Select Date & Guests</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Pick your travel date, specify travelers, and immediately lock in available seats directly in the backend.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--emerald)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Pay & Receive Voucher</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Complete secure checkout via Razorpay or choose Cash on Arrival. Instantly download your official PDF travel voucher.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. REAL CUSTOMER REVIEWS (Render ONLY if reviews exist in database) */}
      {reviews.length > 0 && (
        <section style={{ padding: '5rem 0', backgroundColor: 'var(--white)', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
              <span
                style={{
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Verified Experiences
              </span>
              <h2 style={{ marginTop: '0.35rem' }}>Loved By Travelers</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Authentic reviews shared by travelers who booked their journeys with Yatramigo.
              </p>
            </div>

            <div className="grid-3 animate-fade-in-up delay-200">
              {reviews.slice(0, 3).map((rev) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. CALL TO ACTION */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--slate-950) 0%, var(--primary-dark) 100%)',
          color: 'var(--white)',
          padding: '5rem 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--white)', marginBottom: '1rem' }}>
              Ready For Your Next Adventure?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#e0f2fe', marginBottom: '2.25rem', lineHeight: 1.65 }}>
              Browse through handpicked travel packages, check live availability, and reserve your vacation today.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/packages" className="btn btn-accent btn-lg">
                Explore All Packages
              </Link>
              <Link
                to="/register"
                className="btn btn-outline btn-lg"
                style={{ color: 'var(--white)', borderColor: 'rgba(255, 255, 255, 0.6)' }}
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
