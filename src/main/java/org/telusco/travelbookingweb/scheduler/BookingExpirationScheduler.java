package org.telusco.travelbookingweb.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingExpirationScheduler.class);

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final TravelPackageRepository travelPackageRepository;

    public BookingExpirationScheduler(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            TravelPackageRepository travelPackageRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.travelPackageRepository = travelPackageRepository;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireAbandonedBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore(
                BookingStatus.PENDING_PAYMENT,
                now
        );

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("Found {} expired PENDING_PAYMENT booking(s) to process", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            try {
                // Critical safety check: Ensure no SUCCESS payment exists
                boolean hasSuccess = paymentRepository.existsByBookingIdAndStatus(
                        booking.getId(),
                        PaymentStatus.SUCCESS
                );

                if (hasSuccess) {
                    log.warn("Booking {} has a SUCCESS payment but status was PENDING_PAYMENT. Repairing to CONFIRMED.", booking.getId());
                    booking.setStatus(BookingStatus.CONFIRMED);
                    bookingRepository.save(booking);
                    continue;
                }

                // Transition booking status to CANCELLED
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);

                // Release reserved seats back to package exactly once
                if (booking.getTravelPackage() != null) {
                    TravelPackage pkg = travelPackageRepository.findByIdWithLock(booking.getTravelPackage().getId())
                            .orElse(booking.getTravelPackage());
                    int updatedSeats = pkg.getAvailableSeats() + booking.getNumberOfPeople();
                    pkg.setAvailableSeats(updatedSeats);
                    travelPackageRepository.save(pkg);
                    log.info("Released {} seats back to package ID {}. New available seats: {}",
                            booking.getNumberOfPeople(), pkg.getId(), updatedSeats);
                }

                // Mark any pending payments as FAILED
                List<Payment> payments = paymentRepository.findAllByBookingId(booking.getId());
                for (Payment payment : payments) {
                    if (payment.getStatus() == PaymentStatus.PENDING) {
                        payment.setStatus(PaymentStatus.FAILED);
                        payment.setUpdatedAt(now);
                        paymentRepository.save(payment);
                    }
                }

                log.info("Successfully cancelled expired booking ID {}", booking.getId());
            } catch (Exception e) {
                log.error("Error expiring booking ID {}: {}", booking.getId(), e.getMessage(), e);
            }
        }
    }
}
