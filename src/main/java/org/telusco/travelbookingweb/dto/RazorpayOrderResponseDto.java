package org.telusco.travelbookingweb.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderResponseDto {
    private String orderId;
    private BigDecimal amount;
    private Long amountPaise;
    private String currency;
    private String keyId;
    private Long bookingId;
    private String packageTitle;
    private String customerName;
    private String customerEmail;
}
