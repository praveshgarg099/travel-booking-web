import React, { useState, useEffect } from 'react'
import { destinationService } from '../../services/destinationService'
import { useToast } from '../../context/ToastContext'
import DestinationFormModal from '../../components/admin/DestinationFormModal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import { Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react'

export const ManageDestinations = () => {
  const toast = useToast()
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDestination, setEditingDestination] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const data = await destinationService.getAllDestinations()
      setDestinations(data || [])
    } catch (err) {
      console.error('Failed to load destinations:', err)
      setErrorMsg(err.message || 'Could not fetch destinations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDestinations()
  }, [])

  const handleOpenCreate = () => {
    setEditingDestination(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (dest, idx) => {
    setEditingDestination({
      ...dest,
      id: dest.id || idx + 1,
    })
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      setDeleteLoading(true)
      await destinationService.deleteDestination(deleteTargetId)
      toast.success('Destination deleted.')
      setDestinations((prev) => prev.filter((d, idx) => (d.id || idx + 1) !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Delete destination error:', err)
      toast.error(err.message || 'Could not delete destination.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filtered = destinations.filter((d) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return d.name?.toLowerCase().includes(q) || d.country?.toLowerCase().includes(q)
  })

  if (loading) {
    return <LoadingSpinner message="Loading destinations..." fullPage />
  }

  if (errorMsg) {
    return <ErrorMessage message={errorMsg} onRetry={fetchDestinations} />
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
          <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>Manage Destinations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            Maintain country regions and cities linked to travel itineraries.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
          <Plus size={16} />
          Add Destination
        </button>
      </div>

      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search destinations by city or country..."
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No Destinations Found"
          description="Create your first destination to start assigning travel packages."
          actionText="Add Destination"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Destination Name</th>
                  <th>Country</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dest, idx) => {
                  const targetId = dest.id || idx + 1
                  return (
                    <tr key={targetId}>
                      <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{dest.name}</td>
                      <td>
                        <span className="badge badge-primary">{dest.country}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>
                        {dest.description}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEdit(dest, idx)}
                            className="btn btn-secondary btn-sm"
                            title="Edit destination"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(targetId)}
                            className="btn btn-danger btn-sm"
                            title="Delete destination"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Destination Form Modal */}
      <DestinationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        destinationData={editingDestination}
        onSaved={() => fetchDestinations()}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Destination"
        message="Are you sure you want to remove this destination? Ensure no packages are actively linked."
        confirmText="Confirm Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

export default ManageDestinations
