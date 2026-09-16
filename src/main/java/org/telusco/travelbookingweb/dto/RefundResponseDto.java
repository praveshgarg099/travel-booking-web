package org.telusco.travelbookingweb.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.telusco.travelbookingweb.entity.PaymentStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundResponseDto {
    private Long paymentId;
    private Long bookingId;
    private String refundId;
    private Double refundAmount;
    private PaymentStatus status;
    private LocalDateTime refundDate;
    private String reason;
    private String message;
}
