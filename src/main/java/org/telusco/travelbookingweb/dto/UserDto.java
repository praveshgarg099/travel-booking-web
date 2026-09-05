package org.telusco.travelbookingweb.dto;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDto {
    private Long id;
    @NotNull(message = "Name is required")
    private String name;
    @NotNull(message = "Email is request")
    @Email(message = "Invalid email format")
    private String email;
    @NotNull(message = "Password is requird")
    private String password;
}
