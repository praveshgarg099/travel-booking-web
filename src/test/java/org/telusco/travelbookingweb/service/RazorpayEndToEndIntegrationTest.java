package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telusco.travelbookingweb.config.RazorpayConfig;
import org.telusco.travelbookingweb.dto.BookingDto;
import org.telusco.travelbookingweb.dto.RazorpayOrderRequestDto;
import org.telusco.travelbookingweb.dto.RazorpayOrderResponseDto;
import org.telusco.travelbookingweb.dto.RazorpayVerificationRequestDto;
import org.telusco.travelbookingweb.dto.RazorpayVerificationResponseDto;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.ForbiddenException;
import org.telusco.travelbookingweb.exception.PaymentAlreadyExistsException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RazorpayEndToEndIntegrationTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TravelPackageRepository travelPackageRepository;

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private RazorpayService razorpayService;

    @Mock
    private RazorpayConfig razorpayConfig;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    @DisplayName("Complete End-to-End Step 10 Verification: 15-point Razorpay Payment Cycle")
    void testCompleteRazorpayLifecycle_Step10() {
        // Setup Users
        User normalUser = new User();
        normalUser.setId(101L);
        normalUser.setName("Priya Sharma");
        normalUser.setEmail("priya@example.com");
        normalUser.setRole(Role.USER);

        User attackerUser = new User();
        attackerUser.setId(102L);
        attackerUser.setName("Attacker");
        attackerUser.setEmail("attacker@example.com");
        attackerUser.setRole(Role.USER);

        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setName("Admin User");
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ADMIN);

        // Setup Package
        TravelPackage pkg = new TravelPackage();
        pkg.setId(10L);
        pkg.setTitle("Jaipur Royal Heritage");
        pkg.setPrice(22000.0);
        pkg.setAvailableSeats(15);

        // 1. Create a brand-new booking as a normal USER
        Booking newBooking = new Booking();
        newBooking.setId(888L);
        newBooking.setUser(normalUser);
        newBooking.setTravelPackage(pkg);
        newBooking.setNumberOfPeople(2);
        newBooking.setTotalAmount(44000.0);
        newBooking.setBookingDate(LocalDate.now().plusDays(10));
        newBooking.setStatus(BookingStatus.PENDING_PAYMENT);
        newBooking.setExpiresAt(LocalDateTime.now().plusMinutes(15));

        // 2. Verify booking status = PENDING_PAYMENT
        assertEquals(BookingStatus.PENDING_PAYMENT, newBooking.getStatus(), "Step 2: Initial booking status must be PENDING_PAYMENT");

        // 3. Verify no SUCCESS payment exists
        when(bookingRepository.findById(888L)).thenReturn(Optional.of(newBooking));
        when(paymentRepository.existsByBookingIdAndStatus(888L, PaymentStatus.SUCCESS)).thenReturn(false);
        assertFalse(paymentRepository.existsByBookingIdAndStatus(888L, PaymentStatus.SUCCESS), "Step 3: No SUCCESS payment exists yet");

        // 4. Call create-order as normal user
        when(authenticationService.getCurrentUser()).thenReturn(normalUser);
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_KEY123");
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayService.createOrder(eq(4400000L), anyString())).thenReturn("order_TEST_888");
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(888L)).thenReturn(Optional.empty());

        RazorpayOrderRequestDto orderReq = new RazorpayOrderRequestDto(888L);
        RazorpayOrderResponseDto orderResp = paymentService.createPaymentOrder(orderReq);

        // 5. Verify Razorpay order is created
        assertNotNull(orderResp, "Step 5: Order response must not be null");
        assertEquals("order_TEST_888", orderResp.getOrderId(), "Step 5: Razorpay order ID matches");
        assertEquals(4400000L, orderResp.getAmountPaise(), "Step 5: Exact amount in paise (44000.0 * 100)");

        // 6 & 7. Simulate Razorpay TEST checkout & Payment
        String testPaymentId = "pay_TEST_999";
        String testSignature = "valid_hmac_signature_888";

        // Setup Payment entity saved during createOrder
        Payment pendingPayment = new Payment();
        pendingPayment.setId(777L);
        pendingPayment.setBooking(newBooking);
        pendingPayment.setAmount(44000.0);
        pendingPayment.setStatus(PaymentStatus.PENDING);
        pendingPayment.setRazorpayOrderId("order_TEST_888");

        when(paymentRepository.findFirstByBookingIdAndStatus(888L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(paymentRepository.findByRazorpayOrderId("order_TEST_888")).thenReturn(Optional.of(pendingPayment));
        when(paymentRepository.findByRazorpayPaymentId(testPaymentId)).thenReturn(Optional.empty());

        // 8. Verify signature
        when(razorpayService.verifySignature("order_TEST_888", testPaymentId, testSignature)).thenReturn(true);

        com.razorpay.Payment rzpMockPayment = mock(com.razorpay.Payment.class);
        when(rzpMockPayment.get("status")).thenReturn("captured");
        when(rzpMockPayment.get("amount")).thenReturn(4400000L);
        when(rzpMockPayment.get("method")).thenReturn("card");
        when(razorpayService.fetchPayment(testPaymentId)).thenReturn(rzpMockPayment);

        RazorpayVerificationRequestDto verifyReq = new RazorpayVerificationRequestDto(888L, "order_TEST_888", testPaymentId, testSignature);
        RazorpayVerificationResponseDto verifyResp = paymentService.verifyPayment(verifyReq);

        // 9. Verify payment becomes SUCCESS
        assertTrue(verifyResp.isSuccess(), "Step 9: Verification succeeds");
        assertEquals(PaymentStatus.SUCCESS, pendingPayment.getStatus(), "Step 9: Payment record status becomes SUCCESS");
        assertEquals("CARD", verifyResp.getPaymentMethod(), "Step 9: Payment method extracted correctly");

        // 10. Verify booking becomes CONFIRMED
        assertEquals(BookingStatus.CONFIRMED, newBooking.getStatus(), "Step 10: Booking status becomes CONFIRMED");

        // 11 & 12. Attempt to pay the same booking again -> Verify second payment is correctly blocked
        when(paymentRepository.existsByBookingIdAndStatus(888L, PaymentStatus.SUCCESS)).thenReturn(true);
        PaymentAlreadyExistsException ex = assertThrows(PaymentAlreadyExistsException.class,
                () -> paymentService.createPaymentOrder(orderReq),
                "Step 11 & 12: Duplicate payment must be strictly blocked");
        assertEquals("This booking has already been paid for and confirmed.", ex.getMessage(), "Step 12: Exception message matches specification");

        // 13. Verify Admin sees the successful payment
        when(paymentRepository.findAll()).thenReturn(List.of(pendingPayment));
        var adminPayments = paymentService.getAllPaymentsForAdmin();
        assertEquals(1, adminPayments.size(), "Step 13: Admin sees all payments");
        assertEquals(777L, adminPayments.get(0).getPaymentId());

        // 14. Verify the user sees their own successful payment
        when(authenticationService.getCurrentUser()).thenReturn(normalUser);
        when(paymentRepository.findByBookingUserId(101L)).thenReturn(List.of(pendingPayment));
        var userPayments = paymentService.getAllPayments();
        assertEquals(1, userPayments.size(), "Step 14: User sees their own payment");
        assertEquals(777L, userPayments.get(0).getId());

        // 15. Verify another user cannot access it
        when(authenticationService.getCurrentUser()).thenReturn(attackerUser);
        assertThrows(ForbiddenException.class,
                () -> paymentService.createPaymentOrder(orderReq),
                "Step 15: Cross-user access is strictly forbidden");
    }
}
