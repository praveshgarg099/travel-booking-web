package org.telusco.travelbookingweb.dto;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;
import org.telusco.travelbookingweb.entity.BookingStatus;

import java.time.LocalDate;

@Getter
@Setter
public class BookingDto {
    private Long id;
    @NotNull(message = "Number of people is required")
    @Min(value = 1, message = "Number of people must be greater than 0")
    private Integer numberOfPeople;

    private Double totalAmount;
    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;
    private java.time.LocalDateTime expiresAt;
   
    private BookingStatus status;

    @NotNull(message = "Travel package ID is required")
    private Long travelPackageId;

    private Long userId;
    private String customerName;
    private String customerEmail;
    private String packageTitle;
}
