package org.telusco.travelbookingweb.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewDTO {

    private Long id;
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot be greater than 5")
    private Integer rating;

    @NotBlank(message = "Comment is required")
    private String comment;
    private Long userId;

    @NotNull(message = "Travel package ID is required")
    private Long travelPackageId;

    private String customerName;
    private String packageTitle;
}
