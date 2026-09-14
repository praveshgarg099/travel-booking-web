package org.telusco.travelbookingweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.telusco.travelbookingweb.entity.Payment;

import org.telusco.travelbookingweb.entity.PaymentStatus;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingUserId(Long userId);

    boolean existsByBookingId(Long bookingId);

    Payment findByBookingId(Long bookingId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    Optional<Payment> findFirstByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    List<Payment> findAllByBookingId(Long bookingId);

    Optional<Payment> findTopByBookingIdOrderByIdDesc(Long bookingId);
}
