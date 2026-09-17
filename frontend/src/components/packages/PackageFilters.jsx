import React, { useEffect } from 'react'
import { Filter, RotateCcw, X, Check, MapPin, Clock, Star, DollarSign, Users } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export const PackageFilters = ({
  destinations = [],
  selectedDestination = '',
  onDestinationChange,
  destinationCounts = {},
  priceRange,
  onPriceRangeChange,
  minPriceLimit = 0,
  maxPriceLimit = 100000,
  durationFilter = '',
  onDurationFilterChange,
  ratingFilter = '',
  onRatingFilterChange,
  inStockOnly = false,
  onInStockOnlyChange,
  onReset,
  hasActiveFilters = false,
  activeFilterCount = 0,
  isDrawerOpen = false,
  onCloseDrawer,
}) => {
  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen && onCloseDrawer) {
        onCloseDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, onCloseDrawer])

  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Destination Filter */}
      <div className="filter-section">
        <div className="filter-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={14} color="var(--primary)" /> Destination
          </span>
          {selectedDestination && (
            <button
              type="button"
              onClick={() => onDestinationChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          <button
            type="button"
            className={`filter-pill ${!selectedDestination ? 'active' : ''}`}
            onClick={() => onDestinationChange('')}
          >
            <span>All Destinations</span>
            <span className="filter-count-badge">
              {Object.values(destinationCounts).reduce((acc, c) => acc + c, 0) || destinations.length}
            </span>
          </button>

          {destinations.map((dest) => {
            const count = destinationCounts[dest.id] || 0
            const isSelected = String(selectedDestination) === String(dest.id)
            return (
              <button
                key={dest.id}
                type="button"
                className={`filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onDestinationChange(isSelected ? '' : String(dest.id))}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isSelected && <Check size={13} color="var(--primary)" />}
                  {dest.name}
                </span>
                <span className="filter-count-badge">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Price Range Filter */}
      <div className="filter-section">
        <div className="filter-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <DollarSign size={14} color="var(--primary)" /> Max Price
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.925rem' }}>
            {formatCurrency(priceRange)}
          </span>
        </div>

        <div style={{ padding: '0.25rem 0' }}>
          <input
            type="range"
            min={minPriceLimit}
            max={maxPriceLimit}
            step={Math.max(1000, Math.floor((maxPriceLimit - minPriceLimit) / 20))}
            value={priceRange}
            onChange={(e) => onPriceRangeChange(Number(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: 'var(--primary)',
              height: '6px',
            }}
            aria-label="Filter packages by maximum price"
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
              marginTop: '0.4rem',
            }}
          >
            <span>{formatCurrency(minPriceLimit)}</span>
            <span>{formatCurrency(maxPriceLimit)}</span>
          </div>
        </div>
      </div>

      {/* 3. Duration Filter */}
      <div className="filter-section">
        <div className="filter-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} color="var(--primary)" /> Duration
          </span>
          {durationFilter && (
            <button
              type="button"
              onClick={() => onDurationFilterChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.35rem' }}>
          {[
            { id: '', label: 'Any Duration' },
            { id: '1-3', label: '1 – 3 Days (Short Getaway)' },
            { id: '4-6', label: '4 – 6 Days (Standard Tour)' },
            { id: '7+', label: '7+ Days (Extended Journey)' },
          ].map((item) => {
            const isSelected = durationFilter === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onDurationFilterChange(isSelected && item.id !== '' ? '' : item.id)}
              >
                <span>{item.label}</span>
                {isSelected && <Check size={13} color="var(--primary)" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Verified Rating Filter */}
      <div className="filter-section">
        <div className="filter-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Star size={14} color="#f59e0b" /> Verified Rating
          </span>
          {ratingFilter && (
            <button
              type="button"
              onClick={() => onRatingFilterChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.35rem' }}>
          {[
            { id: '', label: 'Any Rating' },
            { id: '4.5', label: '4.5 & above' },
            { id: '4.0', label: '4.0 & above' },
            { id: '3.5', label: '3.5 & above' },
          ].map((item) => {
            const isSelected = ratingFilter === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onRatingFilterChange(isSelected && item.id !== '' ? '' : item.id)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  {item.id && <Star size={12} fill="#f59e0b" color="#f59e0b" />}
                  {item.label}
                </span>
                {isSelected && <Check size={13} color="var(--primary)" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Availability (In-stock) Filter */}
      <div className="filter-section">
        <div className="filter-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={14} color="var(--primary)" /> Availability
          </span>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            padding: '0.4rem 0',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--slate-800)',
          }}
        >
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockOnlyChange(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--primary)',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          />
          <span>Available Only (Exclude Sold Out)</span>
        </label>
      </div>

      {/* 6. Reset Filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary btn-block"
          style={{
            marginTop: '0.5rem',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <RotateCcw size={15} />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="filter-sidebar filter-sidebar-sticky desktop-only" aria-label="Catalog filters">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.85rem',
            borderBottom: '1.5px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--primary)" />
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Filters
            </span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--white)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {filterContent}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className="drawer-backdrop"
            onClick={onCloseDrawer}
            aria-hidden="true"
          />
          <div
            className="filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Filter travel packages"
          >
            <div className="filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseDrawer}
                className="modal-close-btn"
                aria-label="Close filters drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="filter-drawer-body">
              {filterContent}
            </div>

            <div className="filter-drawer-footer">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={onCloseDrawer}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PackageFilters
