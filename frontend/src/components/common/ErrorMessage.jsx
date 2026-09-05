import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export const ErrorMessage = ({
  message = 'Something went wrong. Please try again.',
  onRetry = null,
  title = 'Unable to Load Data',
}) => {
  return (
    <div
      className="card"
      style={{
        maxWidth: '540px',
        margin: '2rem auto',
        padding: '2rem',
        textAlign: 'center',
        borderLeft: '4px solid var(--rose)',
      }}
    >
      <div style={{ color: 'var(--rose)', marginBottom: '1rem' }}>
        <AlertCircle size={44} style={{ margin: '0 auto' }} />
      </div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: onRetry ? '1.5rem' : '0' }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
