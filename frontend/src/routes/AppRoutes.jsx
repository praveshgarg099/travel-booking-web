import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'

// Public Pages
import Home from '../pages/Home'
import Packages from '../pages/Packages'
import PackageDetails from '../pages/PackageDetails'
import About from '../pages/About'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerifyEmail from '../pages/VerifyEmail'

// Authenticated Pages
import Dashboard from '../pages/Dashboard'
import Profile from '../pages/Profile'
import MyBookings from '../pages/MyBookings'
import BookingDetails from '../pages/BookingDetails'
import Payment from '../pages/Payment'
import MyPayments from '../pages/MyPayments'
import MyReviews from '../pages/MyReviews'

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import ManagePackages from '../pages/admin/ManagePackages'
import { ManageDestinations } from '../pages/admin/ManageDestinations'
import { ManageUsers } from '../pages/admin/ManageUsers'
import { ManagePayments } from '../pages/admin/ManagePayments'
import { ManageBookings } from '../pages/admin/ManageBookings'
import { ManageReviews } from '../pages/admin/ManageReviews'

import { Compass } from 'lucide-react'

const NotFound = () => (
  <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
    <div
      style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-light)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
      }}
    >
      <Compass size={36} />
    </div>
    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--slate-900)' }}>404 - Page Not Found</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '440px', margin: '0 auto 2rem' }}>
      The page or destination you are searching for does not exist or has moved.
    </p>
    <Link to="/" className="btn btn-primary btn-lg">
      Return to Home
    </Link>
  </div>
)

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/explore" element={<Packages />} />
        <Route path="/destinations" element={<Navigate to="/#destinations" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/packages/:id" element={<PackageDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Authenticated Checkout page */}
        <Route
          path="/checkout/:bookingId"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Authenticated Dashboard Pages in DashboardLayout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/dashboard/bookings" element={<MyBookings />} />
        <Route path="/bookings/:id" element={<BookingDetails />} />
        <Route path="/dashboard/bookings/:id" element={<BookingDetails />} />
        <Route path="/payments" element={<MyPayments />} />
        <Route path="/dashboard/payments" element={<MyPayments />} />
        <Route path="/reviews" element={<MyReviews />} />
        <Route path="/dashboard/reviews" element={<MyReviews />} />
      </Route>

      {/* Admin Pages in AdminLayout */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/packages" element={<ManagePackages />} />
        <Route path="/admin/destinations" element={<ManageDestinations />} />
        <Route path="/admin/bookings" element={<ManageBookings />} />
        <Route path="/admin/payments" element={<ManagePayments />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/reviews" element={<ManageReviews />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
