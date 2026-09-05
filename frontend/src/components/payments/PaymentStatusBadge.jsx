import React from 'react'

export const PaymentStatusBadge = ({ status }) => {
  let badgeClass = 'badge-neutral'

  switch (status) {
    case 'SUCCESS':
      badgeClass = 'badge-success'
      break
    case 'PENDING':
      badgeClass = 'badge-warning'
      break
    case 'FAILED':
      badgeClass = 'badge-danger'
      break
    default:
      badgeClass = 'badge-neutral'
  }

  return <span className={`badge ${badgeClass}`}>{status || 'PENDING'}</span>
}

export default PaymentStatusBadge
