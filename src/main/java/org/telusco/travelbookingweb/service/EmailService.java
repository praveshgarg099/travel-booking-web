package org.telusco.travelbookingweb.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.exception.EmailDeliveryException;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final Environment environment;

    @Value("${MAIL_FROM:${mail.from.address:}}")
    private String configuredFromAddress;

    @Value("${mail.from.name:Yatramigo}")
    private String fromName;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.email.dev-otp-logging:false}")
    private boolean devOtpLogging;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider, Environment environment) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.environment = environment;
    }

    public boolean isProductionEnvironment() {
        return environment != null && environment.acceptsProfiles(Profiles.of("prod", "production"));
    }

    public boolean isMailConfigured() {
        return mailSender != null && mailUsername != null && !mailUsername.trim().isEmpty();
    }

    /**
     * Resolves an effective sender address that is strictly compatible with the authenticated SMTP account.
     * If MAIL_FROM is explicitly set to a custom verified address, it is used.
     * Otherwise, if using authenticated SMTP (e.g. Gmail), it defaults to spring.mail.username to avoid
     * '553 Sender address rejected' errors.
     */
    public String getEffectiveFromAddress() {
        if (configuredFromAddress != null && !configuredFromAddress.trim().isEmpty()
                && !configuredFromAddress.contains("yatramigo.dev")) {
            return configuredFromAddress.trim();
        }
        if (mailUsername != null && !mailUsername.trim().isEmpty()) {
            return mailUsername.trim();
        }
        return "no-reply@yatramigo.com";
    }

    /**
     * Dispatches a 6-digit email verification OTP code.
     * Fails safely with EmailDeliveryException if SMTP is unavailable or dispatch fails.
     */
    public void sendVerificationOtp(String toEmail, String userName, String otpCode) {
        log.info("Attempting verification email delivery to configured recipient");

        if (!isMailConfigured()) {
            if (isProductionEnvironment() || !devOtpLogging) {
                log.error("SMTP mail credentials are not configured. Cannot deliver verification email.");
                throw new EmailDeliveryException("Unable to send verification email. Please try again later.");
            }

            // Safe dev-only logging when explicitly enabled in local development
            log.warn("================================================================================");
            log.warn(" [DEV MODE / SMTP UNCONFIGURED]");
            log.warn(" Email Verification Code for {}: >>> {} <<< (Valid for 15 minutes)", toEmail, otpCode);
            log.warn(" Configure SPRING_MAIL_USERNAME & SPRING_MAIL_PASSWORD to send real SMTP emails.");
            log.warn("================================================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String effectiveSender = getEffectiveFromAddress();
            helper.setFrom(effectiveSender, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Verify your Yatramigo account");

            String htmlContent = buildOtpHtml(userName, otpCode);
            String plainText = buildOtpPlainText(userName, otpCode);
            helper.setText(plainText, htmlContent);

            mailSender.send(message);
            log.info("Verification email successfully dispatched to configured recipient");
        } catch (MailException | MessagingException e) {
            log.error("SMTP verification email delivery failed: {}", e.getClass().getSimpleName());
            throw new EmailDeliveryException("Unable to send verification email. Please try again later.", e);
        } catch (Exception e) {
            log.error("Unexpected error during verification email delivery: {}", e.getClass().getSimpleName());
            throw new EmailDeliveryException("Unable to send verification email. Please try again later.", e);
        }
    }

    /**
     * Dispatches a confirmation email after successful account verification.
     */
    public void sendWelcomeEmail(String toEmail, String userName) {
        if (!isMailConfigured()) {
            log.info("Welcome email delivery skipped (mail unconfigured)");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());

            helper.setFrom(getEffectiveFromAddress(), fromName);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Yatramigo - Your Journey Begins!");

            String html = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
                      <h2 style="color: #1e3a8a; margin-top: 0;">Welcome to Yatramigo, %s!</h2>
                      <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your account is now fully verified. You can explore curated tour packages, book dream destinations, and download travel vouchers anytime.</p>
                      <p style="color: #64748b; font-size: 13px;">Happy travels,<br>The Yatramigo Team</p>
                    </div>
                    """.formatted(userName != null && !userName.isBlank() ? userName : "Traveler");

            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Welcome email delivery notice: {}", e.getClass().getSimpleName());
        }
    }

    /**
     * Safe service-level diagnostic for verifying JavaMailSender connectivity and authentication.
     */
    public boolean testSmtpConnection() throws MessagingException {
        if (!isMailConfigured()) {
            throw new IllegalStateException("SMTP credentials are not configured");
        }
        if (mailSender instanceof JavaMailSenderImpl impl) {
            impl.testConnection();
            log.info("SMTP connection and authentication diagnostic succeeded");
            return true;
        }
        return false;
    }

    private String buildOtpPlainText(String userName, String otpCode) {
        String greeting = (userName != null && !userName.isBlank()) ? userName : "Traveler";
        return """
                Welcome to Yatramigo!

                Hello %s,

                Your email verification code is:
                %s

                This code expires in 15 minutes.

                If you did not create this account, you can ignore this email.

                Happy travels,
                The Yatramigo Team
                """.formatted(greeting, otpCode);
    }

    private String buildOtpHtml(String userName, String otpCode) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Verify Your Email</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="100%%" max-width="560px" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                          <!-- Header -->
                          <tr>
                            <td style="background-color: #1e3a8a; padding: 28px 36px; text-align: center;">
                              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">YATRAMIGO</h1>
                              <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px;">Travel Booking & Tours</p>
                            </td>
                          </tr>
                          <!-- Body -->
                          <tr>
                            <td style="padding: 36px;">
                              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">Verify Your Email Address</h2>
                              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                                Welcome to Yatramigo!<br><br>
                                Hello %s,<br>
                                Thank you for creating an account with Yatramigo. To complete your registration and secure your account, please enter the 6-digit verification code below:
                              </p>
                              <!-- OTP Box -->
                              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 28px 0;">
                                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e3a8a;">%s</span>
                              </div>
                              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                                ⏱️ This code will expire in <strong>15 minutes</strong>.
                              </p>
                              <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px;">
                                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                                  If you did not create this account, you can ignore this email.
                                </p>
                              </div>
                            </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #f8fafc; padding: 20px 36px; text-align: center; border-top: 1px solid #f1f5f9;">
                              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                &copy; %d Yatramigo Travel Technologies Pvt. Ltd. All rights reserved.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                userName != null && !userName.isBlank() ? userName : "Traveler",
                otpCode,
                java.time.Year.now().getValue()
        );
    }
}
