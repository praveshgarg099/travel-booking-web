package org.telusco.travelbookingweb.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.dto.GoogleLoginRequestDto;
import org.telusco.travelbookingweb.dto.LoginRequestDTO;
import org.telusco.travelbookingweb.dto.LoginResponseDTO;
import org.telusco.travelbookingweb.dto.UserDto;
import org.telusco.travelbookingweb.dto.VerifyEmailRequestDto;
import org.telusco.travelbookingweb.entity.Role;
import org.telusco.travelbookingweb.entity.User;
import org.telusco.travelbookingweb.exception.*;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.UserRepository;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;

    public UserService(
            UserRepository userRepository,
            BookingRepository bookingRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationService authenticationService,
            EmailService emailService,
            GoogleAuthService googleAuthService) {

        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
        this.emailService = emailService;
        this.googleAuthService = googleAuthService;
    }

    // Get all users
    public List<UserDto> getAllUser() {

        return userRepository.findAll()
                .stream()
                .map(user -> {

                    UserDto response = new UserDto();

                    response.setId(user.getId());
                    response.setName(user.getName());
                    response.setEmail(user.getEmail());
                    response.setRole(user.getRole() != null ? user.getRole().name() : null);

                    return response;

                })
                .toList();
    }

    // Create user
    @Transactional(rollbackFor = Exception.class)
    public UserDto createUser(UserDto userDto) {
        String cleanEmail = userDto.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setName(userDto.getName().trim());
        user.setEmail(cleanEmail);
        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setAuthProvider("LOCAL");

        // Generate 6-digit cryptographic OTP code for email verification
        String otpCode = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setVerificationCode(passwordEncoder.encode(otpCode));
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
        user.setVerificationAttempts(0);
        user.setLastVerificationCodeSentAt(LocalDateTime.now());
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        // Dispatch verification email (or log to console in dev mode)
        emailService.sendVerificationOtp(savedUser.getEmail(), savedUser.getName(), otpCode);

        UserDto response = new UserDto();
        response.setId(savedUser.getId());
        response.setName(savedUser.getName());
        response.setEmail(savedUser.getEmail());
        response.setRole(savedUser.getRole().name());
        response.setEmailVerified(savedUser.getEmailVerified());

        return response;
    }

    // Get user by ID
    public UserDto getUserById(Long id) {

        User currentUser = authenticationService.getCurrentUser();

        // User can see only himself.
        // Admin can see anyone.
        if (!currentUser.getId().equals(id)
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to view this user"
            );
        }

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found")
                );

        UserDto response = new UserDto();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole() != null ? user.getRole().name() : null);

        return response;
    }

    // Update user
    public UserDto updateUser(Long id, UserDto userDto) {

        User currentUser = authenticationService.getCurrentUser();

        // User can update only himself.
        // Admin can update anyone.
        if (!currentUser.getId().equals(id)
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to update this user"
            );
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found")
                );

        String cleanEmail = userDto.getEmail() != null ? userDto.getEmail().trim().toLowerCase() : "";
        Optional<User> userWithSameEmail =
                userRepository.findByEmail(cleanEmail);

        if (userWithSameEmail.isPresent()
                && !userWithSameEmail.get().getId().equals(id)) {

            throw new EmailAlreadyExistsException(
                    "Email already exists"
            );
        }

        existingUser.setName(userDto.getName() != null ? userDto.getName().trim() : existingUser.getName());
        existingUser.setEmail(cleanEmail);

        User savedUser = userRepository.save(existingUser);

        UserDto response = new UserDto();

        response.setId(savedUser.getId());
        response.setName(savedUser.getName());
        response.setEmail(savedUser.getEmail());
        response.setRole(savedUser.getRole() != null ? savedUser.getRole().name() : null);

        return response;
    }

    // Delete user
    public void deleteUser(Long id) {

        User currentUser = authenticationService.getCurrentUser();

        // Only admin can delete users
        if (currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to delete this user"
            );
        }

        if (!userRepository.existsById(id)) {

            throw new UserNotFoundException(
                    "User not found"
            );
        }

        userRepository.deleteById(id);
    }

    // Login
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        String cleanEmail = loginRequestDTO.getEmail() != null ? loginRequestDTO.getEmail().trim().toLowerCase() : "";
        User user = userRepository.findByEmail(cleanEmail).orElseThrow(() ->
                new InvalidCredentialsException("Invalid email or password")
        );

        // Check password
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Enforce email verification (must be explicitly true; eliminates null bypass)
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new EmailNotVerifiedException("Your email address is not verified yet. Please enter the verification code sent to your email.");
        }

        // Generate JWT token
        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        LoginResponseDTO response = new LoginResponseDTO();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setToken(token);
        response.setRole(user.getRole().name());
        response.setEmailVerified(user.getEmailVerified());

        return response;
    }

    // Verify Email with 6-digit OTP
    public LoginResponseDTO verifyEmail(VerifyEmailRequestDto request) {
        if (request == null || request.getEmail() == null || request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new InvalidVerificationCodeException("Email and 6-digit verification code are required");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
            return new LoginResponseDTO(user.getId(), user.getName(), user.getEmail(), token, user.getRole().name(), true);
        }

        if (user.getVerificationCode() == null) {
            throw new InvalidVerificationCodeException("No active verification code found for this user. Please request a new code.");
        }

        if (user.getVerificationCodeExpiresAt() == null || user.getVerificationCodeExpiresAt().isBefore(LocalDateTime.now())) {
            user.setVerificationCode(null);
            user.setVerificationCodeExpiresAt(null);
            user.setVerificationAttempts(0);
            userRepository.save(user);
            throw new InvalidVerificationCodeException("Verification code has expired. Please request a new code.");
        }

        int attempts = user.getVerificationAttempts() != null ? user.getVerificationAttempts() : 0;
        if (attempts >= 5) {
            user.setVerificationCode(null);
            user.setVerificationCodeExpiresAt(null);
            user.setVerificationAttempts(0);
            userRepository.save(user);
            throw new InvalidVerificationCodeException("Too many failed verification attempts. This verification code has been invalidated. Please request a new code.");
        }

        // Check hashed OTP code using PasswordEncoder
        if (!passwordEncoder.matches(request.getCode().trim(), user.getVerificationCode())) {
            attempts++;
            user.setVerificationAttempts(attempts);
            if (attempts >= 5) {
                user.setVerificationCode(null);
                user.setVerificationCodeExpiresAt(null);
                user.setVerificationAttempts(0);
                userRepository.save(user);
                throw new InvalidVerificationCodeException("Too many failed verification attempts. This verification code has been invalidated. Please request a new code.");
            }
            userRepository.save(user);
            int remaining = 5 - attempts;
            throw new InvalidVerificationCodeException("Invalid verification code. " + remaining + " attempt(s) remaining.");
        }

        // Successful verification -> immediately invalidate OTP and reset attempts
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        user.setVerificationAttempts(0);
        userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getName());

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new LoginResponseDTO(user.getId(), user.getName(), user.getEmail(), token, user.getRole().name(), true);
    }

    // Resend Email Verification Code with 60-second cooldown
    @Transactional(rollbackFor = Exception.class)
    public String resendVerificationCode(String email) {
        if (email == null || email.isBlank()) {
            throw new UserNotFoundException("Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + cleanEmail));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return "Email is already verified. You can log in directly.";
        }

        // Enforce 60-second cooldown on resending OTP
        if (user.getLastVerificationCodeSentAt() != null
                && user.getLastVerificationCodeSentAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
            long secondsRemaining = java.time.Duration.between(
                    LocalDateTime.now(),
                    user.getLastVerificationCodeSentAt().plusSeconds(60)
            ).getSeconds();
            throw new InvalidVerificationCodeException("Please wait " + Math.max(1, secondsRemaining) + " seconds before requesting another verification code.");
        }

        // Invalidate old code and generate new cryptographically hashed code
        String newOtp = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setVerificationCode(passwordEncoder.encode(newOtp));
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
        user.setVerificationAttempts(0);
        user.setLastVerificationCodeSentAt(LocalDateTime.now());
        userRepository.save(user);

        emailService.sendVerificationOtp(user.getEmail(), user.getName(), newOtp);
        return "A new 6-digit verification code has been sent to " + cleanEmail;
    }

    // Google Sign-In / Sign-Up
    public LoginResponseDTO loginWithGoogle(GoogleLoginRequestDto request) {
        GoogleAuthService.GoogleUserInfo googleUser = googleAuthService.verifyToken(request.getIdToken());

        // Defense: Google email must be verified on Google
        if (!googleUser.emailVerified()) {
            throw new InvalidCredentialsException("Your Google email could not be verified.");
        }

        String email = googleUser.email().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByGoogleId(googleUser.googleId());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(email);
        }

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleUser.googleId());
            }
            user.setEmailVerified(true);
            user = userRepository.save(user);
        } else {
            user = new User();
            user.setName(googleUser.name() != null ? googleUser.name() : "Google Traveler");
            user.setEmail(email);
            user.setRole(Role.USER);
            user.setEmailVerified(true);
            user.setGoogleId(googleUser.googleId());
            user.setAuthProvider("GOOGLE");
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user = userRepository.save(user);

            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new LoginResponseDTO(user.getId(), user.getName(), user.getEmail(), token, user.getRole().name(), true);
    }
}