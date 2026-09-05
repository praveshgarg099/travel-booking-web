import React from 'react'
import { Search, RotateCcw } from 'lucide-react'

export const PackageFilters = ({
  searchQuery,
  onSearchChange,
  destinations = [],
  selectedDestination,
  onDestinationChange,
  sortBy,
  onSortChange,
  onReset,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        {/* Search by title/keyword */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Search Packages</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by destination or package..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search
              size={16}
              color="var(--slate-400)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Destination dropdown */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Destination</label>
          <select
            className="form-control"
            value={selectedDestination}
            onChange={(e) => onDestinationChange(e.target.value)}
          >
            <option value="">All Destinations</option>
            {destinations.map((dest, idx) => {
              const destId = dest.id || idx + 1
              return (
                <option key={destId} value={destId}>
                  {dest.name} {dest.country ? `(${dest.country})` : ''}
                </option>
              )
            })}
          </select>
        </div>

        {/* Sort selector */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Sort By</label>
          <select
            className="form-control"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="featured">Featured / Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="duration-asc">Duration: Short to Long</option>
            <option value="duration-desc">Duration: Long to Short</option>
          </select>
        </div>

        {/* Reset button */}
        <div style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            title="Reset Filters"
            style={{ width: '100%' }}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PackageFilters
