package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.BookingNotFoundException;
import org.telusco.travelbookingweb.exception.ForbiddenException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PdfVoucherServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private PdfVoucherService pdfVoucherService;

    private User traveler;
    private User admin;
    private User stranger;
    private TravelPackage travelPackage;
    private Destination destination;
    private Booking booking;
    private Payment payment;

    @BeforeEach
    void setUp() {
        traveler = new User();
        traveler.setId(10L);
        traveler.setName("Aarav Sharma");
        traveler.setEmail("aarav@example.com");
        traveler.setRole(Role.USER);

        admin = new User();
        admin.setId(1L);
        admin.setName("Admin User");
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        stranger = new User();
        stranger.setId(99L);
        stranger.setName("Stranger");
        stranger.setEmail("stranger@example.com");
        stranger.setRole(Role.USER);

        destination = new Destination();
        destination.setId(5L);
        destination.setName("Manali");
        destination.setCountry("India");

        travelPackage = new TravelPackage();
        travelPackage.setId(20L);
        travelPackage.setTitle("Himalayan Heights Explorer");
        travelPackage.setPrice(15000.0);
        travelPackage.setDuration(4);
        travelPackage.setDestination(destination);

        booking = new Booking();
        booking.setId(101L);
        booking.setBookingDate(LocalDate.now().plusDays(10));
        booking.setNumberOfPeople(2);
        booking.setTotalAmount(30000.0);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setUser(traveler);
        booking.setTravelPackage(travelPackage);

        payment = new Payment();
        payment.setId(501L);
        payment.setAmount(30000.0);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentMethod(PaymentMethod.UPI);
        payment.setRazorpayOrderId("order_test_101");
        payment.setRazorpayPaymentId("pay_test_501");
        payment.setPaymentDate(LocalDateTime.now().minusHours(2));
        payment.setBooking(booking);
    }

    @Test
    @DisplayName("Successfully generates PDF voucher for booking owner with valid PDF header and content")
    void testGenerateBookingVoucherPdf_Success() {
        when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        when(authenticationService.getCurrentUser()).thenReturn(traveler);
        when(paymentRepository.findFirstByBookingIdAndStatus(101L, PaymentStatus.SUCCESS))
                .thenReturn(Optional.of(payment));

        byte[] pdfBytes = pdfVoucherService.generateBookingVoucherPdf(101L);

        assertNotNull(pdfBytes, "PDF byte array should not be null");
        assertTrue(pdfBytes.length > 2000, "PDF should contain substantial content, size: " + pdfBytes.length);

        // Standard PDF magic byte header check: %PDF-
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.UTF_8);
        assertEquals("%PDF-", magicHeader, "Output must be a valid PDF starting with %PDF-");
    }

    @Test
    @DisplayName("Admin can generate PDF voucher for any traveler's booking")
    void testGenerateBookingVoucherPdf_AsAdmin() {
        when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        when(authenticationService.getCurrentUser()).thenReturn(admin);
        when(paymentRepository.findFirstByBookingIdAndStatus(101L, PaymentStatus.SUCCESS))
                .thenReturn(Optional.of(payment));

        byte[] pdfBytes = pdfVoucherService.generateBookingVoucherPdf(101L);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 2000);
        assertEquals("%PDF-", new String(pdfBytes, 0, 5, StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Stranger is rejected with ForbiddenException when attempting to download another's voucher")
    void testGenerateBookingVoucherPdf_ForbiddenForStranger() {
        when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        when(authenticationService.getCurrentUser()).thenReturn(stranger);

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> pdfVoucherService.generateBookingVoucherPdf(101L));

        assertTrue(ex.getMessage().contains("not authorized to download this booking voucher"));
    }

    @Test
    @DisplayName("Throws BookingNotFoundException when booking ID does not exist")
    void testGenerateBookingVoucherPdf_NotFound() {
        when(bookingRepository.findById(9999L)).thenReturn(Optional.empty());

        assertThrows(BookingNotFoundException.class,
                () -> pdfVoucherService.generateBookingVoucherPdf(9999L));
    }

    @Test
    @DisplayName("Generates valid PDF voucher even when no payment record exists yet")
    void testGenerateBookingVoucherPdf_WithoutPaymentRecord() {
        when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        when(authenticationService.getCurrentUser()).thenReturn(traveler);
        when(paymentRepository.findFirstByBookingIdAndStatus(101L, PaymentStatus.SUCCESS))
                .thenReturn(Optional.empty());
        when(paymentRepository.findTopByBookingIdOrderByIdDesc(101L))
                .thenReturn(Optional.empty());

        byte[] pdfBytes = pdfVoucherService.generateBookingVoucherPdf(101L);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 2000);
        assertEquals("%PDF-", new String(pdfBytes, 0, 5, StandardCharsets.UTF_8));
    }
}
