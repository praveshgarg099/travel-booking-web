package org.telusco.travelbookingweb.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class TravelPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    @Positive
    private Double price;

    @NotNull
    @Positive
    private Integer duration;

    @NotNull
    @Min(0)
    private Integer availableSeats;

    @ManyToOne
    @JoinColumn (name = "destination_id")
    private Destination destination;


}
