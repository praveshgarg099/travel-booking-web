package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.telusco.travelbookingweb.config.LegacyUserVerificationMigration;
import org.telusco.travelbookingweb.dto.GoogleLoginRequestDto;
import org.telusco.travelbookingweb.dto.LoginRequestDTO;
import org.telusco.travelbookingweb.dto.LoginResponseDTO;
import org.telusco.travelbookingweb.dto.UserDto;
import org.telusco.travelbookingweb.dto.VerifyEmailRequestDto;
import org.telusco.travelbookingweb.entity.Role;
import org.telusco.travelbookingweb.entity.User;
import org.telusco.travelbookingweb.exception.EmailNotVerifiedException;
import org.telusco.travelbookingweb.exception.InvalidCredentialsException;
import org.telusco.travelbookingweb.exception.InvalidVerificationCodeException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationAndGoogleAuthTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private EmailService emailService;

    @Mock
    private GoogleAuthService googleAuthService;

    @Mock
    private Environment environment;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setName("Kavita Patel");
        testUser.setEmail("kavita@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setRole(Role.USER);
        testUser.setEmailVerified(false);
        testUser.setVerificationCode("hashed_otp_123456");
        testUser.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
        testUser.setVerificationAttempts(0);
        testUser.setLastVerificationCodeSentAt(LocalDateTime.now().minusMinutes(2));
    }

    // =========================================================================
    // 1. REGISTRATION & OTP GENERATION
    // =========================================================================

    @Test
    @DisplayName("createUser generates 6-digit cryptographic OTP, hashes it, sets emailVerified=false, and dispatches email")
    void testCreateUser_GeneratesHashedOtpAndDispatchesEmail() {
        UserDto dto = new UserDto();
        dto.setName("New Traveler");
        dto.setEmail("new@example.com");
        dto.setPassword("Secret@123");

        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Secret@123")).thenReturn("hashedPassword");
        when(passwordEncoder.encode(argThat(s -> s != null && s.toString().matches("\\d{6}")))).thenReturn("hashedOtpCode");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(50L);
            return u;
        });

        UserDto created = userService.createUser(dto);

        assertNotNull(created);
        assertEquals("new@example.com", created.getEmail());
        assertFalse(created.getEmailVerified());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("hashedOtpCode", saved.getVerificationCode());
        assertEquals(0, saved.getVerificationAttempts());
        assertNotNull(saved.getLastVerificationCodeSentAt());
        assertNotNull(saved.getVerificationCodeExpiresAt());
        assertFalse(saved.getEmailVerified());

        verify(emailService).sendVerificationOtp(eq("new@example.com"), eq("New Traveler"), argThat(code -> code != null && code.matches("\\d{6}")));
    }

    // =========================================================================
    // 2. OTP VERIFICATION & BRUTE FORCE DEFENSE
    // =========================================================================

    @Test
    @DisplayName("verifyEmail with valid 6-digit code succeeds, invalidates OTP, sets emailVerified=true, and generates JWT")
    void testVerifyEmail_Success() {
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("123456", "hashed_otp_123456")).thenReturn(true);
        when(jwtService.generateToken("kavita@example.com", "USER")).thenReturn("mock.jwt.token");

        VerifyEmailRequestDto req = new VerifyEmailRequestDto("kavita@example.com", "123456");
        LoginResponseDTO response = userService.verifyEmail(req);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertTrue(response.getEmailVerified());
        assertTrue(testUser.getEmailVerified());
        assertNull(testUser.getVerificationCode(), "OTP must be invalidated after success");
        assertNull(testUser.getVerificationCodeExpiresAt(), "Expiration must be cleared after success");
        assertEquals(0, testUser.getVerificationAttempts());

        verify(userRepository).save(testUser);
        verify(emailService).sendWelcomeEmail("kavita@example.com", "Kavita Patel");
    }

    @Test
    @DisplayName("verifyEmail with incorrect code increments attempt counter and rejects")
    void testVerifyEmail_InvalidCode_IncrementsAttempts() {
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("999999", "hashed_otp_123456")).thenReturn(false);

        VerifyEmailRequestDto req = new VerifyEmailRequestDto("kavita@example.com", "999999");
        InvalidVerificationCodeException ex = assertThrows(InvalidVerificationCodeException.class,
                () -> userService.verifyEmail(req));

        assertTrue(ex.getMessage().contains("4 attempt(s) remaining"));
        assertEquals(1, testUser.getVerificationAttempts());
        assertFalse(testUser.getEmailVerified());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("verifyEmail reaching 5 failed attempts destroys OTP and locks code")
    void testVerifyEmail_BruteForceLockout_DestroysOtp() {
        testUser.setVerificationAttempts(4);
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("000000", "hashed_otp_123456")).thenReturn(false);

        VerifyEmailRequestDto req = new VerifyEmailRequestDto("kavita@example.com", "000000");
        InvalidVerificationCodeException ex = assertThrows(InvalidVerificationCodeException.class,
                () -> userService.verifyEmail(req));

        assertTrue(ex.getMessage().contains("Too many failed verification attempts"));
        assertNull(testUser.getVerificationCode(), "OTP must be cleared on brute-force lockout");
        assertNull(testUser.getVerificationCodeExpiresAt());
        assertFalse(testUser.getEmailVerified());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("verifyEmail with expired code destroys OTP and rejects")
    void testVerifyEmail_ExpiredCode_DestroysOtp() {
        testUser.setVerificationCodeExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));

        VerifyEmailRequestDto req = new VerifyEmailRequestDto("kavita@example.com", "123456");
        assertThrows(InvalidVerificationCodeException.class, () -> userService.verifyEmail(req));
        assertNull(testUser.getVerificationCode());
        assertNull(testUser.getVerificationCodeExpiresAt());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("verifyEmail with already-used OTP (reused) is rejected")
    void testVerifyEmail_ReusedOtp_Rejected() {
        testUser.setVerificationCode(null);
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));

        VerifyEmailRequestDto req = new VerifyEmailRequestDto("kavita@example.com", "123456");
        InvalidVerificationCodeException ex = assertThrows(InvalidVerificationCodeException.class,
                () -> userService.verifyEmail(req));
        assertTrue(ex.getMessage().contains("No active verification code found"));
    }

    // =========================================================================
    // 3. RESEND OTP & COOLDOWN
    // =========================================================================

    @Test
    @DisplayName("resendVerificationCode generates fresh hashed OTP, resets attempts, and sets new expiry")
    void testResendVerificationCode_Success() {
        testUser.setVerificationAttempts(3);
        testUser.setLastVerificationCodeSentAt(LocalDateTime.now().minusSeconds(65));
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(anyString())).thenReturn("new_hashed_otp_987654");

        String result = userService.resendVerificationCode("kavita@example.com");

        assertTrue(result.contains("sent"));
        assertEquals("new_hashed_otp_987654", testUser.getVerificationCode());
        assertEquals(0, testUser.getVerificationAttempts());
        assertNotNull(testUser.getVerificationCodeExpiresAt());
        verify(emailService).sendVerificationOtp(eq("kavita@example.com"), eq("Kavita Patel"), anyString());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("resendVerificationCode enforces 60-second cooldown")
    void testResendVerificationCode_CooldownEnforced() {
        testUser.setLastVerificationCodeSentAt(LocalDateTime.now().minusSeconds(20));
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));

        InvalidVerificationCodeException ex = assertThrows(InvalidVerificationCodeException.class,
                () -> userService.resendVerificationCode("kavita@example.com"));

        assertTrue(ex.getMessage().contains("Please wait"));
        assertTrue(ex.getMessage().contains("seconds"));
        verify(emailService, never()).sendVerificationOtp(anyString(), anyString(), anyString());
    }

    // =========================================================================
    // 4. LOGIN AUTHENTICATION & LEGACY ACCOUNTS
    // =========================================================================

    @Test
    @DisplayName("login by unverified user (emailVerified=false) throws EmailNotVerifiedException")
    void testLogin_UnverifiedUser_ThrowsException() {
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);

        LoginRequestDTO req = new LoginRequestDTO("kavita@example.com", "Password@123");
        assertThrows(EmailNotVerifiedException.class, () -> userService.login(req));
    }

    @Test
    @DisplayName("login with emailVerified=null is rejected as unverified to eliminate permanent bypass")
    void testLogin_NullEmailVerified_Rejected() {
        testUser.setEmailVerified(null);
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);

        LoginRequestDTO req = new LoginRequestDTO("kavita@example.com", "Password@123");
        assertThrows(EmailNotVerifiedException.class, () -> userService.login(req));
    }

    @Test
    @DisplayName("login by verified user (emailVerified=true) succeeds and returns JWT")
    void testLogin_VerifiedUser_Succeeds() {
        testUser.setEmailVerified(true);
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken("kavita@example.com", "USER")).thenReturn("valid.verified.token");

        LoginRequestDTO req = new LoginRequestDTO("kavita@example.com", "Password@123");
        LoginResponseDTO res = userService.login(req);

        assertNotNull(res);
        assertEquals("valid.verified.token", res.getToken());
        assertTrue(res.getEmailVerified());
    }

    @Test
    @DisplayName("LegacyUserVerificationMigration updates legacy null email_verified accounts to true")
    void testLegacyUserVerificationMigration_ExecutesUpdate() {
        when(userRepository.migrateLegacyNullEmailVerified()).thenReturn(5);
        LegacyUserVerificationMigration migration = new LegacyUserVerificationMigration(userRepository);

        migration.run(null);

        verify(userRepository).migrateLegacyNullEmailVerified();
    }

    // =========================================================================
    // 5. GOOGLE SIGN-IN & TOKEN VERIFICATION
    // =========================================================================

    @Test
    @DisplayName("loginWithGoogle creates new user with emailVerified=true if user does not exist")
    void testLoginWithGoogle_NewUser() {
        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_123456", "googletraveler@example.com", "Rohit Google", null, true
        );
        when(googleAuthService.verifyToken("valid_google_id_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_123456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("googletraveler@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("randomHashedPassword");
        when(jwtService.generateToken("googletraveler@example.com", "USER")).thenReturn("google.jwt.token");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_google_id_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals("google.jwt.token", res.getToken());
        assertEquals("googletraveler@example.com", res.getEmail());
        assertTrue(res.getEmailVerified());

        verify(emailService).sendWelcomeEmail("googletraveler@example.com", "Rohit Google");
    }

    @Test
    @DisplayName("loginWithGoogle links Google ID to existing user and marks email verified")
    void testLoginWithGoogle_ExistingUser() {
        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_123456", "kavita@example.com", "Kavita Patel", null, true
        );
        when(googleAuthService.verifyToken("valid_google_id_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_123456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);
        when(jwtService.generateToken("kavita@example.com", "USER")).thenReturn("linked.jwt.token");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_google_id_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals("linked.jwt.token", res.getToken());
        assertEquals("goog_123456", testUser.getGoogleId());
        assertTrue(testUser.getEmailVerified());
    }

    @Test
    @DisplayName("loginWithGoogle rejects Google token if email is unverified on Google's platform")
    void testLoginWithGoogle_UnverifiedGoogleEmail_ThrowsException() {
        GoogleAuthService.GoogleUserInfo unverifiedGUser = new GoogleAuthService.GoogleUserInfo(
                "goog_unverified", "unverified@example.com", "Unverified User", null, false
        );
        when(googleAuthService.verifyToken("token_unverified_email")).thenReturn(unverifiedGUser);

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("token_unverified_email");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> userService.loginWithGoogle(req));

        assertTrue(ex.getMessage().contains("Google email address is not verified"));
        verify(userRepository, never()).save(any(User.class));
    }

    // =========================================================================
    // 6. GOOGLE AUTH SERVICE ENVIRONMENT HARDENING
    // =========================================================================

    @Test
    @DisplayName("GoogleAuthService rejects simulated token when simulation is disabled")
    void testGoogleAuthService_SimulatedTokenDisabled_ThrowsException() {
        GoogleAuthService authService = new GoogleAuthService(environment);
        ReflectionTestUtils.setField(authService, "allowSimulation", false);
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(false);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.verifyToken("test_google_token_test@example.com"));

        assertTrue(ex.getMessage().contains("Simulated Google authentication is disabled"));
    }

    @Test
    @DisplayName("GoogleAuthService rejects simulated token in production environment regardless of flag")
    void testGoogleAuthService_SimulatedTokenInProduction_ThrowsException() {
        GoogleAuthService authService = new GoogleAuthService(environment);
        ReflectionTestUtils.setField(authService, "allowSimulation", true);
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true); // prod profile active

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.verifyToken("test_google_token_test@example.com"));

        assertTrue(ex.getMessage().contains("Simulated Google authentication is disabled"));
    }

    @Test
    @DisplayName("GoogleAuthService allows simulated token only in development when simulation flag is enabled")
    void testGoogleAuthService_SimulatedTokenInDev_Succeeds() {
        GoogleAuthService authService = new GoogleAuthService(environment);
        ReflectionTestUtils.setField(authService, "allowSimulation", true);
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(false); // not prod

        GoogleAuthService.GoogleUserInfo info = authService.verifyToken("test_google_token_traveler@yatramigo.dev");

        assertNotNull(info);
        assertEquals("traveler@yatramigo.dev", info.email());
        assertTrue(info.emailVerified());
    }

    @Test
    @DisplayName("GoogleAuthService in production requires configured Client ID")
    void testGoogleAuthService_ProductionRequiresClientId() {
        GoogleAuthService authService = new GoogleAuthService(environment);
        ReflectionTestUtils.setField(authService, "configuredClientId", "");
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true); // prod profile

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.verifyToken("real_jwt_token_payload_without_client_id"));

        assertTrue(ex.getMessage().contains("Google authentication is not properly configured"));
    }
}
