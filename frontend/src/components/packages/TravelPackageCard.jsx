import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Users, ArrowRight, MapPin, Star } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { getPackageImage } from '../../utils/imageHelper'
import { getExtendedPackageData } from '../../data/demoData'

export const TravelPackageCard = ({ pkg, destinationName = '' }) => {
  const navigate = useNavigate()
  const extendedData = getExtendedPackageData(pkg.title) || {}
  const imageUrl = extendedData.image || getPackageImage(pkg.id, pkg.title)
  const isSoldOut = pkg.availableSeats <= 0

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Thumbnail with overlay badges */}
      <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt={pkg.title}
          className="zoom-img"
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
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {extendedData.category && (
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--white)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {extendedData.category}
            </span>
          )}
          {destinationName && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                color: 'var(--white)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <MapPin size={12} /> {destinationName}
            </span>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          {extendedData.rating && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: 'var(--slate-800)',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Star size={12} fill="#b45309" color="#b45309" /> {extendedData.rating}
            </span>
          )}
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--slate-800)',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Clock size={12} /> {pkg.duration} Days
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span
            className={`badge ${isSoldOut ? 'badge-danger' : pkg.availableSeats <= 5 ? 'badge-warning' : 'badge-success'}`}
          >
            <Users size={12} />
            {isSoldOut ? 'Sold Out' : `${pkg.availableSeats} Seats Left`}
          </span>
        </div>

        <h3
          style={{
            fontSize: '1.2rem',
            marginBottom: '0.65rem',
            color: 'var(--slate-900)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={pkg.title}
        >
          {pkg.title}
        </h3>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.885rem',
            lineHeight: 1.5,
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
            borderTop: '1px solid var(--slate-100)',
            paddingTop: '1rem',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
              Starting from
            </span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              {formatCurrency(pkg.price)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <Link to={`/packages/${pkg.id}`} className="btn btn-secondary btn-sm" title="View Details">
              Details
            </Link>
            <button
              onClick={() => navigate(`/packages/${pkg.id}`)}
              disabled={isSoldOut}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Book</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TravelPackageCard
