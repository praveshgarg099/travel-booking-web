import api from './api'

export const packageService = {
  // Get all travel packages
  getAllPackages: async () => {
    const response = await api.get('/api/travel-packages')
    return response.data
  },

  // Get single package by ID
  getPackageById: async (id) => {
    const response = await api.get(`/api/travel-packages/${id}`)
    return response.data
  },

  // Admin: Create package
  createPackage: async (packageData) => {
    const response = await api.post('/api/travel-packages', packageData)
    return response.data
  },

  // Admin: Update package
  updatePackage: async (id, packageData) => {
    const response = await api.put(`/api/travel-packages/${id}`, packageData)
    return response.data
  },

  // Admin: Delete package
  deletePackage: async (id) => {
    const response = await api.delete(`/api/travel-packages/${id}`)
    return response.data
  },
}

export default packageService
