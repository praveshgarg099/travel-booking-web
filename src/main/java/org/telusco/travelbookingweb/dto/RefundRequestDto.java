package org.telusco.travelbookingweb.dto;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefundRequestDto {

    @Positive(message = "Refund amount must be positive")
    private Double amount;

    private String reason;
}
