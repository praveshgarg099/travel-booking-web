package org.telusco.travelbookingweb.dto;

import jakarta.validation.constraints.NotBlank;

public class DestinationDto {

    private Long id;

    @NotBlank(message = "name is required")
    private String name;
    @NotBlank(message = "country is required")
    private String country;
    @NotBlank(message = "description is required")
    private String description;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        return "DestinationDto{" +
                "name='" + name + '\'' +
                ", country='" + country + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}
