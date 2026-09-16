package org.telusco.travelbookingweb.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(nullable = false, unique = true)
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "verification_code_expires_at")
    private LocalDateTime verificationCodeExpiresAt;

    @Column(name = "verification_attempts")
    private Integer verificationAttempts = 0;

    @Column(name = "last_verification_code_sent_at")
    private LocalDateTime lastVerificationCodeSentAt;

    @Column(name = "google_id")
    private String googleId;

    @Column(name = "auth_provider")
    private String authProvider = "LOCAL";
}
