import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { reviewService } from '../../services/reviewService'
import { packageService } from '../../services/packageService'
import { useToast } from '../../context/ToastContext'
import StarRating from '../../components/reviews/StarRating'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import {
  Star,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  MessageSquare,
  Award,
  Sparkles
} from 'lucide-react'

export const ManageReviews = () => {
  const toast = useToast()
  const [reviews, setReviews] = useState([])
  const [packagesMap, setPackagesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('ALL')

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchAdminReviews = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const [reviewsData, pkgsData] = await Promise.allSettled([
        reviewService.getAllReviews(),
        packageService.getAllPackages(),
      ])

      const rList = reviewsData.status === 'fulfilled' ? reviewsData.value || [] : []
      setReviews(rList)

      const pMap = {}
      if (pkgsData.status === 'fulfilled' && pkgsData.value) {
        pkgsData.value.forEach((p) => {
          pMap[p.id] = p.title
        })
      }
      setPackagesMap(pMap)
    } catch (err) {
      console.error('Error loading reviews for admin:', err)
      setErrorMsg(err.message || 'Failed to fetch reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminReviews()
  }, [])

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      setDeleteLoading(true)
      await reviewService.deleteReview(deleteTargetId)
      toast.success(`Review #${deleteTargetId} has been deleted.`)
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Failed to delete review:', err)
      toast.error(err.message || 'Could not delete review.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = reviews.length
    if (total === 0) return { total: 0, avgRating: '0.0', fiveStarCount: 0 }

    let sum = 0
    let fiveStars = 0
    reviews.forEach((r) => {
      sum += Number(r.rating) || 0
      if (Number(r.rating) === 5) fiveStars += 1
    })

    return {
      total,
      avgRating: (sum / total).toFixed(1),
      fiveStarCount: fiveStars,
    }
  }, [reviews])

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Rating filter
      if (ratingFilter !== 'ALL' && Number(r.rating) !== Number(ratingFilter)) {
        return false
      }

      // 2. Search query
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const idMatch = r.id?.toString().includes(q)
        const nameMatch = r.customerName?.toLowerCase().includes(q)
        const pkgMatch = (r.packageTitle || packagesMap[r.travelPackageId])?.toLowerCase().includes(q)
        const commentMatch = r.comment?.toLowerCase().includes(q)

        if (!idMatch && !nameMatch && !pkgMatch && !commentMatch) {
          return false
        }
      }

      return true
    })
  }, [reviews, ratingFilter, searchTerm, packagesMap])

  if (loading) {
    return <LoadingSpinner message="Loading all reviews from database..." fullPage />
  }

  if (errorMsg) {
    return <ErrorMessage message={errorMsg} onRetry={fetchAdminReviews} />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={24} color="#eab308" /> Manage Reviews
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            Moderate customer feedback, review ratings, and traveler testimonials.
          </p>
        </div>
      </div>

      {/* KPI STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#d97706', borderRadius: '50%' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Reviews</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>{metrics.total}</p>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#dbeafe', color: 'var(--primary)', borderRadius: '50%' }}>
            <Award size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Average Rating</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {metrics.avgRating} <span style={{ fontSize: '0.9rem', color: '#eab308' }}>★</span>
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#16a34a', borderRadius: '50%' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>5-Star Reviews</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{metrics.fiveStarCount}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {/* SEARCH & FILTERS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
            <Search size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search reviews by customer, package, or comment keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--slate-600)" />
            <select
              className="input"
              style={{ padding: '0.5rem', width: 'auto', fontSize: '0.875rem' }}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No Reviews Found"
            description={searchTerm || ratingFilter !== 'ALL' ? 'Try adjusting your search query or rating filter.' : 'No customer reviews available in the database.'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredReviews.map((r) => {
              const pkgTitle = r.packageTitle || packagesMap[r.travelPackageId] || `Package #${r.travelPackageId}`

              return (
                <div
                  key={r.id}
                  style={{
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#fff',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Review #{r.id}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                          {r.customerName || `User #${r.userId}`}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <Link
                          to={`/packages/${r.travelPackageId}`}
                          style={{
                            fontWeight: 600,
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.9rem',
                          }}
                        >
                          {pkgTitle} <ExternalLink size={13} />
                        </Link>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StarRating rating={r.rating} size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309' }}>
                          ({r.rating} / 5)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteTargetId(r.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete this review"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                  <p style={{ color: 'var(--slate-700)', fontSize: '0.925rem', lineHeight: 1.6, margin: 0 }}>
                    "{r.comment}"
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Review"
        message={`Are you sure you want to delete review #${deleteTargetId}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}

export default ManageReviews
