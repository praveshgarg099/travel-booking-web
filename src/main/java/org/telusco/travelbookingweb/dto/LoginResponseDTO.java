package org.telusco.travelbookingweb.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponseDTO {

    private Long id;
    private String name;
    private String email;
    private String token;
}