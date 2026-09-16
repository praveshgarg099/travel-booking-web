package org.telusco.travelbookingweb.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.telusco.travelbookingweb.entity.PaymentMethod;
import org.telusco.travelbookingweb.entity.PaymentStatus;

import java.time.LocalDateTime;
@Getter
@Setter
public class PaymentDto {
    private Long id;

    private Double amount;
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private PaymentStatus status;

    private LocalDateTime paymentDate;

    private String razorpayOrderId;
    private String razorpayPaymentId;

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    private String currency = "INR";

    private String refundId;
    private Double refundAmount;
    private LocalDateTime refundDate;
    private String refundReason;
}
