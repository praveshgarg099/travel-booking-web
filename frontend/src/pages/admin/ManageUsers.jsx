import React, { useState, useEffect } from 'react'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import { Users, Trash2, Shield, Search } from 'lucide-react'

export const ManageUsers = () => {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')

  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const data = await authService.getAllUsers()
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
      setErrorMsg(err.message || 'Could not fetch user accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    if (Number(deleteTargetId) === Number(currentUser?.id)) {
      toast.error('You cannot delete your own active administrator account.')
      setDeleteTargetId(null)
      return
    }

    try {
      setDeleteLoading(true)
      await authService.deleteUser(deleteTargetId)
      toast.success('User account deleted.')
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      console.error('Delete user error:', err)
      toast.error(err.message || 'Failed to delete user account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  if (loading) {
    return <LoadingSpinner message="Loading registered users..." fullPage />
  }

  if (errorMsg) {
    return <ErrorMessage message={errorMsg} onRetry={fetchUsers} />
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', color: 'var(--slate-900)' }}>Manage User Accounts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
          Registered user profiles fetched from Spring Boot database.
        </p>
      </div>

      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={18}
            color="var(--slate-400)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Users Found"
          description="No users match the search criteria."
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = Number(u.id) === Number(currentUser?.id)
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>#{u.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                        {u.name} {isSelf && <span className="badge badge-primary">You</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}`}>
                          <Shield size={12} /> {u.role || 'USER'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setDeleteTargetId(u.id)}
                          disabled={isSelf}
                          className="btn btn-danger btn-sm"
                          title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user #${deleteTargetId}? Any associated bookings and reviews may also be affected.`}
        confirmText="Confirm Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

export default ManageUsers
