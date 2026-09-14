import api from './api'

export const paymentAdminService = {
  getAllPayments: async () => {
    const response = await api.get('/api/admin/payments')
    return response.data
  },
  
  getPaymentById: async (id) => {
    const response = await api.get(`/api/admin/payments/${id}`)
    return response.data
  }
}
