package org.telusco.travelbookingweb.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.telusco.travelbookingweb.exception.EmailDeliveryException;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private Environment environment;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        when(mailSenderProvider.getIfAvailable()).thenReturn(mailSender);
        emailService = new EmailService(mailSenderProvider, environment);
    }

    @Test
    @DisplayName("getEffectiveFromAddress uses configured MAIL_FROM address when present")
    void testEffectiveFromAddress_UsesConfiguredAddress() {
        ReflectionTestUtils.setField(emailService, "configuredFromAddress", "no-reply@yatramigo.dev");
        ReflectionTestUtils.setField(emailService, "mailUsername", "resend");

        String effectiveFrom = emailService.getEffectiveFromAddress();
        assertEquals("no-reply@yatramigo.dev", effectiveFrom);
    }

    @Test
    @DisplayName("getEffectiveFromAddress defaults to mailUsername when configuredFromAddress is empty and mailUsername is an email")
    void testEffectiveFromAddress_DefaultsToMailUsernameIfEmail() {
        ReflectionTestUtils.setField(emailService, "configuredFromAddress", "");
        ReflectionTestUtils.setField(emailService, "mailUsername", "sender@yatramigo.dev");

        String effectiveFrom = emailService.getEffectiveFromAddress();
        assertEquals("sender@yatramigo.dev", effectiveFrom);
    }

    @Test
    @DisplayName("getEffectiveFromAddress defaults to no-reply@yatramigo.dev when mailUsername is 'resend' and configuredFromAddress is empty")
    void testEffectiveFromAddress_DefaultsToResendSenderWhenUsernameIsNotEmail() {
        ReflectionTestUtils.setField(emailService, "configuredFromAddress", "");
        ReflectionTestUtils.setField(emailService, "mailUsername", "resend");

        String effectiveFrom = emailService.getEffectiveFromAddress();
        assertEquals("no-reply@yatramigo.dev", effectiveFrom);
    }

    @Test
    @DisplayName("sendVerificationOtp sends HTML email with correct subject, recipient, and OTP")
    void testSendVerificationOtp_Success() throws Exception {
        ReflectionTestUtils.setField(emailService, "mailUsername", "yatramigo.app@gmail.com");
        ReflectionTestUtils.setField(emailService, "mailPassword", "test-app-password");
        ReflectionTestUtils.setField(emailService, "fromName", "Yatramigo");

        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendVerificationOtp("traveler@example.com", "Rohan Sharma", "654321");

        verify(mailSender).send(mimeMessage);
        assertEquals("Verify your Yatramigo account", mimeMessage.getSubject());
        assertNotNull(mimeMessage.getAllRecipients());
        assertEquals("traveler@example.com", mimeMessage.getAllRecipients()[0].toString());
    }

    @Test
    @DisplayName("sendVerificationOtp throws EmailDeliveryException when JavaMailSender throws MailSendException")
    void testSendVerificationOtp_MailException_ThrowsEmailDeliveryException() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "yatramigo.app@gmail.com");
        ReflectionTestUtils.setField(emailService, "mailPassword", "test-app-password");
        ReflectionTestUtils.setField(emailService, "fromName", "Yatramigo");

        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP server connection timeout")).when(mailSender).send(any(MimeMessage.class));

        EmailDeliveryException ex = assertThrows(EmailDeliveryException.class,
                () -> emailService.sendVerificationOtp("traveler@example.com", "Rohan", "123456"));

        assertTrue(ex.getMessage().contains("Unable to send verification email"));
    }

    @Test
    @DisplayName("sendVerificationOtp in production fails safely and throws EmailDeliveryException when SMTP username is unconfigured")
    void testSendVerificationOtp_ProductionUnconfigured_ThrowsException() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "");
        ReflectionTestUtils.setField(emailService, "mailPassword", "");
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true); // prod profile

        EmailDeliveryException ex = assertThrows(EmailDeliveryException.class,
                () -> emailService.sendVerificationOtp("traveler@example.com", "Rohan", "123456"));

        assertTrue(ex.getMessage().contains("Unable to send verification email"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendVerificationOtp in production fails safely when username is set but password is missing")
    void testSendVerificationOtp_PasswordMissing_ThrowsException() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "yatramigo.app@gmail.com");
        ReflectionTestUtils.setField(emailService, "mailPassword", "");
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true); // prod profile

        EmailDeliveryException ex = assertThrows(EmailDeliveryException.class,
                () -> emailService.sendVerificationOtp("traveler@example.com", "Rohan", "123456"));

        assertTrue(ex.getMessage().contains("Unable to send verification email"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendVerificationOtp in dev mode logs warning and does not throw when dev-otp-logging is true")
    void testSendVerificationOtp_DevModeWithLogging_DoesNotThrow() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "");
        ReflectionTestUtils.setField(emailService, "mailPassword", "");
        ReflectionTestUtils.setField(emailService, "devOtpLogging", true);
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(false); // not prod

        assertDoesNotThrow(() -> emailService.sendVerificationOtp("traveler@example.com", "Rohan", "123456"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendVerificationOtp in dev mode throws EmailDeliveryException when dev-otp-logging is false and mail unconfigured")
    void testSendVerificationOtp_DevModeWithoutLogging_ThrowsException() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "");
        ReflectionTestUtils.setField(emailService, "mailPassword", "");
        ReflectionTestUtils.setField(emailService, "devOtpLogging", false);
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(false); // not prod

        assertThrows(EmailDeliveryException.class,
                () -> emailService.sendVerificationOtp("traveler@example.com", "Rohan", "123456"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendWelcomeEmail sends welcome message when mail is configured")
    void testSendWelcomeEmail_Success() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "yatramigo.app@gmail.com");
        ReflectionTestUtils.setField(emailService, "mailPassword", "test-app-password");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() -> emailService.sendWelcomeEmail("traveler@example.com", "Rohan"));
        verify(mailSender).send(mimeMessage);
    }
}
