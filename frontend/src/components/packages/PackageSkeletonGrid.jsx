import React from 'react'

export const PackageSkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="grid-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" style={{ height: '440px' }}>
          {/* Shimmer Image Box */}
          <div
            className="skeleton-box"
            style={{ width: '100%', height: '220px', borderRadius: 0 }}
          />

          {/* Shimmer Card Body */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Badges line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="skeleton-box" style={{ width: '80px', height: '20px', borderRadius: 'var(--radius-full)' }} />
              <div className="skeleton-box" style={{ width: '60px', height: '20px', borderRadius: 'var(--radius-full)' }} />
            </div>

            {/* Title line */}
            <div className="skeleton-box" style={{ width: '85%', height: '24px', marginBottom: '0.75rem' }} />

            {/* Description lines */}
            <div className="skeleton-box" style={{ width: '100%', height: '14px', marginBottom: '0.5rem' }} />
            <div className="skeleton-box" style={{ width: '70%', height: '14px', marginBottom: 'auto' }} />

            {/* Price & Action row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div className="skeleton-box" style={{ width: '45px', height: '12px', marginBottom: '0.4rem' }} />
                <div className="skeleton-box" style={{ width: '90px', height: '22px' }} />
              </div>
              <div className="skeleton-box" style={{ width: '110px', height: '38px', borderRadius: 'var(--radius-lg)' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PackageSkeletonGrid
