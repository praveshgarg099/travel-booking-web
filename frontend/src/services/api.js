import axios from 'axios'

// Base URL: in dev, defaults to '' which uses the Vite proxy (/api -> http://localhost:8080)
// or uses VITE_API_BASE_URL if explicitly provided
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Friendly Error Message Mapping
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    let status = error.response ? error.response.status : null
    let serverMessage = error.response?.data?.message || ''
    let userMessage = ''

    switch (status) {
      case 400:
        userMessage = serverMessage || 'Please check your information.'
        break
      case 401:
        userMessage = serverMessage || 'Please login to continue.'
        // Clear local storage and notify auth state on token expiry/unauthorized
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth:logout'))
        break
      case 403:
        userMessage = serverMessage || "You don't have permission to perform this action."
        break
      case 404:
        userMessage = serverMessage || 'The requested resource was not found.'
        break
      case 409:
        userMessage = serverMessage || 'This item cannot be modified or deleted because it is referenced by existing bookings or reviews.'
        break
      case 500:
        userMessage = serverMessage || 'Something went wrong. Please try again.'
        break
      default:
        userMessage = serverMessage || error.message || 'A network error occurred. Please try again.'
    }

    return Promise.reject({
      status,
      message: userMessage,
      raw: error,
    })
  }
)

export default api
