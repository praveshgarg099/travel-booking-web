import React, { useState } from 'react'
import StarRating from './StarRating'
import { reviewService } from '../../services/reviewService'
import { useToast } from '../../context/ToastContext'

export const ReviewForm = ({
  travelPackageId,
  existingReview = null,
  onSuccess,
  onCancel = null,
}) => {
  const toast = useToast()
  const [rating, setRating] = useState(existingReview?.rating || 5)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const isEditing = Boolean(existingReview)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!comment.trim()) {
      setErrorMsg('Please write a review comment.')
      return
    }

    if (rating < 1 || rating > 5) {
      setErrorMsg('Rating must be between 1 and 5 stars.')
      return
    }

    try {
      setLoading(true)
      const payload = {
        rating,
        comment: comment.trim(),
        travelPackageId: Number(travelPackageId),
      }

      let res
      if (isEditing) {
        res = await reviewService.updateReview(existingReview.id, payload)
        toast.success('Review updated successfully!')
      } else {
        res = await reviewService.createReview(payload)
        toast.success('Thank you for your review!')
      }

      setComment('')
      if (onSuccess) onSuccess(res)
    } catch (err) {
      console.error('Failed to submit review:', err)
      setErrorMsg(err.message || 'Could not submit review.')
      toast.error(err.message || 'Could not submit review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      {errorMsg && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--rose-light)',
            color: 'var(--rose)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Your Rating (1 to 5 Stars)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          <StarRating rating={rating} onChange={setRating} readOnly={false} size={24} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
            {rating} of 5 Stars
          </span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reviewComment">
          Your Experience / Feedback
        </label>
        <textarea
          id="reviewComment"
          className="form-control"
          rows={3}
          placeholder="Share details about the destinations, guides, accommodations, or tour itinerary..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? 'Submitting...' : isEditing ? 'Update Review' : 'Post Review'}
        </button>
      </div>
    </form>
  )
}

export default ReviewForm
