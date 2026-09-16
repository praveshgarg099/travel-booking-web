import React from 'react'
import { RotateCcw } from 'lucide-react'

export const PaymentStatusBadge = ({ status }) => {
  let badgeClass = 'badge-neutral'
  let customStyle = {}

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
    case 'REFUNDED':
      badgeClass = 'badge-purple'
      customStyle = { backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }
      break
    case 'PARTIALLY_REFUNDED':
      badgeClass = 'badge-purple'
      customStyle = { backgroundColor: '#fae8ff', color: '#a21caf', border: '1px solid #f0abfc' }
      break
    default:
      badgeClass = 'badge-neutral'
  }

  return (
    <span className={`badge ${badgeClass}`} style={customStyle}>
      {(status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') && (
        <RotateCcw size={12} style={{ marginRight: '3px', display: 'inline', verticalAlign: '-1px' }} />
      )}
      {status || 'PENDING'}
    </span>
  )
}

export default PaymentStatusBadge
