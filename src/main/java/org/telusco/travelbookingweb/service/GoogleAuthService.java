package org.telusco.travelbookingweb.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.exception.InvalidCredentialsException;

import java.util.Collections;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    private final Environment environment;

    @Value("${google.client.id:}")
    private String configuredClientId;

    @Value("${app.auth.allow-simulation:false}")
    private boolean allowSimulation;

    public GoogleAuthService(Environment environment) {
        this.environment = environment;
    }

    public record GoogleUserInfo(
            String googleId,
            String email,
            String name,
            String pictureUrl,
            boolean emailVerified
    ) {}

    public boolean isProductionEnvironment() {
        return environment != null && environment.acceptsProfiles(Profiles.of("prod", "production"));
    }

    public GoogleUserInfo verifyToken(String idTokenString) {
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new InvalidCredentialsException("Google ID token cannot be empty");
        }

        // Development bypass / simulation support - strictly gated
        if (idTokenString.startsWith("test_google_token_")) {
            if (isProductionEnvironment() || !allowSimulation) {
                log.error("Attempted to use simulated Google token in disallowed environment (prod={} / allowSimulation={})",
                        isProductionEnvironment(), allowSimulation);
                throw new InvalidCredentialsException("Simulated Google authentication is disabled in this environment.");
            }

            log.warn("[DEV MODE] Bypassing Google token verification with simulated test token: {}", idTokenString);
            String email = idTokenString.replace("test_google_token_", "").trim();
            if (email.isEmpty()) email = "googleuser@example.com";
            return new GoogleUserInfo("goog_sub_" + Math.abs(email.hashCode()), email, "Google Traveler", null, true);
        }

        // In production, Google Client ID must be explicitly configured
        if (isProductionEnvironment() && (configuredClientId == null || configuredClientId.trim().isEmpty())) {
            log.error("Google OAuth2 Client ID is not configured in production environment.");
            throw new InvalidCredentialsException("Google authentication is not properly configured in this environment.");
        }

        try {
            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance()
            );

            if (configuredClientId != null && !configuredClientId.trim().isEmpty()) {
                verifierBuilder.setAudience(Collections.singletonList(configuredClientId.trim()));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                log.error("Google ID token verification failed: token is null, expired, or signature invalid");
                throw new InvalidCredentialsException("Invalid Google ID token or cryptographic signature verification failed.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            if (googleId == null || googleId.isBlank()) {
                throw new InvalidCredentialsException("Google ID token does not contain a valid subject/user ID.");
            }

            if (email == null || email.isBlank()) {
                throw new InvalidCredentialsException("Google ID token does not contain an email address.");
            }

            if (!emailVerified) {
                log.warn("Rejected Google sign-in: email {} is not verified on Google's platform", email);
                throw new InvalidCredentialsException("Google email address is not verified by Google.");
            }

            log.info("Successfully verified Google ID token for email: {}", email);
            return new GoogleUserInfo(googleId, email, name, pictureUrl, true);
        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during Google ID token verification: {}", e.getMessage(), e);
            throw new InvalidCredentialsException("Google authentication failed: " + e.getMessage());
        }
    }
}
