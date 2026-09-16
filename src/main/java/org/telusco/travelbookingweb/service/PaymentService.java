package org.telusco.travelbookingweb.service;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.config.RazorpayConfig;
import org.telusco.travelbookingweb.dto.*;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.*;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final AuthenticationService authenticationService;
    private final RazorpayService razorpayService;
    private final RazorpayConfig razorpayConfig;

    public PaymentService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            AuthenticationService authenticationService,
            RazorpayService razorpayService,
            RazorpayConfig razorpayConfig) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.authenticationService = authenticationService;
        this.razorpayService = razorpayService;
        this.razorpayConfig = razorpayConfig;
    }

    /**
     * Creates a Razorpay order for an existing booking.
     * Enforces zero-trust frontend: amount is computed strictly from the DB entity.
     */
    @Transactional
    public RazorpayOrderResponseDto createPaymentOrder(RazorpayOrderRequestDto request) {
        User currentUser = authenticationService.getCurrentUser();
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + request.getBookingId()));

        // Security check: Only the booking owner or an admin can initiate payment
        if (!booking.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not allowed to make payment for this booking");
        }

        // Validate booking status
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidPaymentStateException("Cannot create payment for a cancelled booking");
        }

        // Duplicate payment check
        if (paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)) {
            throw new PaymentAlreadyExistsException("This booking has already been paid for and confirmed.");
        }

        // Expiration check
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BookingExpiredException("This booking reservation has expired. Please create a new booking.");
        }

        // Authoritative amount calculation using BigDecimal (no double/float money arithmetic)
        TravelPackage travelPackage = booking.getTravelPackage();
        BigDecimal price = BigDecimal.valueOf(travelPackage.getPrice());
        BigDecimal numberOfPeople = BigDecimal.valueOf(booking.getNumberOfPeople());
        BigDecimal totalAmountInRupees = price.multiply(numberOfPeople);

        // Convert to integer paise (1 Rupee = 100 Paise)
        long amountPaise = totalAmountInRupees.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.UNNECESSARY)
                .longValueExact();

        // Idempotency: Check if an active PENDING payment with a Razorpay Order already exists
        Optional<Payment> existingPendingOpt = paymentRepository.findTopByBookingIdOrderByIdDesc(booking.getId());
        String orderId;
        Payment payment;

        if (existingPendingOpt.isPresent() &&
                existingPendingOpt.get().getStatus() == PaymentStatus.PENDING &&
                existingPendingOpt.get().getRazorpayOrderId() != null &&
                !existingPendingOpt.get().getRazorpayOrderId().isEmpty()) {
            payment = existingPendingOpt.get();
            orderId = payment.getRazorpayOrderId();
            log.info("Reusing existing Razorpay order ID {} for booking ID {}", orderId, booking.getId());
        } else {
            String receipt = "bkg_" + booking.getId() + "_" + System.currentTimeMillis();
            orderId = razorpayService.createOrder(amountPaise, receipt);

            payment = existingPendingOpt.filter(p -> p.getStatus() == PaymentStatus.PENDING)
                    .orElseGet(Payment::new);
            payment.setAmount(totalAmountInRupees.doubleValue());
            payment.setBooking(booking);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setRazorpayOrderId(orderId);
            payment.setPaymentDate(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            log.info("Created new Razorpay order ID {} for booking ID {}", orderId, booking.getId());
        }

        return RazorpayOrderResponseDto.builder()
                .orderId(orderId)
                .amount(totalAmountInRupees)
                .amountPaise(amountPaise)
                .currency(razorpayConfig.getCurrency())
                .keyId(razorpayConfig.getKeyId())
                .bookingId(booking.getId())
                .packageTitle(travelPackage.getTitle())
                .customerName(booking.getUser().getName())
                .customerEmail(booking.getUser().getEmail())
                .build();
    }

    /**
     * Verifies payment completion.
     * Enforces:
     * 1. Cryptographic HMAC-SHA256 signature verification.
     * 2. Razorpay order ID matches payment record.
     * 3. Booking authorization.
     * 4. Razorpay API payment status verification (captured).
     * 5. Captured amount matches authoritative database paise amount.
     * 6. Replay attack prevention (duplicate payment ID check).
     * 7. Payment method extraction directly from Razorpay.
     * 8. Atomic transition: Payment -> SUCCESS, Booking -> CONFIRMED.
     */
    @Transactional
    public RazorpayVerificationResponseDto verifyPayment(RazorpayVerificationRequestDto request) {
        User currentUser = authenticationService.getCurrentUser();
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + request.getBookingId()));

        if (!booking.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not authorized to verify payment for this booking");
        }

        // Idempotency: If already confirmed with a successful payment, return success immediately
        Optional<Payment> existingSuccess = paymentRepository.findFirstByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS);
        if (existingSuccess.isPresent() && booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("Payment already verified for booking ID {}", booking.getId());
            Payment p = existingSuccess.get();
            return RazorpayVerificationResponseDto.builder()
                    .success(true)
                    .message("Payment has already been verified and confirmed.")
                    .paymentId(p.getId())
                    .razorpayPaymentId(p.getRazorpayPaymentId())
                    .bookingId(booking.getId())
                    .status(PaymentStatus.SUCCESS.name())
                    .paymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "ONLINE")
                    .build();
        }

        // Step 1: Cryptographic signature verification
        boolean isValidSignature = razorpayService.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValidSignature) {
            log.error("Payment signature verification failed for order: {}, payment: {}",
                    request.getRazorpayOrderId(), request.getRazorpayPaymentId());
            throw new PaymentVerificationException("Invalid payment signature. Verification failed.");
        }

        // Step 2: Validate expected order ID and booking relationship
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new PaymentNotFoundException(
                        "Payment record not found for Razorpay order: " + request.getRazorpayOrderId()
                ));

        if (!payment.getBooking().getId().equals(booking.getId())) {
            throw new PaymentVerificationException("Razorpay order does not match the specified booking");
        }

        // Step 3: Replay attack prevention - ensure payment ID hasn't been used on a different payment
        Optional<Payment> duplicate = paymentRepository.findByRazorpayPaymentId(request.getRazorpayPaymentId());
        if (duplicate.isPresent() && !duplicate.get().getId().equals(payment.getId())) {
            log.error("Replay attack detected: Razorpay payment ID {} already used on payment {}",
                    request.getRazorpayPaymentId(), duplicate.get().getId());
            throw new PaymentVerificationException("Duplicate payment detected. This payment ID has already been recorded.");
        }

        // Step 4: Fetch payment from Razorpay API to verify status and amount
        com.razorpay.Payment rzpPayment = razorpayService.fetchPayment(request.getRazorpayPaymentId());
        String rzpStatus = rzpPayment.get("status");
        if (!"captured".equalsIgnoreCase(rzpStatus) && !"authorized".equalsIgnoreCase(rzpStatus)) {
            log.error("Razorpay payment {} has status: {}", request.getRazorpayPaymentId(), rzpStatus);
            throw new PaymentVerificationException("Razorpay payment is not captured. Current status: " + rzpStatus);
        }

        // Validate amount in paise against authoritative DB calculation
        Number rzpAmountNum = rzpPayment.get("amount");
        long rzpAmountPaise = rzpAmountNum != null ? rzpAmountNum.longValue() : 0L;

        TravelPackage pkg = booking.getTravelPackage();
        BigDecimal expectedRupees = BigDecimal.valueOf(pkg.getPrice()).multiply(BigDecimal.valueOf(booking.getNumberOfPeople()));
        long expectedPaise = expectedRupees.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.UNNECESSARY)
                .longValueExact();

        if (rzpAmountPaise != expectedPaise) {
            log.error("Amount mismatch for payment {}: received {} paise, expected {} paise",
                    request.getRazorpayPaymentId(), rzpAmountPaise, expectedPaise);
            throw new PaymentVerificationException("Payment amount mismatch. Expected " + expectedPaise + " paise but got " + rzpAmountPaise + " paise.");
        }

        // Validate currency against configured INR
        String rzpCurrency = rzpPayment.get("currency");
        if (rzpCurrency != null && !razorpayConfig.getCurrency().equalsIgnoreCase(rzpCurrency)) {
            log.error("Currency mismatch for payment {}: received {}, expected {}",
                    request.getRazorpayPaymentId(), rzpCurrency, razorpayConfig.getCurrency());
            throw new PaymentVerificationException("Payment currency mismatch. Expected " + razorpayConfig.getCurrency() + " but got " + rzpCurrency);
        }

        // Step 5: Authoritative payment method extraction from Razorpay
        String rzpMethod = rzpPayment.get("method");
        PaymentMethod mappedMethod = mapRazorpayMethod(rzpMethod);

        // Step 6: Atomic transition: Payment -> SUCCESS, Booking -> CONFIRMED
        LocalDateTime now = LocalDateTime.now();
        payment.setPaymentMethod(mappedMethod);
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentDate(now);
        payment.setUpdatedAt(now);
        paymentRepository.save(payment);

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Payment {} successfully verified for booking {}. Method: {}",
                payment.getId(), booking.getId(), mappedMethod);

        return RazorpayVerificationResponseDto.builder()
                .success(true)
                .message("Payment verified and booking confirmed successfully.")
                .paymentId(payment.getId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .bookingId(booking.getId())
                .status(PaymentStatus.SUCCESS.name())
                .paymentMethod(mappedMethod.name())
                .build();
    }

    /**
     * Asynchronous Webhook processor.
     * Enforces webhook signature verification, amount checking, and idempotent state updates.
     */
    @Transactional
    public void processWebhook(String payload, String signature) {
        if (!razorpayService.verifyWebhookSignature(payload, signature)) {
            log.error("Invalid webhook signature received");
            throw new PaymentVerificationException("Invalid webhook signature");
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.optString("event");
        log.info("Processing Razorpay webhook event: {}", eventType);

        if (!event.has("payload") || !event.getJSONObject("payload").has("payment")) {
            log.warn("Webhook event {} missing payment payload", eventType);
            return;
        }

        JSONObject paymentEntity = event.getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity");

        String orderId = paymentEntity.optString("order_id");
        String paymentId = paymentEntity.optString("id");
        String status = paymentEntity.optString("status");
        String method = paymentEntity.optString("method");
        long amountPaise = paymentEntity.optLong("amount", 0L);

        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(orderId);
        if (paymentOpt.isEmpty()) {
            log.warn("Webhook: No payment record found for Razorpay order ID {}", orderId);
            return;
        }

        Payment payment = paymentOpt.get();
        Booking booking = payment.getBooking();

        if ("payment.captured".equalsIgnoreCase(eventType)) {
            // Idempotent: If already successful, do nothing
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                log.info("Webhook: Payment {} already marked SUCCESS", payment.getId());
                return;
            }

            // Authoritative amount check
            TravelPackage pkg = booking.getTravelPackage();
            BigDecimal expectedRupees = BigDecimal.valueOf(pkg.getPrice()).multiply(BigDecimal.valueOf(booking.getNumberOfPeople()));
            long expectedPaise = expectedRupees.multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.UNNECESSARY)
                    .longValueExact();

            if (amountPaise != expectedPaise) {
                log.error("Webhook: Amount mismatch for order {}: got {}, expected {}", orderId, amountPaise, expectedPaise);
                return;
            }

            String rzpCurrency = paymentEntity.optString("currency");
            if (rzpCurrency != null && !rzpCurrency.isEmpty() && !razorpayConfig.getCurrency().equalsIgnoreCase(rzpCurrency)) {
                log.error("Webhook: Currency mismatch for order {}: got {}, expected {}", orderId, rzpCurrency, razorpayConfig.getCurrency());
                return;
            }

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentMethod(mapRazorpayMethod(method));
            payment.setRazorpayPaymentId(paymentId);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
            log.info("Webhook: Confirmed booking {} via payment.captured", booking.getId());

        } else if ("payment.failed".equalsIgnoreCase(eventType)) {
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(payment);
                log.info("Webhook: Marked payment {} as FAILED for order {}", payment.getId(), orderId);
            }
        }
    }

    private PaymentMethod mapRazorpayMethod(String method) {
        if (method == null) {
            return PaymentMethod.NET_BANKING;
        }
        return switch (method.toLowerCase()) {
            case "card" -> PaymentMethod.CARD;
            case "upi" -> PaymentMethod.UPI;
            case "netbanking" -> PaymentMethod.NET_BANKING;
            default -> PaymentMethod.NET_BANKING;
        };
    }

    // ==========================================
    // Existing CRUD & Admin Methods (Preserved)
    // ==========================================

    public PaymentDto createPayment(PaymentDto paymentDto) {
        User currentUser = authenticationService.getCurrentUser();
        Booking booking = bookingRepository.findById(paymentDto.getBookingId())
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not allowed to make payment for this booking");
        }
        if (paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)) {
            throw new PaymentAlreadyExistsException("Payment already exists and is confirmed for this booking");
        }

        Payment payment = new Payment();
        payment.setAmount(booking.getTotalAmount());
        payment.setPaymentMethod(paymentDto.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        payment.setBooking(booking);

        Payment savedPayment = paymentRepository.save(payment);
        return mapToPaymentDto(savedPayment);
    }

    public List<PaymentDto> getAllPayments() {
        User currentUser = authenticationService.getCurrentUser();
        return paymentRepository.findByBookingUserId(currentUser.getId())
                .stream()
                .map(this::mapToPaymentDto)
                .toList();
    }

    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));

        User currentUser = authenticationService.getCurrentUser();
        if (!payment.getBooking().getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not allowed to delete this payment");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new InvalidPaymentStateException("Cannot delete a successful payment record. Financial audit records must be preserved.");
        }

        paymentRepository.delete(payment);
    }

    public PaymentDto getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));

        User currentUser = authenticationService.getCurrentUser();
        if (!payment.getBooking().getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not allowed to view this payment");
        }

        return mapToPaymentDto(payment);
    }

    public List<AdminPaymentResponseDto> getAllPaymentsForAdmin() {
        return paymentRepository.findAll()
                .stream()
                .map(this::mapToAdminPaymentResponseDto)
                .toList();
    }

    public AdminPaymentResponseDto getPaymentByIdForAdmin(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));
        return mapToAdminPaymentResponseDto(payment);
    }

    @Transactional
    public RefundResponseDto processRefund(Long paymentId, RefundRequestDto request) {
        User currentUser = authenticationService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only administrators are authorized to process refunds");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.SUCCESS && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw new InvalidPaymentStateException("Only successful payments can be refunded. Current status: " + payment.getStatus());
        }

        double requestedAmount = (request != null && request.getAmount() != null && request.getAmount() > 0)
                ? request.getAmount()
                : payment.getAmount();

        double alreadyRefunded = payment.getRefundAmount() != null ? payment.getRefundAmount() : 0.0;
        double remainingRefundable = payment.getAmount() - alreadyRefunded;

        if (requestedAmount > remainingRefundable) {
            throw new InvalidPaymentStateException(
                    String.format("Refund amount (₹%.2f) exceeds remaining refundable balance (₹%.2f)", requestedAmount, remainingRefundable)
            );
        }

        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim()
                : "Administrative cancellation refund";
        String refundId;

        if (payment.getRazorpayPaymentId() != null && !payment.getRazorpayPaymentId().isBlank() && razorpayConfig.isConfigured()) {
            long amountPaise = Math.round(requestedAmount * 100);
            refundId = razorpayService.issueRefund(payment.getRazorpayPaymentId(), amountPaise, reason);
        } else {
            refundId = "rfnd_manual_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        }

        double newTotalRefunded = alreadyRefunded + requestedAmount;
        PaymentStatus newStatus = (newTotalRefunded >= payment.getAmount()) ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

        payment.setStatus(newStatus);
        payment.setRefundId(refundId);
        payment.setRefundAmount(newTotalRefunded);
        payment.setRefundDate(LocalDateTime.now());
        payment.setRefundReason(reason);
        payment.setRefundStatus("processed");
        payment.setUpdatedAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        log.info("Successfully processed refund {} of ₹{} for payment {} (booking {})",
                refundId, requestedAmount, paymentId, payment.getBooking().getId());

        return RefundResponseDto.builder()
                .paymentId(savedPayment.getId())
                .bookingId(savedPayment.getBooking().getId())
                .refundId(refundId)
                .refundAmount(newTotalRefunded)
                .status(newStatus)
                .refundDate(savedPayment.getRefundDate())
                .reason(reason)
                .message("Refund of ₹" + requestedAmount + " processed successfully.")
                .build();
    }

    private PaymentDto mapToPaymentDto(Payment payment) {
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setStatus(payment.getStatus());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setRazorpayOrderId(payment.getRazorpayOrderId());
        dto.setRazorpayPaymentId(payment.getRazorpayPaymentId());
        dto.setBookingId(payment.getBooking().getId());
        dto.setCurrency(razorpayConfig.getCurrency());
        dto.setRefundId(payment.getRefundId());
        dto.setRefundAmount(payment.getRefundAmount());
        dto.setRefundDate(payment.getRefundDate());
        dto.setRefundReason(payment.getRefundReason());
        return dto;
    }

    private AdminPaymentResponseDto mapToAdminPaymentResponseDto(Payment payment) {
        AdminPaymentResponseDto dto = new AdminPaymentResponseDto();
        dto.setPaymentId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setCurrency(razorpayConfig.getCurrency());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setStatus(payment.getStatus());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setRazorpayOrderId(payment.getRazorpayOrderId());
        dto.setRazorpayPaymentId(payment.getRazorpayPaymentId());

        Booking booking = payment.getBooking();
        dto.setBookingId(booking.getId());
        dto.setTotalBookingAmount(booking.getTotalAmount());
        dto.setBookingDate(booking.getBookingDate());
        dto.setNumberOfPeople(booking.getNumberOfPeople());

        User user = booking.getUser();
        dto.setUserId(user.getId());
        dto.setCustomerName(user.getName());
        dto.setCustomerEmail(user.getEmail());

        TravelPackage travelPackage = booking.getTravelPackage();
        if (travelPackage != null) {
            dto.setTravelPackageId(travelPackage.getId());
            dto.setTravelPackageName(travelPackage.getTitle());
            if (travelPackage.getDestination() != null) {
                dto.setDestinationName(travelPackage.getDestination().getName());
            }
        }

        dto.setRefundId(payment.getRefundId());
        dto.setRefundAmount(payment.getRefundAmount());
        dto.setRefundDate(payment.getRefundDate());
        dto.setRefundReason(payment.getRefundReason());

        return dto;
    }
}
