import api from './api'

export const reviewService = {
  // Get all reviews
  getAllReviews: async () => {
    const response = await api.get('/api/reviews')
    return response.data
  },

  // Get review by ID
  getReviewById: async (id) => {
    const response = await api.get(`/api/reviews/${id}`)
    return response.data
  },

  // Get reviews for a specific package
  getReviewsByPackage: async (packageId) => {
    const response = await api.get(`/api/reviews/package/${packageId}`)
    return response.data
  },

  // Get current user's submitted reviews
  getMyReviews: async () => {
    const response = await api.get('/api/reviews/my')
    return response.data
  },

  // Create review
  createReview: async (reviewData) => {
    const response = await api.post('/api/reviews', reviewData)
    return response.data
  },

  // Update review
  updateReview: async (id, reviewData) => {
    const response = await api.put(`/api/reviews/${id}`, reviewData)
    return response.data
  },

  // Delete review
  deleteReview: async (id) => {
    const response = await api.delete(`/api/reviews/${id}`)
    return response.data
  },
}

export default reviewService
