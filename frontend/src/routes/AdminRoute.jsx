import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', padding: '2.5rem' }}>
          <div style={{ color: 'var(--rose)', marginBottom: '1.25rem' }}>
            <ShieldAlert size={56} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            You don't have permission to perform this action. This area is reserved for administrators only.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute
