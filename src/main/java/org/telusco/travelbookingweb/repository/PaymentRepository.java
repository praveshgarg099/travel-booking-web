package org.telusco.travelbookingweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.telusco.travelbookingweb.entity.Payment;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment,Long> {
    List<Payment> findByBookingUserId(Long userId);

    boolean existsByBookingId(Long bookingId);

    Payment findByBookingId(Long bookingId);
}
