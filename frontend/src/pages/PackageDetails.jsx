import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import { Clock, Users, MapPin, ArrowLeft, Shield, Award, CheckCircle2, MessageSquarePlus, Star } from 'lucide-react'

export const PackageDetails = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

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

      // Fetch all reviews and filter for this package
      try {
        const allReviews = await reviewService.getAllReviews()
        const filteredReviews = allReviews.filter(
          (r) => Number(r.travelPackageId) === Number(id)
        )
        setReviews(filteredReviews)
      } catch (e) {
        console.warn('Could not fetch reviews:', e)
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
      toast.success('Review deleted.')
      setReviews((prev) => prev.filter((r) => r.id !== deleteReviewId))
      setDeleteReviewId(null)
    } catch (err) {
      toast.error(err.message || 'Could not delete review.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Calculate average rating
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : null

  if (loading) {
    return <LoadingSpinner message="Loading travel package details..." fullPage />
  }

  if (errorMsg || !pkg) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <ErrorMessage
          title="Package Not Found"
          message={errorMsg || 'The requested travel package could not be found.'}
          onRetry={fetchPackageData}
        />
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/packages" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Packages
          </Link>
        </div>
      </div>
    )
  }

  const extendedData = getExtendedPackageData(pkg.title) || {}
  const imageUrl = extendedData.image || getPackageImage(pkg.id, pkg.title)

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh', padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Breadcrumb / Back Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/packages"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--slate-600)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to All Packages
          </Link>
        </div>

        {/* Hero Section: Header Details */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {extendedData.category && (
              <span className="badge badge-secondary" style={{ fontSize: '0.85rem' }}>
                {extendedData.category}
              </span>
            )}
            {destination && (
              <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                <MapPin size={13} /> {destination.name}, {destination.country}
              </span>
            )}
            <span className="badge badge-neutral" style={{ fontSize: '0.85rem' }}>
              <Clock size={13} /> {pkg.duration} Days Journey
            </span>
            {avgRating ? (
              <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>
                <Star size={13} fill="#b45309" /> {avgRating} ({reviews.length} reviews)
              </span>
            ) : extendedData.rating ? (
              <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>
                <Star size={13} fill="#b45309" /> {extendedData.rating} ({extendedData.reviewsCount} reviews)
              </span>
            ) : null}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--slate-900)' }}>
            {pkg.title}
          </h1>
        </div>

        {/* Main Grid: Left Details & Right Booking Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr',
            gap: '2.5rem',
            alignItems: 'start',
          }}
          className="package-detail-grid"
        >
          {/* Left Column: Media & Info */}
          <div>
            {/* Main Featured Photo */}
            <div
              className="card"
              style={{
                height: '420px',
                marginBottom: '2rem',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <img
                src={imageUrl}
                alt={pkg.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Overview & Description */}
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--slate-900)' }}>
                About This Itinerary
              </h2>
              <p
                style={{
                  color: 'var(--slate-700)',
                  lineHeight: 1.75,
                  fontSize: '1rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {pkg.description}
              </p>
              
              {extendedData.itinerary && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--slate-800)' }}>
                    Daily Schedule
                  </h3>
                  <div style={{
                    color: 'var(--slate-700)',
                    lineHeight: 1.75,
                    fontSize: '0.95rem',
                    whiteSpace: 'pre-line',
                    backgroundColor: 'var(--slate-50)',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    {extendedData.itinerary}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              <div
                style={{
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--slate-800)' }}>
                  Package Highlights & Amenities
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {(extendedData.highlights || ['Verified accommodations', 'Dedicated travel guide', 'Daily breakfast included', 'Airport transfers']).map((highlight, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-700)', fontSize: '0.9rem' }}>
                      <CheckCircle2 size={18} color="var(--emerald)" /> {highlight}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Spotlight */}
            {destination && (
              <div className="card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <MapPin size={22} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--primary-dark)' }}>
                    Destination: {destination.name}, {destination.country}
                  </h2>
                </div>
                <p style={{ color: 'var(--slate-700)', lineHeight: 1.6, fontSize: '0.95rem' }}>
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
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.35rem', color: 'var(--slate-900)' }}>
                    Traveler Reviews ({reviews.length})
                  </h2>
                  {avgRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <StarRating rating={Math.round(Number(avgRating))} size={16} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)' }}>
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
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
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
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                    No reviews for this travel package yet.
                  </p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Be the first traveler to share feedback!
                  </p>
                </div>
              ) : (
                reviews.map((rev) => (
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
                ))
              )}
            </div>
          </div>

          {/* Right Column: Booking Form Widget */}
          <div>
            <BookingForm travelPackage={pkg} />
          </div>
        </div>
      </div>

      {/* Confirmation modal for review deletion */}
      <ConfirmationDialog
        isOpen={Boolean(deleteReviewId)}
        onClose={() => setDeleteReviewId(null)}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to remove your review? This cannot be undone."
        confirmText="Delete Review"
        loading={deleteLoading}
      />

      <style>{`
        @media (max-width: 900px) {
          .package-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default PackageDetails
