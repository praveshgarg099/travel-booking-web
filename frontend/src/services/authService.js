import api from './api'

export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/users/login', credentials)
    return response.data // returns { id, name, email, token }
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/users', userData)
    return response.data // returns { id, name, email }
  },

  // Get user profile by ID
  getUserById: async (id) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },

  // Update user profile
  updateUser: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData)
    return response.data
  },

  // Admin: Get all users
  getAllUsers: async () => {
    const response = await api.get('/api/users')
    return response.data
  },

  // Admin: Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/api/users/${id}`)
    return response.data
  },

  // Verify Email with OTP
  verifyEmail: async (data) => {
    const response = await api.post('/api/users/verify-email', data)
    return response.data
  },

  // Resend OTP code
  resendVerification: async (email) => {
    const response = await api.post(`/api/users/resend-verification?email=${encodeURIComponent(email)}`)
    return response.data
  },

  // Google OAuth Sign-In
  googleLogin: async (idToken) => {
    const response = await api.post('/api/users/google-login', { idToken })
    return response.data
  },
}

export default authService
