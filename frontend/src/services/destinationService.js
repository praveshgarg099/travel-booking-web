import api from './api'

export const destinationService = {
  // Get all destinations
  getAllDestinations: async () => {
    const response = await api.get('/api/destinations')
    return response.data
  },

  // Get destination by ID
  getDestinationById: async (id) => {
    const response = await api.get(`/api/destinations/${id}`)
    return response.data
  },

  // Admin: Create destination
  createDestination: async (destinationData) => {
    const response = await api.post('/api/destinations', destinationData)
    return response.data
  },

  // Admin: Update destination
  updateDestination: async (id, destinationData) => {
    const response = await api.put(`/api/destinations/${id}`, destinationData)
    return response.data
  },

  // Admin: Delete destination
  deleteDestination: async (id) => {
    const response = await api.delete(`/api/destinations/${id}`)
    return response.data
  },
}

export default destinationService
