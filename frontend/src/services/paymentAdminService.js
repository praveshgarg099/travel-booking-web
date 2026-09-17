import api from './api'

export const paymentAdminService = {
  getAllPayments: async () => {
    const response = await api.get('/api/admin/payments')
    return response.data
  },
  
  getPaymentById: async (id) => {
    const response = await api.get(`/api/admin/payments/${id}`)
    return response.data
  },

  issueRefund: async (id, payload) => {
    const response = await api.post(`/api/admin/payments/${id}/refund`, payload)
    return response.data
  },

  confirmPayment: async (id) => {
    const response = await api.post(`/api/admin/payments/${id}/confirm`)
    return response.data
  }
}
