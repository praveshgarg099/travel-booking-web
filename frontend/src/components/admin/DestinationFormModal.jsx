import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { destinationService } from '../../services/destinationService'
import { useToast } from '../../context/ToastContext'

export const DestinationFormModal = ({
  isOpen,
  onClose,
  destinationData = null,
  onSaved,
}) => {
  const toast = useToast()
  const isEditing = Boolean(destinationData && destinationData.id)

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (destinationData) {
      setFormData({
        name: destinationData.name || '',
        country: destinationData.country || '',
        description: destinationData.description || '',
      })
    } else {
      setFormData({
        name: '',
        country: '',
        description: '',
      })
    }
    setErrorMsg('')
  }, [destinationData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    try {
      setLoading(true)
      const payload = {
        name: formData.name.trim(),
        country: formData.country.trim(),
        description: formData.description.trim(),
      }

      let res
      if (isEditing) {
        res = await destinationService.updateDestination(destinationData.id, payload)
        toast.success('Destination updated!')
      } else {
        res = await destinationService.createDestination(payload)
        toast.success('New destination added!')
      }

      onSaved(res)
      onClose()
    } catch (err) {
      console.error('Error saving destination:', err)
      setErrorMsg(err.message || 'Failed to save destination.')
      toast.error(err.message || 'Failed to save destination.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Destination' : 'Add Destination'}
      maxWidth="520px"
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
          <label className="form-label" htmlFor="destName">
            Destination Name *
          </label>
          <input
            id="destName"
            name="name"
            type="text"
            className="form-control"
            placeholder="e.g. Paris, Swiss Alps, Bali"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="destCountry">
            Country *
          </label>
          <input
            id="destCountry"
            name="country"
            type="text"
            className="form-control"
            placeholder="e.g. France, Switzerland, Indonesia"
            value={formData.country}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="destDesc">
            Description *
          </label>
          <textarea
            id="destDesc"
            name="description"
            rows={3}
            className="form-control"
            placeholder="Key highlights, climate, best travel season..."
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
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Destination'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default DestinationFormModal
