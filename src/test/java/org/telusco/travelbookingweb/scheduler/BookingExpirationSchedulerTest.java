package org.telusco.travelbookingweb.scheduler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingExpirationSchedulerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private TravelPackageRepository travelPackageRepository;

    @InjectMocks
    private BookingExpirationScheduler scheduler;

    private Booking expiredBooking;
    private TravelPackage travelPackage;
    private Payment pendingPayment;

    @BeforeEach
    void setUp() {
        travelPackage = new TravelPackage();
        travelPackage.setId(10L);
        travelPackage.setAvailableSeats(5);

        expiredBooking = new Booking();
        expiredBooking.setId(101L);
        expiredBooking.setNumberOfPeople(3);
        expiredBooking.setStatus(BookingStatus.PENDING_PAYMENT);
        expiredBooking.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        expiredBooking.setTravelPackage(travelPackage);

        pendingPayment = new Payment();
        pendingPayment.setId(201L);
        pendingPayment.setStatus(PaymentStatus.PENDING);
        pendingPayment.setBooking(expiredBooking);
    }

    @Test
    @DisplayName("Scheduler cancels expired booking, releases seats exactly once, and marks pending payments failed")
    void testExpireAbandonedBookings() {
        when(bookingRepository.findByStatusAndExpiresAtBefore(eq(BookingStatus.PENDING_PAYMENT), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredBooking));
        when(paymentRepository.existsByBookingIdAndStatus(101L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(travelPackageRepository.findByIdWithLock(10L)).thenReturn(Optional.of(travelPackage));
        when(paymentRepository.findAllByBookingId(101L)).thenReturn(List.of(pendingPayment));

        scheduler.expireAbandonedBookings();

        // Booking marked CANCELLED
        assertEquals(BookingStatus.CANCELLED, expiredBooking.getStatus());
        verify(bookingRepository, times(1)).save(expiredBooking);

        // Package seats restored: 5 + 3 = 8
        assertEquals(8, travelPackage.getAvailableSeats());
        verify(travelPackageRepository, times(1)).save(travelPackage);

        // Pending payment marked FAILED
        assertEquals(PaymentStatus.FAILED, pendingPayment.getStatus());
        verify(paymentRepository, times(1)).save(pendingPayment);
    }

    @Test
    @DisplayName("Scheduler repairs booking to CONFIRMED if a SUCCESS payment exists, without releasing seats")
    void testExpireAbandonedBookingsWithSuccessPaymentRepairsToConfirmed() {
        when(bookingRepository.findByStatusAndExpiresAtBefore(eq(BookingStatus.PENDING_PAYMENT), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredBooking));
        when(paymentRepository.existsByBookingIdAndStatus(101L, PaymentStatus.SUCCESS)).thenReturn(true);

        scheduler.expireAbandonedBookings();

        // Booking repaired to CONFIRMED
        assertEquals(BookingStatus.CONFIRMED, expiredBooking.getStatus());
        verify(bookingRepository, times(1)).save(expiredBooking);

        // Package seats must NOT be released
        assertEquals(5, travelPackage.getAvailableSeats());
        verify(travelPackageRepository, never()).save(any(TravelPackage.class));
    }
}
