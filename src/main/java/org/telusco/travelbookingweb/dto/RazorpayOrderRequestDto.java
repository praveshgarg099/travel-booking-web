package org.telusco.travelbookingweb.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderRequestDto {
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
}
