import React from 'react'

export const BookingStatusBadge = ({ status }) => {
  let badgeClass = 'badge-neutral'

  switch (status) {
    case 'CONFIRMED':
      badgeClass = 'badge-success'
      break
    case 'PENDING':
      badgeClass = 'badge-warning'
      break
    case 'CANCELLED':
      badgeClass = 'badge-danger'
      break
    default:
      badgeClass = 'badge-neutral'
  }

  return <span className={`badge ${badgeClass}`}>{status || 'UNKNOWN'}</span>
}

export default BookingStatusBadge
