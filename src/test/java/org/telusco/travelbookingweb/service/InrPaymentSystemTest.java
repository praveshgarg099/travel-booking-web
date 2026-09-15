package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telusco.travelbookingweb.config.RazorpayConfig;
import org.telusco.travelbookingweb.dto.RazorpayOrderRequestDto;
import org.telusco.travelbookingweb.dto.RazorpayOrderResponseDto;
import org.telusco.travelbookingweb.dto.RazorpayVerificationRequestDto;
import org.telusco.travelbookingweb.dto.RazorpayVerificationResponseDto;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.PaymentAlreadyExistsException;
import org.telusco.travelbookingweb.exception.PaymentVerificationException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InrPaymentSystemTest {

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
    private TravelPackage package50k;
    private TravelPackage package100k;
    private Booking booking50k;
    private Booking booking100k;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setName("Priya Singh");
        testUser.setEmail("priya@example.com");
        testUser.setRole(Role.USER);

        // Package 1: ₹50,000 per person
        package50k = new TravelPackage();
        package50k.setId(101L);
        package50k.setTitle("Himalayan Serenity Expedition");
        package50k.setPrice(50000.0);
        package50k.setAvailableSeats(20);

        booking50k = new Booking();
        booking50k.setId(1001L);
        booking50k.setUser(testUser);
        booking50k.setTravelPackage(package50k);
        booking50k.setNumberOfPeople(1);
        booking50k.setTotalAmount(50000.0);
        booking50k.setBookingDate(LocalDate.now().plusDays(10));
        booking50k.setStatus(BookingStatus.PENDING_PAYMENT);
        booking50k.setExpiresAt(LocalDateTime.now().plusMinutes(15));

        // Package 2: ₹50,000 per person × 2 travelers = ₹1,00,000
        package100k = new TravelPackage();
        package100k.setId(102L);
        package100k.setTitle("Kashmir Luxury Escape");
        package100k.setPrice(50000.0);
        package100k.setAvailableSeats(10);

        booking100k = new Booking();
        booking100k.setId(1002L);
        booking100k.setUser(testUser);
        booking100k.setTravelPackage(package100k);
        booking100k.setNumberOfPeople(2);
        booking100k.setTotalAmount(100000.0);
        booking100k.setBookingDate(LocalDate.now().plusDays(15));
        booking100k.setStatus(BookingStatus.PENDING_PAYMENT);
        booking100k.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    }

    @Test
    @DisplayName("1. Razorpay order currency is strictly INR")
    void testRazorpayOrderCurrencyIsINR() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1001L)).thenReturn(Optional.of(booking50k));
        when(paymentRepository.existsByBookingIdAndStatus(1001L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(1001L)).thenReturn(Optional.empty());
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
        when(razorpayService.createOrder(anyLong(), anyString())).thenReturn("order_inr_1");

        RazorpayOrderRequestDto req = new RazorpayOrderRequestDto(1001L);
        RazorpayOrderResponseDto res = paymentService.createPaymentOrder(req);

        assertNotNull(res);
        assertEquals("INR", res.getCurrency(), "Razorpay order currency must be INR");
    }

    @Test
    @DisplayName("2 & 3. ₹50,000 is correctly converted server-side to 5,000,000 paise")
    void testFiftyThousandConvertsToPaise() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1001L)).thenReturn(Optional.of(booking50k));
        when(paymentRepository.existsByBookingIdAndStatus(1001L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(1001L)).thenReturn(Optional.empty());
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
        // Verify exactly 5,000,000 paise passed to Razorpay
        when(razorpayService.createOrder(eq(5000000L), anyString())).thenReturn("order_50k");

        RazorpayOrderRequestDto req = new RazorpayOrderRequestDto(1001L);
        RazorpayOrderResponseDto res = paymentService.createPaymentOrder(req);

        assertEquals(5000000L, res.getAmountPaise(), "₹50,000 must convert to exactly 5,000,000 paise");
        assertEquals(BigDecimal.valueOf(50000.0), res.getAmount());
    }

    @Test
    @DisplayName("4. ₹1,00,000 is correctly converted server-side to 10,000,000 paise")
    void testOneLakhConvertsToPaise() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1002L)).thenReturn(Optional.of(booking100k));
        when(paymentRepository.existsByBookingIdAndStatus(1002L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(1002L)).thenReturn(Optional.empty());
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
        // Verify exactly 10,000,000 paise passed to Razorpay
        when(razorpayService.createOrder(eq(10000000L), anyString())).thenReturn("order_100k");

        RazorpayOrderRequestDto req = new RazorpayOrderRequestDto(1002L);
        RazorpayOrderResponseDto res = paymentService.createPaymentOrder(req);

        assertEquals(10000000L, res.getAmountPaise(), "₹1,00,000 must convert to exactly 10,000,000 paise");
        assertEquals(BigDecimal.valueOf(100000.0), res.getAmount());
    }

    @Test
    @DisplayName("5. Client cannot override backend price or amount")
    void testClientCannotOverrideBackendAmount() {
        // Even if a malicious request was formed, createPaymentOrder only takes bookingId
        // and derives amount authoritatively from TravelPackage in the DB
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1002L)).thenReturn(Optional.of(booking100k));
        when(paymentRepository.existsByBookingIdAndStatus(1002L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(1002L)).thenReturn(Optional.empty());
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
        when(razorpayService.createOrder(eq(10000000L), anyString())).thenReturn("order_auth_100k");

        RazorpayOrderRequestDto req = new RazorpayOrderRequestDto(1002L);
        RazorpayOrderResponseDto res = paymentService.createPaymentOrder(req);

        // Verification that DB calculation was used, not 0 or any client input
        assertEquals(10000000L, res.getAmountPaise());
        verify(razorpayService).createOrder(eq(10000000L), anyString());
    }

    @Test
    @DisplayName("6 & 7. Wrong Razorpay currency (e.g. USD) is strictly rejected")
    void testWrongRazorpayCurrencyIsRejected() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1001L)).thenReturn(Optional.of(booking50k));
        when(paymentRepository.findFirstByBookingIdAndStatus(1001L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(razorpayService.verifySignature("order_rzp", "pay_usd", "sig")).thenReturn(true);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setBooking(booking50k);
        when(paymentRepository.findByRazorpayOrderId("order_rzp")).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_usd")).thenReturn(Optional.empty());

        com.razorpay.Payment rzpPayment = mock(com.razorpay.Payment.class);
        when(rzpPayment.get("status")).thenReturn("captured");
        when(rzpPayment.get("amount")).thenReturn(5000000L);
        // Tampered / incorrect currency: USD instead of INR
        when(rzpPayment.get("currency")).thenReturn("USD");
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayService.fetchPayment("pay_usd")).thenReturn(rzpPayment);

        RazorpayVerificationRequestDto req = new RazorpayVerificationRequestDto(1001L, "order_rzp", "pay_usd", "sig");
        PaymentVerificationException ex = assertThrows(PaymentVerificationException.class, () -> paymentService.verifyPayment(req));
        assertTrue(ex.getMessage().contains("Payment currency mismatch"), "Must reject non-INR currency");
    }

    @Test
    @DisplayName("8. Successful INR payment transitions booking to CONFIRMED and payment to SUCCESS")
    void testSuccessfulPaymentConfirmsBooking() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1001L)).thenReturn(Optional.of(booking50k));
        when(paymentRepository.findFirstByBookingIdAndStatus(1001L, PaymentStatus.SUCCESS)).thenReturn(Optional.empty());
        when(razorpayService.verifySignature("order_rzp", "pay_valid", "sig")).thenReturn(true);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setBooking(booking50k);
        when(paymentRepository.findByRazorpayOrderId("order_rzp")).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_valid")).thenReturn(Optional.empty());

        com.razorpay.Payment rzpPayment = mock(com.razorpay.Payment.class);
        when(rzpPayment.get("status")).thenReturn("captured");
        when(rzpPayment.get("amount")).thenReturn(5000000L);
        when(rzpPayment.get("currency")).thenReturn("INR");
        when(rzpPayment.get("method")).thenReturn("upi");
        when(razorpayConfig.getCurrency()).thenReturn("INR");
        when(razorpayService.fetchPayment("pay_valid")).thenReturn(rzpPayment);

        RazorpayVerificationRequestDto req = new RazorpayVerificationRequestDto(1001L, "order_rzp", "pay_valid", "sig");
        RazorpayVerificationResponseDto res = paymentService.verifyPayment(req);

        assertTrue(res.isSuccess());
        assertEquals("SUCCESS", res.getStatus());
        assertEquals(BookingStatus.CONFIRMED, booking50k.getStatus());
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
    }

    @Test
    @DisplayName("9. Duplicate payment attempt on confirmed booking is rejected")
    void testDuplicatePaymentRejected() {
        when(authenticationService.getCurrentUser()).thenReturn(testUser);
        when(bookingRepository.findById(1001L)).thenReturn(Optional.of(booking50k));
        when(paymentRepository.existsByBookingIdAndStatus(1001L, PaymentStatus.SUCCESS)).thenReturn(true);

        RazorpayOrderRequestDto req = new RazorpayOrderRequestDto(1001L);
        assertThrows(PaymentAlreadyExistsException.class, () -> paymentService.createPaymentOrder(req));
    }
}
