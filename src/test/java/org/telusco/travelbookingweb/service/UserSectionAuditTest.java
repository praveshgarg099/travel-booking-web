package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telusco.travelbookingweb.dto.BookingDto;
import org.telusco.travelbookingweb.dto.ReviewDTO;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.ForbiddenException;
import org.telusco.travelbookingweb.exception.InvalidPaymentStateException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;
import org.telusco.travelbookingweb.repository.ReviewRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSectionAuditTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TravelPackageRepository travelPackageRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private BookingService bookingService;

    @InjectMocks
    private ReviewService reviewService;

    private User testUser;
    private User adminUser;
    private TravelPackage testPackage;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setName("Verified Traveler");
        testUser.setEmail("traveler@test.com");
        testUser.setRole(Role.USER);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setName("Admin User");
        adminUser.setEmail("admin@test.com");
        adminUser.setRole(Role.ADMIN);

        testPackage = new TravelPackage();
        testPackage.setId(100L);
        testPackage.setTitle("Himalayan Trek");
        testPackage.setPrice(25000.0);
        testPackage.setAvailableSeats(10);

        testBooking = new Booking();
        testBooking.setId(500L);
        testBooking.setUser(testUser);
        testBooking.setTravelPackage(testPackage);
        testBooking.setBookingDate(LocalDate.now().plusDays(10));
        testBooking.setNumberOfPeople(2);
        testBooking.setTotalAmount(50000.0);
        testBooking.setStatus(BookingStatus.PENDING_PAYMENT);
    }

    @Test
    @DisplayName("P0: Updating unpaid booking must preserve PENDING_PAYMENT status and not auto-confirm")
    void testUpdateBookingPreservesPendingStatus() {
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(paymentRepository.findByBookingId(500L)).thenReturn(null);
        when(travelPackageRepository.findById(100L)).thenReturn(Optional.of(testPackage));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        BookingDto updateRequest = new BookingDto();
        updateRequest.setBookingDate(LocalDate.now().plusDays(15));
        updateRequest.setNumberOfPeople(3);
        updateRequest.setTravelPackageId(100L);

        BookingDto result = bookingService.UpdateById(500L, updateRequest);

        assertNotNull(result);
        assertEquals(BookingStatus.PENDING_PAYMENT, result.getStatus(),
                "Unpaid booking update must retain PENDING_PAYMENT status");
        assertEquals(75000.0, result.getTotalAmount(), "Total must be calculated authoritatively");
        assertEquals(3, result.getNumberOfPeople());
    }

    @Test
    @DisplayName("A: Regular user cannot cancel confirmed booking")
    void testRegularUserCannotCancelConfirmedBooking() {
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findByIdWithLock(500L)).thenReturn(Optional.empty());
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(true);

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> bookingService.cancelBooking(500L));
        assertTrue(ex.getMessage().contains("Only administrators can cancel or void confirmed reservations"));
    }

    @Test
    @DisplayName("B: Regular user cannot permanently delete confirmed booking")
    void testRegularUserCannotPermanentlyDeleteConfirmedBooking() {
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(false);

        InvalidPaymentStateException ex = assertThrows(InvalidPaymentStateException.class,
                () -> bookingService.DeleteBooking(500L));
        assertTrue(ex.getMessage().contains("Cannot permanently delete a confirmed or paid booking"));
    }

    @Test
    @DisplayName("C: Admin can cancel confirmed booking, restore seats, preserve SUCCESS payment and fail PENDING payments")
    void testAdminCanCancelConfirmedBooking() {
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testPackage.setAvailableSeats(10);
        int initialSeats = testPackage.getAvailableSeats();

        Payment successPayment = new Payment();
        successPayment.setId(101L);
        successPayment.setStatus(PaymentStatus.SUCCESS);
        successPayment.setAmount(50000.0);
        successPayment.setRazorpayPaymentId("pay_123");

        Payment pendingPayment = new Payment();
        pendingPayment.setId(102L);
        pendingPayment.setStatus(PaymentStatus.PENDING);
        pendingPayment.setAmount(50000.0);

        when(bookingRepository.findByIdWithLock(500L)).thenReturn(Optional.empty());
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(true);
        when(travelPackageRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testPackage));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepository.findAllByBookingId(500L)).thenReturn(List.of(successPayment, pendingPayment));

        BookingDto result = bookingService.cancelBooking(500L);

        assertNotNull(result);
        assertEquals(BookingStatus.CANCELLED, result.getStatus(), "Status must become CANCELLED");
        assertEquals(initialSeats + 2, testPackage.getAvailableSeats(), "Seats must increase by guest count");
        verify(travelPackageRepository, times(1)).save(testPackage);

        // SUCCESS payment is strictly preserved
        assertEquals(PaymentStatus.SUCCESS, successPayment.getStatus(), "SUCCESS payment must remain SUCCESS");
        verify(paymentRepository, never()).delete(successPayment);

        // PENDING payment transitions to FAILED
        assertEquals(PaymentStatus.FAILED, pendingPayment.getStatus(), "PENDING payment must become FAILED");
        verify(paymentRepository, times(1)).save(pendingPayment);
    }

    @Test
    @DisplayName("D: Admin can cancel a paid booking while strictly preserving financial audit records")
    void testAdminCanCancelPaidBooking() {
        testBooking.setStatus(BookingStatus.CONFIRMED);
        Payment successPayment = new Payment();
        successPayment.setId(201L);
        successPayment.setStatus(PaymentStatus.SUCCESS);
        successPayment.setAmount(50000.0);
        successPayment.setRazorpayPaymentId("pay_success_audit");

        when(bookingRepository.findByIdWithLock(500L)).thenReturn(Optional.empty());
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(true);
        when(travelPackageRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testPackage));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepository.findAllByBookingId(500L)).thenReturn(List.of(successPayment));

        BookingDto result = bookingService.cancelBooking(500L);

        assertEquals(BookingStatus.CANCELLED, result.getStatus());
        assertEquals("pay_success_audit", successPayment.getRazorpayPaymentId());
        assertEquals(PaymentStatus.SUCCESS, successPayment.getStatus());
        verify(paymentRepository, never()).delete(any(Payment.class));
    }

    @Test
    @DisplayName("E: Double cancellation is rejected and seats are not restored again")
    void testDoubleCancellationIsRejected() {
        testBooking.setStatus(BookingStatus.CANCELLED);
        testPackage.setAvailableSeats(12);

        when(bookingRepository.findByIdWithLock(500L)).thenReturn(Optional.empty());
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(adminUser);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> bookingService.cancelBooking(500L));
        assertTrue(ex.getMessage().contains("Booking is already cancelled"));
        assertEquals(12, testPackage.getAvailableSeats(), "Seats must NOT be restored again");
        verify(travelPackageRepository, never()).save(any());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("F: Admin cannot permanently delete confirmed or paid booking")
    void testAdminCannotPermanentlyDeleteConfirmedOrPaidBooking() {
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(true);

        InvalidPaymentStateException ex = assertThrows(InvalidPaymentStateException.class,
                () -> bookingService.DeleteBooking(500L));
        assertTrue(ex.getMessage().contains("Cannot permanently delete a confirmed or paid booking"));
        verify(bookingRepository, never()).deleteById(anyLong());
        verify(paymentRepository, never()).delete(any(Payment.class));
    }

    @Test
    @DisplayName("G: Eligible unpaid booking can be permanently deleted")
    void testEligibleUnpaidBookingCanBePermanentlyDeleted() {
        testBooking.setStatus(BookingStatus.PENDING_PAYMENT);
        testPackage.setAvailableSeats(10);

        Payment failedPayment = new Payment();
        failedPayment.setId(301L);
        failedPayment.setStatus(PaymentStatus.FAILED);

        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.findAllByBookingId(500L)).thenReturn(List.of(failedPayment));

        bookingService.DeleteBooking(500L);

        assertEquals(12, testPackage.getAvailableSeats(), "Reserved seats restored exactly once upon deletion");
        verify(travelPackageRepository, times(1)).save(testPackage);
        verify(paymentRepository, times(1)).deleteAll(List.of(failedPayment));
        verify(paymentRepository, times(1)).flush();
        verify(bookingRepository, times(1)).deleteById(500L);
    }

    @Test
    @DisplayName("H: Successful payment can never be deleted through booking deletion")
    void testSuccessfulPaymentCanNeverBeDeleted() {
        testBooking.setStatus(BookingStatus.PENDING_PAYMENT);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(true);

        assertThrows(InvalidPaymentStateException.class,
                () -> bookingService.DeleteBooking(500L));

        verify(paymentRepository, never()).delete(any());
        verify(paymentRepository, never()).deleteAll(any());
        verify(bookingRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("P1: Review creation rejects unverified traveler without confirmed booking")
    void testReviewRejectsUnverifiedTraveler() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(travelPackageRepository.findById(100L)).thenReturn(Optional.of(testPackage));
        when(reviewRepository.existsByUserIdAndTravelPackageId(10L, 100L)).thenReturn(false);
        when(bookingRepository.existsByUserIdAndTravelPackageIdAndStatus(10L, 100L, BookingStatus.CONFIRMED))
                .thenReturn(false);

        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setTravelPackageId(100L);
        reviewDTO.setRating(5);
        reviewDTO.setComment("Great package!");

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> reviewService.createReview(reviewDTO));

        assertTrue(ex.getMessage().contains("Only verified travelers"));
    }

    @Test
    @DisplayName("P1: Review creation succeeds for verified traveler with confirmed booking")
    void testReviewSucceedsForVerifiedTraveler() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(travelPackageRepository.findById(100L)).thenReturn(Optional.of(testPackage));
        when(reviewRepository.existsByUserIdAndTravelPackageId(10L, 100L)).thenReturn(false);
        when(bookingRepository.existsByUserIdAndTravelPackageIdAndStatus(10L, 100L, BookingStatus.CONFIRMED))
                .thenReturn(true);
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });

        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setTravelPackageId(100L);
        reviewDTO.setRating(5);
        reviewDTO.setComment("Incredible trek, perfectly organized!");

        ReviewDTO result = reviewService.createReview(reviewDTO);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        assertEquals("Incredible trek, perfectly organized!", result.getComment());
        assertEquals("Himalayan Trek", result.getPackageTitle());
        assertEquals("Verified Traveler", result.getCustomerName());
    }

    @Test
    @DisplayName("P1: Fetch reviews by package and by user")
    void testFetchReviewsQueries() {
        Review r = new Review();
        r.setId(1L);
        r.setRating(5);
        r.setComment("Loved it");
        r.setUser(testUser);
        r.setTravelPackage(testPackage);

        when(reviewRepository.findByTravelPackageId(100L)).thenReturn(List.of(r));
        List<ReviewDTO> pkgReviews = reviewService.getReviewsByPackage(100L);
        assertEquals(1, pkgReviews.size());
        assertEquals("Himalayan Trek", pkgReviews.get(0).getPackageTitle());

        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(reviewRepository.findByUserId(10L)).thenReturn(List.of(r));
        List<ReviewDTO> myReviews = reviewService.getMyReviews();
        assertEquals(1, myReviews.size());
        assertEquals("Verified Traveler", myReviews.get(0).getCustomerName());
    }
}
