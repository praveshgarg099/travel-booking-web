package org.telusco.travelbookingweb.dto;

import lombok.Getter;
import lombok.Setter;
import org.telusco.travelbookingweb.entity.PaymentMethod;
import org.telusco.travelbookingweb.entity.PaymentStatus;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Getter
@Setter
public class AdminPaymentResponseDto {
    private Long paymentId;
    private Double amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private LocalDateTime paymentDate;
    private String razorpayOrderId;
    private String razorpayPaymentId;

    private Long bookingId;
    private Double totalBookingAmount;
    private LocalDate bookingDate;
    private Integer numberOfPeople;

    private Long userId;
    private String customerName;
    private String customerEmail;

    private Long travelPackageId;
    private String travelPackageName;
    private String destinationName;
}
