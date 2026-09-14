import React from 'react'
import Modal from '../common/Modal'
import PaymentStatusBadge from '../payments/PaymentStatusBadge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { User, CreditCard, Map, FileText, Calendar } from 'lucide-react'

const PaymentDetailModal = ({ isOpen, onClose, payment }) => {
  if (!payment) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details" maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Payment Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <CreditCard size={18} /> Payment Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment ID</p>
              <p style={{ fontWeight: '500' }}>#{payment.paymentId}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Amount</p>
              <p style={{ fontWeight: '600', color: '#059669' }}>{formatCurrency(payment.amount)}</p>
            </div>
            {payment.razorpayOrderId && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Razorpay Order ID</p>
                <p style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.8rem' }}>{payment.razorpayOrderId}</p>
              </div>
            )}
            {payment.razorpayPaymentId && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Razorpay Payment ID</p>
                <p style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.8rem' }}>{payment.razorpayPaymentId}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment Method</p>
              <p style={{ fontWeight: '500' }}>{payment.paymentMethod}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Status</p>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment Date</p>
              <p style={{ fontWeight: '500' }}>{payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Customer Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <User size={18} /> Customer Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Customer Name</p>
              <p style={{ fontWeight: '500' }}>{payment.customerName}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Customer Email</p>
              <p style={{ fontWeight: '500' }}>{payment.customerEmail}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>User ID</p>
              <p style={{ fontWeight: '500' }}>#{payment.userId}</p>
            </div>
          </div>
        </section>

        {/* Booking Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <FileText size={18} /> Booking Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Booking ID</p>
              <p style={{ fontWeight: '500' }}>#{payment.bookingId}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Booking Date</p>
              <p style={{ fontWeight: '500' }}>{payment.bookingDate ? formatDate(payment.bookingDate) : 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Number of People</p>
              <p style={{ fontWeight: '500' }}>{payment.numberOfPeople}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Booking Amount</p>
              <p style={{ fontWeight: '500' }}>{formatCurrency(payment.totalBookingAmount)}</p>
            </div>
          </div>
        </section>

        {/* Travel Info */}
        <section>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            <Map size={18} /> Travel Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Travel Package</p>
              <p style={{ fontWeight: '500' }}>{payment.travelPackageName}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Destination</p>
              <p style={{ fontWeight: '500' }}>{payment.destinationName || 'Not specified'}</p>
            </div>
          </div>
        </section>

      </div>
    </Modal>
  )
}

export default PaymentDetailModal
