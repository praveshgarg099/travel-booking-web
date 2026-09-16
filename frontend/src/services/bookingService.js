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

  // Cancel / void booking (administrative or user cancellation preserving audit records)
  cancelBooking: async (id) => {
    const response = await api.patch(`/api/bookings/${id}/cancel`)
    return response.data
  },

  // Delete booking (physical permanent deletion for unfinalized bookings)
  deleteBooking: async (id) => {
    const response = await api.delete(`/api/bookings/${id}`)
    return response.data
  },

  // Download official PDF booking voucher and invoice
  downloadVoucher: async (id) => {
    const response = await api.get(`/api/bookings/${id}/voucher`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Yatramigo-Voucher-BKG${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return true
  },
}

export default bookingService
