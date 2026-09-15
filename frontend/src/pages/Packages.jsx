import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { packageService } from '../services/packageService'
import { destinationService } from '../services/destinationService'
import TravelPackageCard from '../components/packages/TravelPackageCard'
import PackageFilters from '../components/packages/PackageFilters'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import { Compass } from 'lucide-react'

export const Packages = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [packages, setPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Filter & sorting states
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedDestination, setSelectedDestination] = useState('')
  const [priceRange, setPriceRange] = useState(100000)
  const [durationFilter, setDurationFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('featured')

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const [pkgs, dests] = await Promise.all([
        packageService.getAllPackages(),
        destinationService.getAllDestinations(),
      ])
      setPackages(pkgs || [])
      setDestinations(dests || [])

      // Calculate max price from packages if available
      if (pkgs && pkgs.length > 0) {
        const max = Math.max(...pkgs.map((p) => p.price || 0), 100000)
        setPriceRange(max)
      }
    } catch (err) {
      console.error('Failed to load packages:', err)
      setErrorMsg(err.message || 'Could not fetch travel packages from the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  // Map destinationId to name
  const destinationMap = useMemo(() => {
    const map = {}
    destinations.forEach((d) => {
      if (d.id != null) {
        map[d.id] = d.name
      }
    })
    return map
  }, [destinations])

  // Filter and sort packages based on real backend data
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        // Keyword search (title, description, destination name)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = pkg.title?.toLowerCase().includes(q)
          const matchDesc = pkg.description?.toLowerCase().includes(q)
          const destName = destinationMap[pkg.destinationId]?.toLowerCase() || ''
          const matchDest = destName.includes(q)
          if (!matchTitle && !matchDesc && !matchDest) return false
        }

        // Destination filter
        if (selectedDestination) {
          if (Number(pkg.destinationId) !== Number(selectedDestination)) return false
        }

        // Price filter
        if (pkg.price != null && pkg.price > priceRange) {
          return false
        }

        // Duration filter
        if (durationFilter === 'short' && (pkg.duration == null || pkg.duration > 4)) return false
        if (durationFilter === 'medium' && (pkg.duration == null || pkg.duration < 5 || pkg.duration > 7)) return false
        if (durationFilter === 'long' && (pkg.duration == null || pkg.duration < 8)) return false

        // In Stock Only
        if (inStockOnly && (pkg.availableSeats == null || pkg.availableSeats <= 0)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0)
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0)
        if (sortBy === 'duration-asc') return (a.duration || 0) - (b.duration || 0)
        if (sortBy === 'duration-desc') return (b.duration || 0) - (a.duration || 0)
        if (sortBy === 'name-asc') return (a.title || '').localeCompare(b.title || '')
        return 0 // default featured
      })
  }, [packages, searchQuery, selectedDestination, priceRange, durationFilter, inStockOnly, sortBy, destinationMap])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedDestination('')
    const max = packages.length > 0 ? Math.max(...packages.map((p) => p.price || 0), 100000) : 100000
    setPriceRange(max)
    setDurationFilter('')
    setInStockOnly(false)
    setSortBy('featured')
    setSearchParams({})
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh', padding: '3rem 0' }}>
      <div className="container">
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Worldwide Catalog
          </span>
          <h1 style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>Explore Travel Packages</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Choose from our curated collection of verified adventures with live seat reservations.
          </p>
        </div>

        {/* Filter Bar */}
        <PackageFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          destinations={destinations}
          selectedDestination={selectedDestination}
          onDestinationChange={setSelectedDestination}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          maxPriceLimit={packages.length > 0 ? Math.max(...packages.map((p) => p.price || 0), 100000) : 100000}
          durationFilter={durationFilter}
          onDurationFilterChange={setDurationFilter}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={setInStockOnly}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={handleResetFilters}
          totalResults={filteredPackages.length}
        />

        {/* Content Area */}
        {loading ? (
          <LoadingSpinner message="Loading travel packages..." fullPage />
        ) : errorMsg ? (
          <ErrorMessage
            title="Failed to Load Packages"
            message={errorMsg}
            onRetry={fetchPackages}
          />
        ) : filteredPackages.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No Travel Packages Found"
            description="No itineraries match your active search terms or filters. Try adjusting your filters or search keywords."
            actionText="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            <div style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Showing <strong>{filteredPackages.length}</strong> travel package{filteredPackages.length > 1 ? 's' : ''}
            </div>
            <div className="grid-3">
              {filteredPackages.map((pkg) => (
                <TravelPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  destinationName={destinationMap[pkg.destinationId] || ''}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Packages
