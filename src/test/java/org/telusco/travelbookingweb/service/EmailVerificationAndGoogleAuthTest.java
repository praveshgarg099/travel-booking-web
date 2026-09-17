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

    @Test
    @DisplayName("createUser propagates EmailDeliveryException safely when email dispatch fails")
    void testCreateUser_SmtpFailure_ThrowsEmailDeliveryException() {
        UserDto dto = new UserDto();
        dto.setName("New Traveler");
        dto.setEmail("smtpfail@example.com");
        dto.setPassword("Secret@123");

        when(userRepository.findByEmail("smtpfail@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Secret@123")).thenReturn("hashedPassword");
        when(passwordEncoder.encode(argThat(s -> s != null && s.toString().matches("\\d{6}")))).thenReturn("hashedOtpCode");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new org.telusco.travelbookingweb.exception.EmailDeliveryException("Unable to send verification email. Please try again later."))
                .when(emailService).sendVerificationOtp(eq("smtpfail@example.com"), eq("New Traveler"), anyString());

        assertThrows(org.telusco.travelbookingweb.exception.EmailDeliveryException.class,
                () -> userService.createUser(dto));
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

    @Test
    @DisplayName("resendVerificationCode propagates EmailDeliveryException when email dispatch fails")
    void testResendVerificationCode_SmtpFailure_ThrowsEmailDeliveryException() {
        testUser.setLastVerificationCodeSentAt(LocalDateTime.now().minusSeconds(65));
        when(userRepository.findByEmail("kavita@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(anyString())).thenReturn("new_hashed_otp");
        doThrow(new org.telusco.travelbookingweb.exception.EmailDeliveryException("Unable to send verification email. Please try again later."))
                .when(emailService).sendVerificationOtp(eq("kavita@example.com"), eq("Kavita Patel"), anyString());

        assertThrows(org.telusco.travelbookingweb.exception.EmailDeliveryException.class,
                () -> userService.resendVerificationCode("kavita@example.com"));
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

        assertTrue(ex.getMessage().contains("Your Google email could not be verified"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("loginWithGoogle links Google ID to existing ADMIN user and preserves ADMIN role and original ID")
    void testLoginWithGoogle_ExistingAdminUser_PreservesAdminRoleAndId() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setName("Platform Admin");
        adminUser.setEmail("admin@yatramigo.dev");
        adminUser.setRole(Role.ADMIN);
        adminUser.setEmailVerified(true);
        adminUser.setAuthProvider("LOCAL");

        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_admin_sub_999", "admin@yatramigo.dev", "Platform Admin", null, true
        );
        when(googleAuthService.verifyToken("valid_admin_google_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_admin_sub_999")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@yatramigo.dev")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(adminUser)).thenReturn(adminUser);
        when(jwtService.generateToken("admin@yatramigo.dev", "ADMIN")).thenReturn("admin.jwt.token");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_admin_google_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals(1L, res.getId(), "Original user ID must be preserved");
        assertEquals("ADMIN", res.getRole(), "ADMIN role must be preserved upon Google account linking");
        assertEquals("admin.jwt.token", res.getToken());
        assertEquals("goog_admin_sub_999", adminUser.getGoogleId());
        assertTrue(adminUser.getEmailVerified());
    }

    @Test
    @DisplayName("loginWithGoogle with existing Google ID avoids duplicate user creation and issues JWT")
    void testLoginWithGoogle_ExistingGoogleId_NoDuplicateCreated() {
        testUser.setGoogleId("goog_existing_sub_888");
        testUser.setEmailVerified(true);

        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_existing_sub_888", "kavita@example.com", "Kavita Patel", null, true
        );
        when(googleAuthService.verifyToken("valid_google_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_existing_sub_888")).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);
        when(jwtService.generateToken("kavita@example.com", "USER")).thenReturn("existing.google.jwt");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_google_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals(testUser.getId(), res.getId());
        assertEquals("existing.google.jwt", res.getToken());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("loginWithGoogle sets verified Google name for new user")
    void testLoginWithGoogle_NewUser_SetsVerifiedGoogleName() {
        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_pravesh_1", "pravesh.new@example.com", "Pravesh Garg", null, true
        );
        when(googleAuthService.verifyToken("token_pravesh")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_pravesh_1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("pravesh.new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(jwtService.generateToken("pravesh.new@example.com", "USER")).thenReturn("jwt_pravesh");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(101L);
            return u;
        });

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("token_pravesh");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals("Pravesh Garg", res.getName(), "Response name must be verified Google name");
        assertEquals("pravesh.new@example.com", res.getEmail());
        verify(emailService).sendWelcomeEmail("pravesh.new@example.com", "Pravesh Garg");
    }

    @Test
    @DisplayName("resolveGoogleDisplayName handles name, fallback to given+family name, and safe default")
    void testGoogleDisplayNameResolution_AllScenarios() {
        // 1. Direct name claim present
        assertEquals("Pravesh Garg", GoogleAuthService.resolveGoogleDisplayName("Pravesh Garg", "Pravesh", "Garg"));

        // 2. Name claim is null -> fall back to given + family name
        assertEquals("Pravesh Garg", GoogleAuthService.resolveGoogleDisplayName(null, "Pravesh", "Garg"));

        // 3. Name claim is blank -> fall back to given + family name
        assertEquals("Pravesh Garg", GoogleAuthService.resolveGoogleDisplayName("   ", "Pravesh", "Garg"));

        // 4. Only given_name present
        assertEquals("Pravesh", GoogleAuthService.resolveGoogleDisplayName(null, "Pravesh", null));

        // 5. Only family_name present
        assertEquals("Garg", GoogleAuthService.resolveGoogleDisplayName(null, null, "Garg"));

        // 6. All claims missing -> safe fallback
        assertEquals("Google Traveler", GoogleAuthService.resolveGoogleDisplayName(null, null, null));
        assertEquals("Google Traveler", GoogleAuthService.resolveGoogleDisplayName("  ", "  ", "  "));
    }

    @Test
    @DisplayName("loginWithGoogle preserves existing meaningful user name upon Google account linking")
    void testLoginWithGoogle_ExistingUser_PreservesMeaningfulCustomName() {
        User existingUser = new User();
        existingUser.setId(55L);
        existingUser.setName("Pravesh Garg");
        existingUser.setEmail("pravesh@custom.com");
        existingUser.setRole(Role.USER);
        existingUser.setEmailVerified(true);

        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_custom_55", "pravesh@custom.com", "Different Google Name", null, true
        );
        when(googleAuthService.verifyToken("valid_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_custom_55")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("pravesh@custom.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(jwtService.generateToken("pravesh@custom.com", "USER")).thenReturn("jwt_existing");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals(55L, res.getId());
        assertEquals("Pravesh Garg", res.getName(), "Existing custom name must NOT be overwritten");
        assertEquals("Pravesh Garg", existingUser.getName());
    }

    @Test
    @DisplayName("loginWithGoogle replaces generic 'Google Traveler' placeholder with verified Google name")
    void testLoginWithGoogle_ExistingUser_ReplacesGoogleTravelerPlaceholderWithVerifiedName() {
        User existingUser = new User();
        existingUser.setId(19L);
        existingUser.setName("Google Traveler");
        existingUser.setEmail("pravesh.10022004@gmail.com");
        existingUser.setRole(Role.USER);
        existingUser.setEmailVerified(true);
        existingUser.setGoogleId("goog_sub_55125441");

        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_sub_55125441", "pravesh.10022004@gmail.com", "Pravesh Garg", null, true
        );
        when(googleAuthService.verifyToken("valid_pravesh_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_sub_55125441")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(jwtService.generateToken("pravesh.10022004@gmail.com", "USER")).thenReturn("jwt_token_19");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_pravesh_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals(19L, res.getId(), "User ID must be preserved");
        assertEquals("Pravesh Garg", res.getName(), "Generic placeholder 'Google Traveler' must be replaced with verified Google name");
        assertEquals("Pravesh Garg", existingUser.getName());
        assertEquals("USER", res.getRole());
    }

    @Test
    @DisplayName("loginWithGoogle replaces null or blank name on existing user with verified Google name")
    void testLoginWithGoogle_ExistingUser_ReplacesNullOrBlankNameWithVerifiedName() {
        User existingUser = new User();
        existingUser.setId(22L);
        existingUser.setName(null);
        existingUser.setEmail("traveler.blank@example.com");
        existingUser.setRole(Role.USER);
        existingUser.setEmailVerified(true);

        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_blank_22", "traveler.blank@example.com", "Pravesh Garg", null, true
        );
        when(googleAuthService.verifyToken("valid_token")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_blank_22")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("traveler.blank@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(jwtService.generateToken("traveler.blank@example.com", "USER")).thenReturn("jwt_22");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("valid_token");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals("Pravesh Garg", res.getName());
        assertEquals("Pravesh Garg", existingUser.getName());
    }

    @Test
    @DisplayName("loginWithGoogle sets fallback name from given and family name for new user when full name claim is missing")
    void testLoginWithGoogle_NewUser_FallbackGivenAndFamilyName() {
        String fallbackName = GoogleAuthService.resolveGoogleDisplayName(null, "Pravesh", "Garg");
        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_pravesh_fallback", "pravesh.fallback@example.com", fallbackName, null, true
        );
        when(googleAuthService.verifyToken("token_fallback")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_pravesh_fallback")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("pravesh.fallback@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(jwtService.generateToken("pravesh.fallback@example.com", "USER")).thenReturn("jwt_fallback");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(102L);
            return u;
        });

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("token_fallback");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals("Pravesh Garg", res.getName(), "Name resolved from given_name + family_name must be used");
        assertEquals("pravesh.fallback@example.com", res.getEmail());
    }

    @Test
    @DisplayName("loginWithGoogle safely falls back to 'Google Traveler' when all name fields are missing")
    void testLoginWithGoogle_NewUser_AllNameFieldsMissing_FallsBackToGoogleTraveler() {
        String fallbackName = GoogleAuthService.resolveGoogleDisplayName(null, null, null);
        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_noname", "noname@example.com", fallbackName, null, true
        );
        when(googleAuthService.verifyToken("token_noname")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_noname")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("noname@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(jwtService.generateToken("noname@example.com", "USER")).thenReturn("jwt_noname");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(103L);
            return u;
        });

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("token_noname");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals("Google Traveler", res.getName(), "Should fall back to 'Google Traveler' only when all claims are absent");
    }

    @Test
    @DisplayName("loginWithGoogle linking preserves user ID, role, password, and existing relationships")
    void testLoginWithGoogle_ExistingUser_PreservesAllCoreAttributes() {
        User existingUser = new User();
        existingUser.setId(77L);
        existingUser.setName("Google Traveler");
        existingUser.setEmail("existing.traveler@example.com");
        existingUser.setPassword("secureExistingHashedPassword_xyz123");
        existingUser.setRole(Role.USER);
        existingUser.setEmailVerified(true);

        GoogleAuthService.GoogleUserInfo gUser = new GoogleAuthService.GoogleUserInfo(
                "goog_77", "existing.traveler@example.com", "Pravesh Garg", null, true
        );
        when(googleAuthService.verifyToken("token_77")).thenReturn(gUser);
        when(userRepository.findByGoogleId("goog_77")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("existing.traveler@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(jwtService.generateToken("existing.traveler@example.com", "USER")).thenReturn("jwt_77");

        GoogleLoginRequestDto req = new GoogleLoginRequestDto("token_77");
        LoginResponseDTO res = userService.loginWithGoogle(req);

        assertNotNull(res);
        assertEquals(77L, res.getId(), "User ID must strictly be preserved");
        assertEquals("USER", res.getRole(), "User role must strictly be preserved");
        assertEquals("Pravesh Garg", res.getName(), "Placeholder name must be replaced by verified Google name");
        assertEquals("secureExistingHashedPassword_xyz123", existingUser.getPassword(), "User password must be preserved");
        assertEquals("goog_77", existingUser.getGoogleId(), "Google ID must be linked");
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

    @Test
    @DisplayName("GoogleAuthService rejects null or blank tokens")
    void testGoogleAuthService_NullOrBlankToken_ThrowsException() {
        GoogleAuthService authService = new GoogleAuthService(environment);
        assertThrows(InvalidCredentialsException.class, () -> authService.verifyToken(null));
        assertThrows(InvalidCredentialsException.class, () -> authService.verifyToken("   "));
    }

    @Test
    @DisplayName("GoogleAuthService rejects malformed token with signature verification failure")
    void testGoogleAuthService_MalformedToken_ThrowsException() {
        GoogleAuthService authService = new GoogleAuthService(environment);
        ReflectionTestUtils.setField(authService, "allowSimulation", false);
        ReflectionTestUtils.setField(authService, "configuredClientId", "test-client-id.apps.googleusercontent.com");

        assertThrows(InvalidCredentialsException.class,
                () -> authService.verifyToken("eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalidSignature"));
    }

    @Test
    @DisplayName("createUser method declares @Transactional(rollbackFor = Exception.class) for atomic registration rollback")
    void testCreateUser_TransactionalRollbackConfigured() throws NoSuchMethodException {
        var method = UserService.class.getMethod("createUser", UserDto.class);
        var transactional = method.getAnnotation(org.springframework.transaction.annotation.Transactional.class);
        assertNotNull(transactional, "createUser must be annotated with @Transactional");
        assertEquals(Exception.class, transactional.rollbackFor()[0], "rollbackFor must be Exception.class");
    }

    @Test
    @DisplayName("GlobalExceptionHandler maps EmailDeliveryException to HTTP 503 with safe user message")
    void testGlobalExceptionHandler_EmailDeliveryException_Returns503() {
        org.telusco.travelbookingweb.exception.GlobalExceptionHandler handler =
                new org.telusco.travelbookingweb.exception.GlobalExceptionHandler();
        var ex = new org.telusco.travelbookingweb.exception.EmailDeliveryException("Internal SMTP host connection timed out");
        var response = handler.handleEmailDeliveryException(ex);

        assertNotNull(response);
        assertEquals(503, response.getStatus());
        assertEquals("Unable to send verification email. Please try again later.", response.getMessage());
    }
}
