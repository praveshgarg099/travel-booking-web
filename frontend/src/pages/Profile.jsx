import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authService } from '../services/authService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { User, Mail, Shield, Save, CheckCircle2 } from 'lucide-react'

export const Profile = () => {
  const { user, updateProfile } = useAuth()
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        const profile = await authService.getUserById(user.id)
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
        })
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        // Fallback to context user
        setFormData({
          name: user.name || '',
          email: user.email || '',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Name and email cannot be empty.')
      return
    }

    try {
      setSaving(true)
      const updated = await authService.updateUser(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
      })

      updateProfile(updated)
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Profile update failed:', err)
      setErrorMsg(err.message || 'Failed to update profile.')
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading your profile details..." fullPage />
  }

  return (
    <div className="card" style={{ maxWidth: '640px', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
        >
          {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--slate-900)' }}>Account Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span className="badge badge-primary">
              <Shield size={12} /> {user?.role || 'USER'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              User ID: #{user?.id}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--rose-light)',
            color: 'var(--rose)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="profileName">
            Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="profileName"
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={saving}
              required
            />
            <User
              size={18}
              color="var(--slate-400)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="profileEmail">
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="profileEmail"
              type="email"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={saving}
              required
            />
            <Mail
              size={18}
              color="var(--slate-400)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile
