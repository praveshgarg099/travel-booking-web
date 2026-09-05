import api from './api'

export const paymentService = {
  // Get all payments for current user
  getAllPayments: async () => {
    const response = await api.get('/api/payments')
    return response.data
  },

  // Get single payment by ID
  getPaymentById: async (id) => {
    const response = await api.get(`/api/payments/${id}`)
    return response.data
  },

  // Create payment (backend calculates amount from booking)
  // Payload: { paymentMethod: 'UPI' | 'CARD' | 'CASH' | 'NET_BANKING', bookingId }
  createPayment: async (paymentData) => {
    const response = await api.post('/api/payments', paymentData)
    return response.data
  },

  // Delete payment
  deletePayment: async (id) => {
    const response = await api.delete(`/api/payments/${id}`)
    return response.data
  },
}

export default paymentService
