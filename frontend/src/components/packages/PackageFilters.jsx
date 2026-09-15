import React from 'react'
import { Search, RotateCcw, Filter, SlidersHorizontal } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export const PackageFilters = ({
  searchQuery,
  onSearchChange,
  destinations = [],
  selectedDestination,
  onDestinationChange,
  priceRange,
  onPriceRangeChange,
  maxPriceLimit = 100000,
  durationFilter,
  onDurationFilterChange,
  inStockOnly,
  onInStockOnlyChange,
  sortBy,
  onSortChange,
  onReset,
  totalResults,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedDestination) ||
    priceRange < maxPriceLimit ||
    Boolean(durationFilter) ||
    inStockOnly ||
    sortBy !== 'featured'

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        marginBottom: '2rem',
        backgroundColor: 'var(--white)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Primary Row: Search, Destination, Sort, and Reset */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        {/* Search by title/keyword */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Search Itineraries
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by city, title, attraction..."
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
          <label className="form-label" style={{ fontWeight: 600 }}>
            Destination
          </label>
          <select
            className="form-control"
            value={selectedDestination}
            onChange={(e) => onDestinationChange(e.target.value)}
          >
            <option value="">All Destinations (Worldwide)</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.id}>
                {dest.name} {dest.country ? `(${dest.country})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Duration selector */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Trip Duration
          </label>
          <select
            className="form-control"
            value={durationFilter}
            onChange={(e) => onDurationFilterChange(e.target.value)}
          >
            <option value="">Any Length</option>
            <option value="short">Short Getaways (1 - 4 Days)</option>
            <option value="medium">Medium Adventures (5 - 7 Days)</option>
            <option value="long">Extended Expeditions (8+ Days)</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Sort Catalog
          </label>
          <select
            className="form-control"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="featured">Featured Itineraries</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="duration-asc">Duration: Short to Long</option>
            <option value="duration-desc">Duration: Long to Short</option>
            <option value="name-asc">Title: A to Z</option>
          </select>
        </div>
      </div>

      {/* Secondary Row: Max Price Slider, In-stock checkbox, Reset Action */}
      <div
        style={{
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        {/* Price Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', whiteSpace: 'nowrap' }}>
            Max Price: {formatCurrency(priceRange)}
          </span>
          <input
            type="range"
            min="10000"
            max={maxPriceLimit}
            step="5000"
            value={priceRange}
            onChange={(e) => onPriceRangeChange(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* In-Stock Only Toggle & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--slate-700)',
            }}
          >
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onInStockOnlyChange(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>Seats Available Only</span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PackageFilters
