import { jwtDecode } from 'jwt-decode'

/**
 * Formats monetary amounts in Indian Rupees (INR) using Indian numbering system
 * (e.g. ₹1,000, ₹10,000, ₹1,00,000, ₹10,00,000).
 */
export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0'
  const num = Number(amount)
  const hasDecimals = num % 1 !== 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(num)
}

/**
 * Global alias for formatINR ensuring all components format currency uniformly
 */
export const formatCurrency = formatINR

/**
 * Format ISO date string into readable text (e.g. "Sep 15, 2026")
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch (e) {
    return dateStr
  }
}

/**
 * Returns today's date in YYYY-MM-DD for HTML date picker min attribute
 */
export const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Safely decodes a JWT token and returns payload
 */
export const decodeToken = (token) => {
  if (!token) return null
  try {
    return jwtDecode(token)
  } catch (err) {
    console.error('Failed to decode JWT:', err)
    return null
  }
}

/**
 * Checks whether token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  // exp is in seconds, Date.now() in ms
  return decoded.exp * 1000 < Date.now()
}
