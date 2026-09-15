import React from 'react'
import StarRating from './StarRating'
import { User, Trash2, Edit2, ShieldCheck } from 'lucide-react'

export const ReviewCard = ({ review, currentUserId, onEdit, onDelete }) => {
  const isOwner = currentUserId && review.userId && Number(currentUserId) === Number(review.userId)
  const displayName = review.customerName || (isOwner ? 'You' : 'Verified Traveler')

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              flexShrink: 0,
            }}
          >
            {review.customerName ? review.customerName.charAt(0).toUpperCase() : <User size={18} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                {displayName}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  color: 'var(--emerald-dark)',
                  backgroundColor: '#ecfdf5',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <ShieldCheck size={12} /> Verified Traveler
              </span>
              {isOwner && (
                <span className="badge badge-primary" style={{ fontSize: '0.725rem' }}>
                  Your Review
                </span>
              )}
            </div>
            <div style={{ marginTop: '0.2rem' }}>
              <StarRating rating={review.rating} size={15} />
            </div>
          </div>
        </div>

        {isOwner && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="btn btn-secondary btn-sm"
                title="Edit review"
                style={{ padding: '0.3rem 0.6rem' }}
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(review.id)}
                className="btn btn-danger btn-sm"
                title="Delete review"
                style={{ padding: '0.3rem 0.6rem' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{ color: 'var(--slate-700)', fontSize: '0.925rem', lineHeight: 1.6, margin: 0 }}>
        "{review.comment}"
      </p>
    </div>
  )
}

export default ReviewCard
