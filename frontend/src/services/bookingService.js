import api from './api'

export const bookingService = {
  // Get all bookings (user gets own bookings, admin gets all)
  getAllBookings: async () => {
    const response = await api.get('/api/bookings')
    return response.data
  },

  // Get single booking by ID
  getBookingById: async (id) => {
    const response = await api.get(`/api/bookings/${id}`)
    return response.data
  },

  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/api/bookings', bookingData)
    return response.data
  },

  // Update booking
  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/api/bookings/${id}`, bookingData)
    return response.data
  },

  // Delete / cancel booking
  deleteBooking: async (id) => {
    const response = await api.delete(`/api/bookings/${id}`)
    return response.data
  },
}

export default bookingService
