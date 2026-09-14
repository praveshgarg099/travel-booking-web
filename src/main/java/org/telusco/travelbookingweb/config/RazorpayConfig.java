package org.telusco.travelbookingweb.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    @Value("${razorpay.key.id:}")
    private String keyId;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    @Value("${razorpay.currency:INR}")
    private String currency;

    @Value("${razorpay.order.expiration-minutes:15}")
    private int orderExpirationMinutes;

    public String getKeyId() {
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public String getCurrency() {
        return currency;
    }

    public int getOrderExpirationMinutes() {
        return orderExpirationMinutes;
    }

    public boolean isConfigured() {
        return keyId != null && !keyId.trim().isEmpty() &&
               keySecret != null && !keySecret.trim().isEmpty();
    }

    public RazorpayClient getClient() {
        if (!isConfigured()) {
            throw new IllegalStateException(
                "Razorpay API credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables or configure them in application.properties."
            );
        }
        try {
            return new RazorpayClient(keyId.trim(), keySecret.trim());
        } catch (RazorpayException e) {
            log.error("Failed to initialize RazorpayClient: {}", e.getMessage());
            throw new IllegalStateException("Failed to initialize Razorpay client: " + e.getMessage(), e);
        }
    }
}
