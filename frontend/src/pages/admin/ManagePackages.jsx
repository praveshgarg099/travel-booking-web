import React, { useState, useEffect } from 'react'
import { packageService } from '../../services/packageService'
import { destinationService } from '../../services/destinationService'
import { formatCurrency } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'
import PackageFormModal from '../../components/admin/PackageFormModal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react'

export const ManagePackages = () => {
  const toast = useToast()
  const [packages, setPackages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const [pkgs, dests] = await Promise.all([
        packageService.getAllPackages(),
        destinationService.getAllDestinations(),
      ])
      setPackages(pkgs || [])
      setDestinations(dests || [])
    } catch (err) {
      console.error('Error fetching admin packages:', err)
      setErrorMsg(err.message || 'Failed to fetch packages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const destinationMap = destinations.reduce((acc, d, idx) => {
    const id = d.id || idx + 1
    acc[id] = d.name
    return acc
  }, {})

  const handleOpenCreate = () => {
    setEditingPackage(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (pkg) => {
    setEditingPackage(pkg)
    setIsModalOpen(true)
  }

  const handlePackageSaved = (savedPkg) => {
    fetchData()
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      setDeleteLoading(true)
      await packageService.deletePackage(deleteTargetId)
      toast.success('Travel package deleted.')
      setPackages((prev) => prev.filter((p) => p.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Delete package error:', err)
      toast.error(err.message || 'Could not delete travel package.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredPackages = packages.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      destinationMap[p.destinationId]?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return <LoadingSpinner message="Loading travel packages..." fullPage />
  }

  if (errorMsg) {
    return <ErrorMessage message={errorMsg} onRetry={fetchData} />
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>Manage Travel Packages</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            Publish new itineraries, update seat limits, and adjust package pricing.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
          <Plus size={16} />
          Create Package
        </button>
      </div>

      {/* Search filter */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Filter packages by title or destination..."
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={18}
            color="var(--slate-400)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>
      </div>

      {filteredPackages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Packages Found"
          description="No packages match your search, or no packages have been added yet."
          actionText="Create First Package"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Destination</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Available Seats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td style={{ fontWeight: 700 }}>#{pkg.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--slate-900)', maxWidth: '240px' }}>
                      {pkg.title}
                    </td>
                    <td>{destinationMap[pkg.destinationId] || `Dest #${pkg.destinationId}`}</td>
                    <td>{pkg.duration} Days</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                      {formatCurrency(pkg.price)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          pkg.availableSeats <= 0
                            ? 'badge-danger'
                            : pkg.availableSeats <= 5
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {pkg.availableSeats} seats
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEdit(pkg)}
                          className="btn btn-secondary btn-sm"
                          title="Edit package"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(pkg.id)}
                          className="btn btn-danger btn-sm"
                          title="Delete package"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <PackageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageData={editingPackage}
        onSaved={handlePackageSaved}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Travel Package"
        message={`Are you sure you want to delete package #${deleteTargetId}? Note: Packages with existing bookings or reviews cannot be deleted by the server.`}
        confirmText="Confirm Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

export default ManagePackages
