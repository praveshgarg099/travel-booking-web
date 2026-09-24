import React from 'react'
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'

export const BookingStatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase()

  switch (normalized) {
    case 'CONFIRMED':
      return (
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={13} />
          <span>Confirmed</span>
        </span>
      )
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return (
        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={13} />
          <span>{normalized === 'PENDING_PAYMENT' ? 'Pending Payment' : 'Pending'}</span>
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <XCircle size={13} />
          <span>Cancelled</span>
        </span>
      )
    case 'FAILED':
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <AlertTriangle size={13} />
          <span>Failed</span>
        </span>
      )
    default:
      return (
        <span className="badge badge-neutral">
          {status || 'Unknown'}
        </span>
      )
  }
}

export default BookingStatusBadge
