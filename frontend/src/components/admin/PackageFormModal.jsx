import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { packageService } from '../../services/packageService'
import { destinationService } from '../../services/destinationService'
import { useToast } from '../../context/ToastContext'

export const PackageFormModal = ({
  isOpen,
  onClose,
  packageData = null, // null for create, object for edit
  onSaved,
}) => {
  const toast = useToast()
  const isEditing = Boolean(packageData && packageData.id)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    availableSeats: '',
    destinationId: '',
  })

  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Load available destinations for dropdown
  useEffect(() => {
    if (isOpen) {
      destinationService
        .getAllDestinations()
        .then((data) => setDestinations(data))
        .catch((err) => console.error('Error fetching destinations:', err))
    }
  }, [isOpen])

  // Populate data when editing
  useEffect(() => {
    if (packageData) {
      setFormData({
        title: packageData.title || '',
        description: packageData.description || '',
        price: packageData.price || '',
        duration: packageData.duration || '',
        availableSeats: packageData.availableSeats !== undefined ? packageData.availableSeats : '',
        destinationId: packageData.destinationId || '',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        duration: '',
        availableSeats: '',
        destinationId: '',
      })
    }
    setErrorMsg('')
  }, [packageData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.destinationId) {
      setErrorMsg('Please select a destination.')
      return
    }

    try {
      setLoading(true)
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration, 10),
        availableSeats: parseInt(formData.availableSeats, 10),
        destinationId: parseInt(formData.destinationId, 10),
      }

      let res
      if (isEditing) {
        res = await packageService.updatePackage(packageData.id, payload)
        toast.success('Travel package updated successfully!')
      } else {
        res = await packageService.createPackage(payload)
        toast.success('New travel package published!')
      }

      onSaved(res)
      onClose()
    } catch (err) {
      console.error('Error saving package:', err)
      setErrorMsg(err.message || 'Failed to save travel package.')
      toast.error(err.message || 'Failed to save travel package.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Travel Package' : 'Create Travel Package'}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--rose-light)',
              color: 'var(--rose)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Package Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="form-control"
            placeholder="e.g. 7-Day Swiss Alps & Scenic Glaciers"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="destinationId">
            Destination *
          </label>
          <select
            id="destinationId"
            name="destinationId"
            className="form-control"
            value={formData.destinationId}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">-- Choose Destination --</option>
            {destinations.map((dest, idx) => {
              const dId = dest.id || idx + 1
              return (
                <option key={dId} value={dId}>
                  {dest.name} {dest.country ? `(${dest.country})` : ''}
                </option>
              )
            })}
          </select>
          {destinations.length === 0 && (
            <span className="form-hint" style={{ color: 'var(--amber)' }}>
              No destinations found. Please create a destination first in "Manage Destinations".
            </span>
          )}
        </div>

        <div className="grid-3" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="price">
              Price (USD) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 1499"
              className="form-control"
              value={formData.price}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="duration">
              Duration (Days) *
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="1"
              placeholder="e.g. 7"
              className="form-control"
              value={formData.duration}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="availableSeats">
              Available Seats *
            </label>
            <input
              id="availableSeats"
              name="availableSeats"
              type="number"
              min="0"
              placeholder="e.g. 20"
              className="form-control"
              value={formData.availableSeats}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Description & Highlights *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="form-control"
            placeholder="Describe the journey, hotels, activities, and inclusions..."
            value={formData.description}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default PackageFormModal
