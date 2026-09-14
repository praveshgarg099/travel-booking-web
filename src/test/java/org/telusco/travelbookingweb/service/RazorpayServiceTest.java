package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.telusco.travelbookingweb.config.RazorpayConfig;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class RazorpayServiceTest {

    private RazorpayConfig razorpayConfig;
    private RazorpayService razorpayService;
    private final String testSecret = "test_rzp_secret_key_123456789";

    @BeforeEach
    void setUp() {
        razorpayConfig = new RazorpayConfig();
        ReflectionTestUtils.setField(razorpayConfig, "keyId", "rzp_test_12345");
        ReflectionTestUtils.setField(razorpayConfig, "keySecret", testSecret);
        ReflectionTestUtils.setField(razorpayConfig, "webhookSecret", "test_webhook_secret_98765");
        ReflectionTestUtils.setField(razorpayConfig, "currency", "INR");
        razorpayService = new RazorpayService(razorpayConfig);
    }

    private String computeHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Signature verification passes for valid HMAC-SHA256 signature")
    void testVerifySignatureSuccess() throws Exception {
        String orderId = "order_OXYZ1234567890";
        String paymentId = "pay_PXYZ0987654321";
        String payload = orderId + "|" + paymentId;
        String validSignature = computeHmac(payload, testSecret);

        boolean result = razorpayService.verifySignature(orderId, paymentId, validSignature);
        assertTrue(result, "Valid signature must verify successfully");
    }

    @Test
    @DisplayName("Signature verification fails for tampered signature")
    void testVerifySignatureTamperedFails() {
        String orderId = "order_OXYZ1234567890";
        String paymentId = "pay_PXYZ0987654321";
        String tamperedSignature = "invalid_signature_hash_value_1234567890abcdef";

        boolean result = razorpayService.verifySignature(orderId, paymentId, tamperedSignature);
        assertFalse(result, "Tampered signature must be rejected");
    }

    @Test
    @DisplayName("Signature verification fails for null arguments safely")
    void testVerifySignatureNullChecks() {
        assertFalse(razorpayService.verifySignature(null, "pay_1", "sig"));
        assertFalse(razorpayService.verifySignature("order_1", null, "sig"));
        assertFalse(razorpayService.verifySignature("order_1", "pay_1", null));
    }

    @Test
    @DisplayName("Webhook signature verification succeeds for matching payload")
    void testVerifyWebhookSignatureSuccess() throws Exception {
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\"}}}}";
        String validWebhookSignature = computeHmac(payload, "test_webhook_secret_98765");

        boolean result = razorpayService.verifyWebhookSignature(payload, validWebhookSignature);
        assertTrue(result, "Valid webhook signature must verify successfully");
    }

    @Test
    @DisplayName("Webhook signature verification fails for tampered payload")
    void testVerifyWebhookSignatureTamperedFails() {
        String payload = "{\"event\":\"payment.captured\"}";
        String invalidSignature = "fake_signature_999999999";

        boolean result = razorpayService.verifyWebhookSignature(payload, invalidSignature);
        assertFalse(result, "Tampered webhook payload must be rejected");
    }
}
