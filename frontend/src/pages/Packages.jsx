import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { packageService } from '../services/packageService'
import { destinationService } from '../services/destinationService'
import { reviewService } from '../services/reviewService'
import TravelPackageCard from '../components/packages/TravelPackageCard'
import PackageFilters from '../components/packages/PackageFilters'
import PackageSkeletonGrid from '../components/packages/PackageSkeletonGrid'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import { formatCurrency } from '../utils/formatters'
import { Search, X, Filter, Compass, SlidersHorizontal, ArrowUpDown } from 'lucide-react'

export const Packages = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Data states
  const [packages, setPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)

  // URL-driven Filter states
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')
  const [selectedDestination, setSelectedDestination] = useState(() => searchParams.get('dest') || '')
  const [priceRange, setPriceRange] = useState(() => {
    const p = searchParams.get('maxPrice')
    return p ? Number(p) : null
  })
  const [durationFilter, setDurationFilter] = useState(() => searchParams.get('duration') || '')
  const [ratingFilter, setRatingFilter] = useState(() => searchParams.get('rating') || '')
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get('inStock') === 'true')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'featured')

  // Fetch all catalog data
  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const [pkgsResult, destsResult, revsResult] = await Promise.allSettled([
        packageService.getAllPackages(),
        destinationService.getAllDestinations(),
        reviewService.getAllReviews(),
      ])

      const loadedPkgs = pkgsResult.status === 'fulfilled' && Array.isArray(pkgsResult.value) ? pkgsResult.value : []
      const loadedDests = destsResult.status === 'fulfilled' && Array.isArray(destsResult.value) ? destsResult.value : []
      const loadedRevs = revsResult.status === 'fulfilled' && Array.isArray(revsResult.value) ? revsResult.value : []

      if (pkgsResult.status === 'rejected' && destsResult.status === 'rejected') {
        throw new Error('Unable to load travel catalog. Please try again.')
      }

      setPackages(loadedPkgs)
      setDestinations(loadedDests)
      setReviews(loadedRevs)

      // Initialize price range from loaded data if not already set from URL
      if (loadedPkgs.length > 0) {
        const prices = loadedPkgs.map((p) => Number(p.price) || 0)
        const maxLimit = Math.ceil(Math.max(...prices))
        setPriceRange((prev) => (prev !== null ? prev : maxLimit))
      }
    } catch (err) {
      console.error('Failed to load travel catalog:', err)
      setErrorMsg(err.message || 'Unable to load journeys. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Destination ID to name map
  const destinationMap = useMemo(() => {
    const map = {}
    destinations.forEach((d) => {
      if (d.id != null) {
        map[d.id] = d.name
      }
    })
    return map
  }, [destinations])

  // Real review ratings map derived from database reviews
  const ratingsMap = useMemo(() => {
    const map = {}
    reviews.forEach((r) => {
      const pkgId = r.travelPackageId
      if (!pkgId) return
      if (!map[pkgId]) {
        map[pkgId] = { total: 0, count: 0, avgRating: 0, reviewCount: 0 }
      }
      map[pkgId].total += Number(r.rating) || 0
      map[pkgId].count += 1
    })
    Object.keys(map).forEach((id) => {
      map[id].avgRating = map[id].count > 0 ? map[id].total / map[id].count : 0
      map[id].reviewCount = map[id].count
    })
    return map
  }, [reviews])

  // Dynamic price bounds derived from actual packages
  const { minPriceLimit, maxPriceLimit } = useMemo(() => {
    if (!packages || packages.length === 0) {
      return { minPriceLimit: 0, maxPriceLimit: 100000 }
    }
    const prices = packages.map((p) => Number(p.price) || 0)
    return {
      minPriceLimit: Math.floor(Math.min(...prices)),
      maxPriceLimit: Math.ceil(Math.max(...prices)),
    }
  }, [packages])

  // Effective price range (fallback to maxPriceLimit if null)
  const currentMaxPrice = priceRange !== null ? priceRange : maxPriceLimit

  // Destination package counts
  const destinationCounts = useMemo(() => {
    const counts = {}
    packages.forEach((pkg) => {
      if (pkg.destinationId != null) {
        counts[pkg.destinationId] = (counts[pkg.destinationId] || 0) + 1
      }
    })
    return counts
  }, [packages])

  // Synchronize state changes to URL query parameters
  const updateUrlParams = useCallback(
    (updates) => {
      const current = Object.fromEntries(searchParams.entries())
      const next = { ...current, ...updates }

      // Remove empty/default parameters to keep URL clean
      if (!next.q) delete next.q
      if (!next.dest) delete next.dest
      if (!next.maxPrice || Number(next.maxPrice) >= maxPriceLimit) delete next.maxPrice
      if (!next.duration) delete next.duration
      if (!next.rating) delete next.rating
      if (next.inStock !== 'true') delete next.inStock
      if (!next.sort || next.sort === 'featured') delete next.sort

      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, maxPriceLimit]
  )

  // Filter setters that also update URL
  const handleSearchChange = (val) => {
    setSearchQuery(val)
    updateUrlParams({ q: val.trim() || undefined })
  }

  const handleDestinationChange = (destId) => {
    setSelectedDestination(destId)
    updateUrlParams({ dest: destId || undefined })
  }

  const handlePriceChange = (val) => {
    setPriceRange(val)
    updateUrlParams({ maxPrice: val < maxPriceLimit ? String(val) : undefined })
  }

  const handleDurationChange = (val) => {
    setDurationFilter(val)
    updateUrlParams({ duration: val || undefined })
  }

  const handleRatingChange = (val) => {
    setRatingFilter(val)
    updateUrlParams({ rating: val || undefined })
  }

  const handleInStockChange = (val) => {
    setInStockOnly(val)
    updateUrlParams({ inStock: val ? 'true' : undefined })
  }

  const handleSortChange = (val) => {
    setSortBy(val)
    updateUrlParams({ sort: val !== 'featured' ? val : undefined })
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedDestination('')
    setPriceRange(maxPriceLimit)
    setDurationFilter('')
    setRatingFilter('')
    setInStockOnly(false)
    setSortBy('featured')
    setSearchParams({}, { replace: true })
    setDrawerOpen(false)
  }

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedDestination) count++
    if (priceRange !== null && priceRange < maxPriceLimit) count++
    if (durationFilter) count++
    if (ratingFilter) count++
    if (inStockOnly) count++
    return count
  }, [selectedDestination, priceRange, maxPriceLimit, durationFilter, ratingFilter, inStockOnly])

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      activeFilterCount > 0 ||
      sortBy !== 'featured'
  )

  // Filter & sort logic applied to loaded catalog
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        // 1. Keyword search
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase()
          const titleMatch = pkg.title?.toLowerCase().includes(q)
          const descMatch = pkg.description?.toLowerCase().includes(q)
          const destName = (destinationMap[pkg.destinationId] || pkg.destinationName || '').toLowerCase()
          const destMatch = destName.includes(q)
          const countryMatch = (pkg.country || '').toLowerCase().includes(q)

          if (!titleMatch && !descMatch && !destMatch && !countryMatch) {
            return false
          }
        }

        // 2. Destination filter
        if (selectedDestination) {
          if (String(pkg.destinationId) !== String(selectedDestination)) {
            return false
          }
        }

        // 3. Price range filter
        if (currentMaxPrice != null && pkg.price != null && pkg.price > currentMaxPrice) {
          return false
        }

        // 4. Duration filter
        if (durationFilter) {
          const dur = Number(pkg.duration) || 0
          if (durationFilter === '1-3' && (dur < 1 || dur > 3)) return false
          if (durationFilter === '4-6' && (dur < 4 || dur > 6)) return false
          if (durationFilter === '7+' && dur < 7) return false
        }

        // 5. Verified Rating filter
        if (ratingFilter) {
          const minRate = Number(ratingFilter)
          const pkgRating = ratingsMap[pkg.id]?.avgRating || 0
          if (pkgRating < minRate) {
            return false
          }
        }

        // 6. In-Stock (Available Only) filter
        if (inStockOnly && (pkg.availableSeats == null || pkg.availableSeats <= 0)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0)
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0)
        if (sortBy === 'rating-desc') {
          const rateA = ratingsMap[a.id]?.avgRating || 0
          const rateB = ratingsMap[b.id]?.avgRating || 0
          if (rateB !== rateA) return rateB - rateA
          return (a.title || '').localeCompare(b.title || '')
        }
        if (sortBy === 'duration-asc') return (a.duration || 0) - (b.duration || 0)
        if (sortBy === 'duration-desc') return (b.duration || 0) - (a.duration || 0)
        return 0
      })
  }, [
    packages,
    searchQuery,
    selectedDestination,
    currentMaxPrice,
    durationFilter,
    ratingFilter,
    inStockOnly,
    sortBy,
    destinationMap,
    ratingsMap,
  ])

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '85vh' }}>
      {/* 1. HERO / HEADER SECTION */}
      <section className="explore-hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#7dd3fc',
              marginBottom: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Compass size={16} /> Worldwide Travel Itineraries
          </span>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
              color: 'var(--white)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem',
            }}
          >
            Explore Your Next Journey
          </h1>

          <p
            style={{
              color: 'var(--slate-200)',
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              maxWidth: '620px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Discover unforgettable destinations, transparent pricing, and instant seat confirmation.
          </p>

          {/* 2. PROMINENT SEARCH BAR */}
          <div className="explore-search-bar">
            <Search size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              className="explore-search-input"
              placeholder="Search destinations, tours, or keywords..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search travel packages by destination, title, or keyword"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-400)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'color 0.15s ease',
                }}
                aria-label="Clear search input"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. MAIN EXPLORE CATALOG CONTENT */}
      <div className="container" style={{ paddingBottom: '5rem' }}>
        {/* Top Controls Bar: Result Count, Mobile Filter Trigger, Sort Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Result Count */}
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {loading ? (
                'Loading journeys...'
              ) : (
                <>
                  {filteredPackages.length}{' '}
                  {filteredPackages.length === 1 ? 'journey found' : 'journeys found'}
                </>
              )}
            </span>
            {!loading && packages.length > 0 && filteredPackages.length !== packages.length && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                (filtered from {packages.length} total)
              </span>
            )}
          </div>

          {/* Right Controls: Mobile Filter Button & Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Mobile Filter Drawer Trigger */}
            <button
              type="button"
              className="btn btn-secondary mobile-only"
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.9rem',
                padding: '0.55rem 1rem',
              }}
              aria-label="Open filter options"
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--white)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.1rem 0.45rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label
                htmlFor="explore-sort"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--slate-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <ArrowUpDown size={14} /> Sort By:
              </label>
              <select
                id="explore-sort"
                className="form-control"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{
                  width: 'auto',
                  padding: '0.45rem 2rem 0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: 'var(--white)',
                }}
              >
                <option value="featured">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Rating: High to Low</option>
                <option value="duration-asc">Duration: Short to Long</option>
                <option value="duration-desc">Duration: Long to Short</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.75rem',
            }}
          >
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Active Filters:
            </span>

            {searchQuery.trim() && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handleSearchChange('')}
                title="Remove search query"
              >
                <span>Query: "{searchQuery.trim()}"</span>
                <X size={12} />
              </button>
            )}

            {selectedDestination && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handleDestinationChange('')}
                title="Remove destination filter"
              >
                <span>Destination: {destinationMap[selectedDestination] || selectedDestination}</span>
                <X size={12} />
              </button>
            )}

            {priceRange !== null && priceRange < maxPriceLimit && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handlePriceChange(maxPriceLimit)}
                title="Remove price limit"
              >
                <span>Max: {formatCurrency(priceRange)}</span>
                <X size={12} />
              </button>
            )}

            {durationFilter && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handleDurationChange('')}
                title="Remove duration filter"
              >
                <span>
                  Duration:{' '}
                  {durationFilter === '1-3'
                    ? '1–3 Days'
                    : durationFilter === '4-6'
                    ? '4–6 Days'
                    : '7+ Days'}
                </span>
                <X size={12} />
              </button>
            )}

            {ratingFilter && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handleRatingChange('')}
                title="Remove rating filter"
              >
                <span>Rating: {ratingFilter}+ ★</span>
                <X size={12} />
              </button>
            )}

            {inStockOnly && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handleInStockChange(false)}
                title="Remove in-stock only filter"
              >
                <span>Available Only</span>
                <X size={12} />
              </button>
            )}

            {sortBy !== 'featured' && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => handleSortChange('featured')}
                title="Reset to recommended sort"
              >
                <span>Sort: {sortBy}</span>
                <X size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--rose)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '0.25rem',
                textDecoration: 'underline',
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* 4. MAIN LAYOUT: Sidebar (Desktop) + Package Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
            className="explore-layout-grid"
          >
            {/* Desktop Left Sidebar */}
            <PackageFilters
              destinations={destinations}
              selectedDestination={selectedDestination}
              onDestinationChange={handleDestinationChange}
              destinationCounts={destinationCounts}
              priceRange={currentMaxPrice}
              onPriceRangeChange={handlePriceChange}
              minPriceLimit={minPriceLimit}
              maxPriceLimit={maxPriceLimit}
              durationFilter={durationFilter}
              onDurationFilterChange={handleDurationChange}
              ratingFilter={ratingFilter}
              onRatingFilterChange={handleRatingChange}
              inStockOnly={inStockOnly}
              onInStockOnlyChange={handleInStockChange}
              onReset={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              isDrawerOpen={drawerOpen}
              onCloseDrawer={() => setDrawerOpen(false)}
            />

            {/* Right Package Results Area */}
            <main id="explore-results" style={{ minWidth: 0 }}>
              {loading ? (
                <PackageSkeletonGrid count={6} />
              ) : errorMsg ? (
                <ErrorMessage
                  title="Unable to load journeys"
                  message="Please try again."
                  onRetry={fetchCatalog}
                />
              ) : filteredPackages.length === 0 ? (
                <EmptyState
                  icon={Compass}
                  title="No journeys found"
                  description="Try adjusting your search criteria or clearing filters to see available travel packages."
                  actionText="Reset All Filters"
                  onAction={handleResetFilters}
                />
              ) : (
                <div className="grid-3">
                  {filteredPackages.map((pkg) => (
                    <TravelPackageCard
                      key={pkg.id}
                      pkg={pkg}
                      destinationName={destinationMap[pkg.destinationId] || pkg.destinationName || ''}
                      ratingData={ratingsMap[pkg.id] || null}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Packages
