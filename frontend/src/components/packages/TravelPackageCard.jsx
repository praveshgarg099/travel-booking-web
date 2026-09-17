import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Users, ArrowRight, MapPin, Star } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { getPackageImage } from '../../utils/imageHelper'

export const TravelPackageCard = ({ pkg, destinationName = '', ratingData = null }) => {
  const navigate = useNavigate()
  const dest = destinationName || pkg.destinationName || ''
  const imageUrl = getPackageImage(pkg.id, pkg.title, dest)
  const isSoldOut = pkg.availableSeats == null || pkg.availableSeats <= 0

  const handleCardClick = (e) => {
    // Avoid triggering card navigation if clicking directly on a link or button
    if (e.target.closest('a') || e.target.closest('button')) return
    navigate(`/packages/${pkg.id}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/packages/${pkg.id}`)
    }
  }

  return (
    <article
      className="card card-hover"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Travel package: ${pkg.title} in ${dest || 'India'}, ${pkg.duration} days for ${formatCurrency(pkg.price)} per person`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {/* Thumbnail with overlay badges */}
      <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden', backgroundColor: 'var(--slate-100)' }}>
        <img
          src={imageUrl}
          alt={`${pkg.title} scenic view in ${dest || 'India'}`}
          className="zoom-img"
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
          }}
        />

        {/* Top Left: Destination tag */}
        {dest && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.82)',
                color: 'var(--white)',
                backdropFilter: 'blur(6px)',
                boxShadow: 'var(--shadow-sm)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              <MapPin size={13} color="#38bdf8" /> {dest}
            </span>
          </div>
        )}

        {/* Top Right: Seat Availability Badge */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
          }}
        >
          <span
            className={`badge ${
              isSoldOut
                ? 'badge-danger'
                : pkg.availableSeats <= 5
                ? 'badge-warning'
                : 'badge-success'
            }`}
            style={{
              boxShadow: 'var(--shadow-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            <Users size={12} />
            {isSoldOut ? 'Sold Out' : `${pkg.availableSeats} Seats Left`}
          </span>
        </div>

        {/* Bottom Bar: Duration & Real Rating badges */}
        <div
          style={{
            position: 'absolute',
            bottom: '0.85rem',
            left: '1rem',
            right: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--slate-800)',
              fontWeight: 700,
              fontSize: '0.775rem',
              boxShadow: 'var(--shadow-sm)',
              textTransform: 'none',
            }}
          >
            <Clock size={13} color="var(--primary)" /> {pkg.duration} {pkg.duration === 1 ? 'Day' : 'Days'}
          </span>

          {/* Display REAL rating badge only if review data actually exists */}
          {ratingData && ratingData.reviewCount > 0 ? (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#92400e',
                fontWeight: 700,
                fontSize: '0.775rem',
                boxShadow: 'var(--shadow-sm)',
                textTransform: 'none',
              }}
              title={`Rated ${ratingData.avgRating.toFixed(1)} out of 5 based on ${ratingData.reviewCount} traveler review${ratingData.reviewCount > 1 ? 's' : ''}`}
            >
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span>{ratingData.avgRating.toFixed(1)}</span>
              <span style={{ color: 'var(--slate-500)', fontWeight: 500, fontSize: '0.725rem' }}>
                ({ratingData.reviewCount})
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Body Content */}
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.25rem 1.5rem 1.5rem' }}>
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--slate-900)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.35,
          }}
          title={pkg.title}
        >
          {pkg.title}
        </h3>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: 1.55,
            marginBottom: '1.25rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {pkg.description}
        </p>

        {/* Footer / Price & Actions */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-muted)',
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              Starting from
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                {formatCurrency(pkg.price)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                / person
              </span>
            </div>
          </div>

          <Link
            to={`/packages/${pkg.id}`}
            className="btn btn-primary btn-sm"
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 600,
              fontSize: '0.875rem',
              gap: '0.35rem',
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View details for ${pkg.title}`}
          >
            <span>View Details</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default TravelPackageCard
