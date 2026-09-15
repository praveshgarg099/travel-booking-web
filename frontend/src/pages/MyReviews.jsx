import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reviewService } from '../services/reviewService'
import { packageService } from '../services/packageService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import StarRating from '../components/reviews/StarRating'
import ReviewForm from '../components/reviews/ReviewForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import ConfirmationDialog from '../components/common/ConfirmationDialog'
import Modal from '../components/common/Modal'
import { Star, Trash2, Edit3, ExternalLink } from 'lucide-react'

export const MyReviews = () => {
  const { user } = useAuth()
  const toast = useToast()

  const [reviews, setReviews] = useState([])
  const [packagesMap, setPackagesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [editingReview, setEditingReview] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUserReviews = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const [userReviews, pkgs] = await Promise.all([
        reviewService.getMyReviews().catch(async () => {
          const all = await reviewService.getAllReviews()
          return all.filter((r) => Number(r.userId) === Number(user.id))
        }),
        packageService.getAllPackages(),
      ])

      const map = {}
      if (pkgs) {
        pkgs.forEach((p) => {
          map[p.id] = p.title
        })
      }
      setPackagesMap(map)
      setReviews(userReviews || [])
    } catch (err) {
      console.error('Failed to load user reviews:', err)
      setErrorMsg(err.message || 'Could not fetch your reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserReviews()
  }, [user])

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      setDeleteLoading(true)
      await reviewService.deleteReview(deleteTargetId)
      toast.success('Review removed.')
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Failed to delete review:', err)
      toast.error(err.message || 'Could not delete review.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading your submitted reviews..." fullPage />
  }

  if (errorMsg) {
    return (
      <ErrorMessage
        title="Failed to Load Reviews"
        message={errorMsg}
        onRetry={fetchUserReviews}
      />
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>My Reviews</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
          Traveler ratings and feedback submitted from your account.
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No Reviews Submitted"
          description="You haven't written any package reviews yet. Experience a tour and share your thoughts with fellow travelers!"
          actionText="Explore Packages"
          actionLink="/packages"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reviews.map((r) => {
            const pkgTitle = packagesMap[r.travelPackageId] || `Travel Package #${r.travelPackageId}`
            return (
              <div key={r.id} className="card" style={{ padding: '1.5rem' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Link
                        to={`/packages/${r.travelPackageId}`}
                        style={{
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: 'var(--slate-900)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>{pkgTitle}</span>
                        <ExternalLink size={14} color="var(--primary)" />
                      </Link>
                    </div>
                    <StarRating rating={r.rating} size={16} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setEditingReview(r)}
                      className="btn btn-secondary btn-sm"
                      title="Edit review"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(r.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete review"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                <p style={{ color: 'var(--slate-700)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  "{r.comment}"
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Review Modal */}
      <Modal
        isOpen={Boolean(editingReview)}
        onClose={() => setEditingReview(null)}
        title="Edit Your Review"
      >
        {editingReview && (
          <ReviewForm
            travelPackageId={editingReview.travelPackageId}
            existingReview={editingReview}
            onSuccess={(updated) => {
              setReviews((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item))
              )
              setEditingReview(null)
            }}
            onCancel={() => setEditingReview(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Yes, Delete Review"
        loading={deleteLoading}
      />
    </div>
  )
}

export default MyReviews
