import React from 'react'
import { Loader2 } from 'lucide-react'

export const LoadingSpinner = ({ message = 'Loading...', size = 32, fullPage = false }) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '2rem',
        color: 'var(--slate-600)',
      }}
    >
      <Loader2 size={size} className="animate-spin" color="var(--primary)" />
      {message && <p style={{ fontSize: '0.925rem', fontWeight: 500 }}>{message}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner
