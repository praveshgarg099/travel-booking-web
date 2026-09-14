package org.telusco.travelbookingweb.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.config.RazorpayConfig;
import org.telusco.travelbookingweb.exception.PaymentVerificationException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final RazorpayConfig razorpayConfig;

    public RazorpayService(RazorpayConfig razorpayConfig) {
        this.razorpayConfig = razorpayConfig;
    }

    public String createOrder(long amountPaise, String receiptId) {
        RazorpayClient client = razorpayConfig.getClient();
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", razorpayConfig.getCurrency());
            orderRequest.put("receipt", receiptId);

            Order order = client.orders.create(orderRequest);
            return order.get("id");
        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order for receipt {}: {}", receiptId, e.getMessage());
            throw new PaymentVerificationException("Failed to initiate Razorpay order: " + e.getMessage());
        }
    }

    public boolean verifySignature(String orderId, String paymentId, String providedSignature) {
        if (orderId == null || paymentId == null || providedSignature == null) {
            return false;
        }

        String secret = razorpayConfig.getKeySecret();
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("Razorpay key secret is not configured");
        }

        String payload = orderId + "|" + paymentId;
        String expectedSignature = calculateHmacSha256(payload, secret.trim());

        return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                providedSignature.trim().getBytes(StandardCharsets.UTF_8)
        );
    }

    public boolean verifyWebhookSignature(String payload, String providedSignature) {
        if (payload == null || providedSignature == null) {
            return false;
        }

        String secret = razorpayConfig.getWebhookSecret();
        if (secret == null || secret.trim().isEmpty()) {
            log.warn("Razorpay webhook secret is not configured; cannot verify webhook signature");
            return false;
        }

        String expectedSignature = calculateHmacSha256(payload, secret.trim());
        return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                providedSignature.trim().getBytes(StandardCharsets.UTF_8)
        );
    }

    public com.razorpay.Payment fetchPayment(String paymentId) {
        RazorpayClient client = razorpayConfig.getClient();
        try {
            return client.payments.fetch(paymentId);
        } catch (RazorpayException e) {
            log.error("Failed to fetch Razorpay payment {}: {}", paymentId, e.getMessage());
            throw new PaymentVerificationException("Failed to fetch payment details from Razorpay: " + e.getMessage());
        }
    }

    private String calculateHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new PaymentVerificationException("Failed to compute HMAC-SHA256 signature: " + e.getMessage());
        }
    }
}
