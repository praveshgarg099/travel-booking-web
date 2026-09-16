package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.telusco.travelbookingweb.config.RazorpayConfig;
import org.telusco.travelbookingweb.dto.*;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.*;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private RazorpayService razorpayService;

    @Mock
    private RazorpayConfig razorpayConfig;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private User otherUser;
    private TravelPackage testPackage;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setName("Alice");
        testUser.setEmail("alice@example.com");
        testUser.setRole(Role.USER);

        otherUser = new User();
        otherUser.setId(20L);
        otherUser.setName("Bob");
        otherUser.setEmail("bob@example.com");
        otherUser.setRole(Role.USER);

        testPackage = new TravelPackage();
        testPackage.setId(100L);
        testPackage.setTitle("Goa Beach Tour");
        testPackage.setPrice(1500.0); // Double in entity
        testPackage.setAvailableSeats(10);

        testBooking = new Booking();
        testBooking.setId(500L);
        testBooking.setUser(testUser);
        testBooking.setTravelPackage(testPackage);
        testBooking.setNumberOfPeople(2);
        testBooking.setTotalAmount(3000.0);
        testBooking.setBookingDate(LocalDate.now().plusDays(5));
        testBooking.setStatus(BookingStatus.PENDING_PAYMENT);
        testBooking.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    }

    @Test
    @DisplayName("Create payment order calculates exact paise via BigDecimal and reuses pending order")
    void testCreatePaymentOrderSuccess() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(500L)).thenReturn(Optional.empty());
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key123");
        when(razorpayService.createOrder(eq(300000L), anyString())).thenReturn("order_rzp_500");

        RazorpayOrderRequestDto request = new RazorpayOrderRequestDto(500L);
        RazorpayOrderResponseDto response = paymentService.createPaymentOrder(request);

        assertNotNull(response);
        assertEquals("order_rzp_500", response.getOrderId());
        assertEquals(300000L, response.getAmountPaise(), "3000.0 * 100 must be exactly 300000 paise");
        assertEquals("rzp_test_key123", response.getKeyId());
        assertEquals(500L, response.getBookingId());

        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    @Test
    @DisplayName("Create payment order throws ForbiddenException when requesting payment for another user's booking")
    void testCreatePaymentOrderForbidden() {
        when(authenticationService.getCurrentUser()).thenReturn(otherUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));

        RazorpayOrderRequestDto request = new RazorpayOrderRequestDto(500L);
        assertThrows(ForbiddenException.class, () -> paymentService.createPaymentOrder(request));
    }

    @Test
    @DisplayName("Create payment order throws PaymentAlreadyExistsException if booking has SUCCESS payment")
    void testCreatePaymentOrderAlreadyPaid() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.existsByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(true);

        RazorpayOrderRequestDto request = new RazorpayOrderRequestDto(500L);
        assertThrows(PaymentAlreadyExistsException.class, () -> paymentService.createPaymentOrder(request));
    }

    @Test
    @DisplayName("Create payment order throws BookingExpiredException if booking reservation expired")
    void testCreatePaymentOrderExpired() {
        testBooking.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));

        RazorpayOrderRequestDto request = new RazorpayOrderRequestDto(500L);
        assertThrows(BookingExpiredException.class, () -> paymentService.createPaymentOrder(request));
    }

    @Test
    @DisplayName("Verify payment fails when HMAC signature is invalid")
    void testVerifyPaymentInvalidSignature() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findFirstByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(razorpayService.verifySignature("order_123", "pay_123", "bad_sig")).thenReturn(false);

        RazorpayVerificationRequestDto request = new RazorpayVerificationRequestDto(500L, "order_123", "pay_123", "bad_sig");
        assertThrows(PaymentVerificationException.class, () -> paymentService.verifyPayment(request));
    }

    @Test
    @DisplayName("Verify payment detects replay attack with duplicate payment ID")
    void testVerifyPaymentReplayAttack() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findFirstByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(razorpayService.verifySignature("order_123", "pay_already_used", "good_sig")).thenReturn(true);

        Payment existingPayment = new Payment();
        existingPayment.setId(1L);
        existingPayment.setBooking(testBooking);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(existingPayment));

        Payment otherPayment = new Payment();
        otherPayment.setId(99L);
        when(paymentRepository.findByRazorpayPaymentId("pay_already_used")).thenReturn(Optional.of(otherPayment));

        RazorpayVerificationRequestDto request = new RazorpayVerificationRequestDto(500L, "order_123", "pay_already_used", "good_sig");
        PaymentVerificationException ex = assertThrows(PaymentVerificationException.class, () -> paymentService.verifyPayment(request));
        assertTrue(ex.getMessage().contains("Duplicate payment detected"));
    }

    @Test
    @DisplayName("Verify payment detects amount manipulation and rejects")
    void testVerifyPaymentAmountMismatch() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findFirstByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(razorpayService.verifySignature("order_123", "pay_123", "good_sig")).thenReturn(true);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setBooking(testBooking);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_123")).thenReturn(Optional.empty());

        // Mock Razorpay payment with tampered amount: 10000 paise (Rs 100) instead of 300000 paise (Rs 3000)
        com.razorpay.Payment rzpPayment = mock(com.razorpay.Payment.class);
        when(rzpPayment.get("status")).thenReturn("captured");
        when(rzpPayment.get("amount")).thenReturn(10000L);
        when(razorpayService.fetchPayment("pay_123")).thenReturn(rzpPayment);

        RazorpayVerificationRequestDto request = new RazorpayVerificationRequestDto(500L, "order_123", "pay_123", "good_sig");
        PaymentVerificationException ex = assertThrows(PaymentVerificationException.class, () -> paymentService.verifyPayment(request));
        assertTrue(ex.getMessage().contains("Payment amount mismatch"));
    }

    @Test
    @DisplayName("Verify payment succeeds with captured payment, extracts real method, and confirms booking")
    void testVerifyPaymentSuccess() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findFirstByBookingIdAndStatus(500L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(razorpayService.verifySignature("order_123", "pay_123", "valid_sig")).thenReturn(true);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setBooking(testBooking);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_123")).thenReturn(Optional.empty());

        com.razorpay.Payment rzpPayment = mock(com.razorpay.Payment.class);
        when(rzpPayment.get("status")).thenReturn("captured");
        when(rzpPayment.get("amount")).thenReturn(300000L); // Exactly 3000.0 * 100
        when(rzpPayment.get("currency")).thenReturn("INR");
        when(rzpPayment.get("method")).thenReturn("upi");
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayService.fetchPayment("pay_123")).thenReturn(rzpPayment);

        RazorpayVerificationRequestDto request = new RazorpayVerificationRequestDto(500L, "order_123", "pay_123", "valid_sig");
        RazorpayVerificationResponseDto response = paymentService.verifyPayment(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("UPI", response.getPaymentMethod());
        assertEquals(BookingStatus.CONFIRMED, testBooking.getStatus());
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals("pay_123", payment.getRazorpayPaymentId());

        verify(paymentRepository, times(1)).save(payment);
        verify(bookingRepository, times(1)).save(testBooking);
    }

    @Test
    @DisplayName("Admin can process full refund on SUCCESS payment via Razorpay")
    void testAdminCanProcessFullRefundSuccess() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setRole(Role.ADMIN);

        Payment successPayment = new Payment();
        successPayment.setId(99L);
        successPayment.setAmount(3000.0);
        successPayment.setStatus(PaymentStatus.SUCCESS);
        successPayment.setRazorpayPaymentId("pay_rzp_full");
        successPayment.setBooking(testBooking);

        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.findById(99L)).thenReturn(Optional.of(successPayment));
        when(razorpayConfig.isConfigured()).thenReturn(true);
        when(razorpayService.issueRefund(eq("pay_rzp_full"), eq(300000L), anyString())).thenReturn("rfnd_12345");
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        RefundRequestDto request = new RefundRequestDto();
        request.setAmount(3000.0);
        request.setReason("Customer requested trip cancellation");

        RefundResponseDto response = paymentService.processRefund(99L, request);

        assertNotNull(response);
        assertEquals(PaymentStatus.REFUNDED, response.getStatus());
        assertEquals("rfnd_12345", response.getRefundId());
        assertEquals(3000.0, response.getRefundAmount());
        assertEquals(PaymentStatus.REFUNDED, successPayment.getStatus());
        verify(paymentRepository, times(1)).save(successPayment);
    }

    @Test
    @DisplayName("Admin can process partial refund on SUCCESS payment")
    void testAdminCanProcessPartialRefundSuccess() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setRole(Role.ADMIN);

        Payment successPayment = new Payment();
        successPayment.setId(99L);
        successPayment.setAmount(3000.0);
        successPayment.setStatus(PaymentStatus.SUCCESS);
        successPayment.setRazorpayPaymentId("pay_rzp_part");
        successPayment.setBooking(testBooking);

        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.findById(99L)).thenReturn(Optional.of(successPayment));
        when(razorpayConfig.isConfigured()).thenReturn(true);
        when(razorpayService.issueRefund(eq("pay_rzp_part"), eq(100000L), anyString())).thenReturn("rfnd_part_99");
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        RefundRequestDto request = new RefundRequestDto();
        request.setAmount(1000.0);
        request.setReason("Partial discount adjustment");

        RefundResponseDto response = paymentService.processRefund(99L, request);

        assertNotNull(response);
        assertEquals(PaymentStatus.PARTIALLY_REFUNDED, response.getStatus());
        assertEquals("rfnd_part_99", response.getRefundId());
        assertEquals(1000.0, response.getRefundAmount());
        assertEquals(PaymentStatus.PARTIALLY_REFUNDED, successPayment.getStatus());
    }

    @Test
    @DisplayName("Non-admin user is rejected from issuing refunds")
    void testNonAdminCannotIssueRefund() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);

        RefundRequestDto request = new RefundRequestDto();
        request.setAmount(1000.0);

        assertThrows(ForbiddenException.class, () -> paymentService.processRefund(99L, request));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cannot refund a payment that is not SUCCESS or PARTIALLY_REFUNDED")
    void testCannotRefundPendingOrFailedPayment() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setRole(Role.ADMIN);

        Payment pendingPayment = new Payment();
        pendingPayment.setId(99L);
        pendingPayment.setAmount(3000.0);
        pendingPayment.setStatus(PaymentStatus.PENDING);
        pendingPayment.setBooking(testBooking);

        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.findById(99L)).thenReturn(Optional.of(pendingPayment));

        assertThrows(InvalidPaymentStateException.class, () -> paymentService.processRefund(99L, new RefundRequestDto()));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Refund amount exceeding payment balance is rejected")
    void testRefundAmountExceedingBalanceIsRejected() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setRole(Role.ADMIN);

        Payment successPayment = new Payment();
        successPayment.setId(99L);
        successPayment.setAmount(3000.0);
        successPayment.setRefundAmount(2500.0); // Only 500 remaining
        successPayment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
        successPayment.setBooking(testBooking);

        when(authenticationService.getCurrentUser()).thenReturn(adminUser);
        when(paymentRepository.findById(99L)).thenReturn(Optional.of(successPayment));

        RefundRequestDto request = new RefundRequestDto();
        request.setAmount(600.0); // Exceeds 500.0

        InvalidPaymentStateException ex = assertThrows(InvalidPaymentStateException.class,
                () -> paymentService.processRefund(99L, request));
        assertTrue(ex.getMessage().contains("exceeds remaining refundable balance"));
        verify(paymentRepository, never()).save(any());
    }
}
