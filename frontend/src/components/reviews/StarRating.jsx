import React from 'react'
import { Star } from 'lucide-react'

export const StarRating = ({
  rating = 5,
  onChange = null,
  size = 18,
  readOnly = true,
}) => {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {stars.map((starVal) => {
        const isFilled = starVal <= rating
        return (
          <button
            key={starVal}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starVal)}
            style={{
              background: 'none',
              border: 'none',
              padding: readOnly ? 0 : '2px',
              cursor: readOnly ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: isFilled ? '#f59e0b' : '#cbd5e1',
            }}
            aria-label={`${starVal} Star`}
          >
            <Star
              size={size}
              fill={isFilled ? '#f59e0b' : 'none'}
              strokeWidth={isFilled ? 0 : 2}
            />
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
