import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { packageService } from '../services/packageService'
import { destinationService } from '../services/destinationService'
import { reviewService } from '../services/reviewService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import BookingForm from '../components/bookings/BookingForm'
import ReviewCard from '../components/reviews/ReviewCard'
import ReviewForm from '../components/reviews/ReviewForm'
import StarRating from '../components/reviews/StarRating'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import ConfirmationDialog from '../components/common/ConfirmationDialog'
import { formatCurrency } from '../utils/formatters'
import { getPackageImage } from '../utils/imageHelper'
import { getExtendedPackageData } from '../data/demoData'
import {
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Shield,
  CheckCircle2,
  MessageSquarePlus,
  Star,
  Compass,
  ChevronRight
} from 'lucide-react'

export const PackageDetails = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()

  const [pkg, setPkg] = useState(null)
  const [destination, setDestination] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Review editing / deletion state
  const [editingReview, setEditingReview] = useState(null)
  const [deleteReviewId, setDeleteReviewId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const fetchPackageData = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const pkgData = await packageService.getPackageById(id)
      setPkg(pkgData)

      // Fetch destination
      if (pkgData.destinationId) {
        try {
          const destData = await destinationService.getDestinationById(pkgData.destinationId)
          setDestination(destData)
        } catch (e) {
          console.warn('Could not fetch destination details:', e)
        }
      }

      // Fetch real reviews for this package directly from backend
      try {
        const pkgReviews = await reviewService.getReviewsByPackage(id)
        setReviews(pkgReviews || [])
      } catch (e) {
        console.warn('Could not fetch package reviews directly, falling back:', e)
        try {
          const allReviews = await reviewService.getAllReviews()
          setReviews(allReviews.filter((r) => Number(r.travelPackageId) === Number(id)))
        } catch (err2) {
          console.warn('Could not fetch reviews:', err2)
        }
      }
    } catch (err) {
      console.error('Error fetching package details:', err)
      setErrorMsg(err.message || 'Failed to load travel package details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackageData()
  }, [id])

  // Review delete handler
  const handleConfirmDeleteReview = async () => {
    if (!deleteReviewId) return
    try {
      setDeleteLoading(true)
      await reviewService.deleteReview(deleteReviewId)
      toast.success('Review deleted successfully.')
      setReviews((prev) => prev.filter((r) => r.id !== deleteReviewId))
      setDeleteReviewId(null)
    } catch (err) {
      toast.error(err.message || 'Could not delete review.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Calculate real average rating strictly from backend reviews
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : null

  if (loading) {
    return <LoadingSpinner message="Loading travel package details..." fullPage />
  }

  if (errorMsg || !pkg) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <ErrorMessage
          title="Package Not Found"
          message={errorMsg || 'The requested travel package could not be found.'}
          onRetry={fetchPackageData}
        />
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/packages" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Packages
          </Link>
        </div>
      </div>
    )
  }

  const extendedData = getExtendedPackageData(pkg.title) || {}
  const imageUrl = extendedData.image || getPackageImage(pkg.id, pkg.title)
  const isSoldOut = (pkg.availableSeats || 0) <= 0

  const scrollToBooking = () => {
    const el = document.getElementById('booking-card')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '85vh', paddingBottom: '5rem' }}>
      {/* Breadcrumb Header */}
      <div style={{ backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
            <ChevronRight size={14} />
            <Link to="/packages" style={{ color: 'var(--text-secondary)' }}>Packages</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--slate-900)', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pkg.title}
            </span>
          </nav>

          <Link
            to="/packages"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={15} /> All Packages
          </Link>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        {/* Title & Key Highlights Bar */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {destination && (
              <span className="badge badge-primary">
                <MapPin size={13} /> {destination.name}, {destination.country}
              </span>
            )}
            <span className="badge badge-neutral">
              <Clock size={13} /> {pkg.duration} Days / {Math.max(1, pkg.duration - 1)} Nights
            </span>
            <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-success'}`}>
              <Users size={13} /> {isSoldOut ? 'Sold Out' : `${pkg.availableSeats} Seats Available`}
            </span>
            {avgRating && (
              <span className="badge badge-warning">
                <Star size={13} fill="#b45309" /> {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.65rem)', fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1.25 }}>
            {pkg.title}
          </h1>
        </div>

        {/* Main Grid: Left Details & Right Booking Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.65fr) minmax(320px, 1fr)',
            gap: '2.5rem',
            alignItems: 'start',
          }}
          className="package-detail-grid"
        >
          {/* Left Column: Media & Info */}
          <div>
            {/* Featured Image */}
            <div
              className="card"
              style={{
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                height: '440px',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: 'var(--slate-100)',
                position: 'relative'
              }}
            >
              <img
                src={imageUrl}
                alt={pkg.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 100%)',
                  padding: '2rem 1.5rem 1.25rem',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                    Curated Expeditions
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {destination ? `${destination.name}, ${destination.country}` : 'Handcrafted Journey'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', backgroundColor: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{pkg.duration} Days</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', backgroundColor: '#ecfdf5', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Group Capacity</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{pkg.availableSeats} Remaining</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fff7ed', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Protection</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>100% Insured</div>
                </div>
              </div>
            </div>

            {/* Overview & Description */}
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Compass size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                  About This Itinerary
                </h2>
              </div>

              <p
                style={{
                  color: 'var(--slate-700)',
                  lineHeight: 1.8,
                  fontSize: '1rem',
                  whiteSpace: 'pre-line',
                  marginBottom: '1.75rem',
                }}
              >
                {pkg.description}
              </p>

              {/* Itinerary Schedule if present */}
              {extendedData.itinerary && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--slate-900)' }}>
                    Detailed Day-by-Day Schedule
                  </h3>
                  <div
                    style={{
                      color: 'var(--slate-700)',
                      lineHeight: 1.75,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-line',
                      backgroundColor: 'var(--slate-50)',
                      padding: '1.25rem 1.5rem',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {extendedData.itinerary}
                  </div>
                </div>
              )}

              {/* Inclusions / Highlights */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--slate-900)' }}>
                  Inclusions & Traveler Amenities
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {(extendedData.highlights || [
                    'Handpicked luxury hotel accommodations',
                    'Dedicated English-speaking tour concierge',
                    'Daily complimentary breakfast & select gourmet meals',
                    'Private AC transportation & airport transfers',
                    'Monument access permits & entry tickets',
                    '24/7 dedicated traveler support helpline'
                  ]).map((highlight, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-700)', fontSize: '0.9rem' }}>
                      <CheckCircle2 size={17} color="var(--emerald)" style={{ flexShrink: 0 }} />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Spotlight */}
            {destination && (
              <div
                className="card"
                style={{
                  padding: '2rem',
                  marginBottom: '2rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <MapPin size={22} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                    Destination: {destination.name}, {destination.country}
                  </h2>
                </div>
                <p style={{ color: 'var(--slate-700)', lineHeight: 1.7, fontSize: '0.95rem', margin: 0 }}>
                  {destination.description}
                </p>
              </div>
            )}

            {/* Traveler Reviews Section */}
            <div className="card" style={{ padding: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1.25rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                    Verified Traveler Reviews ({reviews.length})
                  </h2>
                  {avgRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                      <StarRating rating={Math.round(Number(avgRating))} size={16} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                        {avgRating} out of 5
                      </span>
                    </div>
                  )}
                </div>

                {isAuthenticated && !showReviewForm && !editingReview && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <MessageSquarePlus size={16} />
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review Form (Create or Edit) */}
              {(showReviewForm || editingReview) && (
                <div
                  style={{
                    backgroundColor: 'var(--slate-50)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                    marginBottom: '1.75rem',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--slate-900)' }}>
                    {editingReview ? 'Edit Your Review' : 'Share Your Travel Experience'}
                  </h3>
                  <ReviewForm
                    travelPackageId={pkg.id}
                    existingReview={editingReview}
                    onSuccess={(savedReview) => {
                      if (editingReview) {
                        setReviews((prev) =>
                          prev.map((r) => (r.id === savedReview.id ? savedReview : r))
                        )
                        setEditingReview(null)
                      } else {
                        setReviews((prev) => [savedReview, ...prev])
                        setShowReviewForm(false)
                      }
                    }}
                    onCancel={() => {
                      setShowReviewForm(false)
                      setEditingReview(null)
                    }}
                  />
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--slate-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <Star size={20} color="var(--slate-400)" />
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.25rem', fontSize: '1rem' }}>
                    No traveler reviews yet
                  </p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    Be the first verified traveler to experience this journey and share feedback!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.map((rev) => (
                    <ReviewCard
                      key={rev.id}
                      review={rev}
                      currentUserId={user?.id}
                      onEdit={(r) => {
                        setEditingReview(r)
                        setShowReviewForm(false)
                      }}
                      onDelete={(revId) => setDeleteReviewId(revId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div id="booking-card">
            <BookingForm travelPackage={pkg} />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="mobile-booking-bar">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block' }}>Total Price</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            {formatCurrency(pkg.price)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}> / person</span>
        </div>
        <button
          onClick={scrollToBooking}
          disabled={isSoldOut}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}
        >
          {isSoldOut ? 'Sold Out' : 'Book Journey'}
        </button>
      </div>

      {/* Confirmation modal for review deletion */}
      <ConfirmationDialog
        isOpen={Boolean(deleteReviewId)}
        onClose={() => setDeleteReviewId(null)}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to remove your review? This action cannot be undone."
        confirmText="Delete Review"
        loading={deleteLoading}
      />

      <style>{`
        .mobile-booking-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--white);
          padding: 0.85rem 1.25rem;
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
          z-index: 900;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-subtle);
        }

        @media (max-width: 900px) {
          .package-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-booking-bar {
            display: flex;
          }
        }
      `}</style>
    </div>
  )
}

export default PackageDetails
