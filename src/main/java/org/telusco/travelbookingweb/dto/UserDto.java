package org.telusco.travelbookingweb.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private String role;
}
