package org.telusco.travelbookingweb.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayVerificationResponseDto {
    private boolean success;
    private String message;
    private Long paymentId;
    private String razorpayPaymentId;
    private Long bookingId;
    private String status;
    private String paymentMethod;
}
