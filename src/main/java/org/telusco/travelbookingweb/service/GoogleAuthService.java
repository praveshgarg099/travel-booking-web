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

    public static String resolveGoogleDisplayName(String name, String givenName, String familyName) {
        if (name != null && !name.trim().isEmpty()) {
            return name.trim();
        }
        StringBuilder sb = new StringBuilder();
        if (givenName != null && !givenName.trim().isEmpty()) {
            sb.append(givenName.trim());
        }
        if (familyName != null && !familyName.trim().isEmpty()) {
            if (!sb.isEmpty()) {
                sb.append(" ");
            }
            sb.append(familyName.trim());
        }
        if (!sb.isEmpty()) {
            return sb.toString();
        }
        return "Google Traveler";
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

            log.warn("[DEV MODE] Bypassing Google token verification with simulated test token");
            String raw = idTokenString.replace("test_google_token_", "").trim();
            String email;
            String simName = null;
            if (raw.contains(":")) {
                String[] parts = raw.split(":", 2);
                simName = parts[0].trim();
                email = parts[1].trim();
            } else {
                email = raw;
            }
            if (email.isEmpty()) email = "googleuser@example.com";
            String resolvedName = (simName != null && !simName.isBlank()) ? simName : "Google Traveler";
            return new GoogleUserInfo("goog_sub_" + Math.abs(email.hashCode()), email, resolvedName, null, true);
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
                String cleanClientId = configuredClientId.trim().replace("\"", "").replace("'", "");
                verifierBuilder.setAudience(Collections.singletonList(cleanClientId));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                log.error("Google ID token verification failed: token is null, expired, or signature invalid");
                throw new InvalidCredentialsException("Google authentication failed. Please try again.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
            String name = (String) payload.get("name");
            String givenName = (String) payload.get("given_name");
            String familyName = (String) payload.get("family_name");
            String pictureUrl = (String) payload.get("picture");

            if (googleId == null || googleId.isBlank()) {
                throw new InvalidCredentialsException("Google authentication failed. Please try again.");
            }

            if (email == null || email.isBlank()) {
                throw new InvalidCredentialsException("Google authentication failed. Please try again.");
            }

            if (!emailVerified) {
                log.warn("Rejected Google sign-in: email {} is not verified on Google's platform", email);
                throw new InvalidCredentialsException("Your Google email could not be verified.");
            }

            String resolvedName = resolveGoogleDisplayName(name, givenName, familyName);

            log.info("Successfully verified Google ID token for email: {}", email);
            return new GoogleUserInfo(googleId, email, resolvedName, pictureUrl, true);
        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during Google ID token verification: {}", e.getMessage(), e);
            throw new InvalidCredentialsException("Google authentication failed. Please try again.");
        }
    }
}
