import React from 'react'
import StarRating from './StarRating'
import { User, Trash2, Edit2 } from 'lucide-react'

export const ReviewCard = ({ review, currentUserId, onEdit, onDelete }) => {
  const isOwner = currentUserId && review.userId && Number(currentUserId) === Number(review.userId)

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--white)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            <User size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--slate-800)' }}>
              Verified Traveler {isOwner && <span className="badge badge-primary" style={{ marginLeft: '0.35rem' }}>You</span>}
            </div>
            <StarRating rating={review.rating} size={15} />
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

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
        "{review.comment}"
      </p>
    </div>
  )
}

export default ReviewCard
