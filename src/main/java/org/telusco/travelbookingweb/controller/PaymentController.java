package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.PaymentDto;
import org.telusco.travelbookingweb.dto.RazorpayOrderRequestDto;
import org.telusco.travelbookingweb.dto.RazorpayOrderResponseDto;
import org.telusco.travelbookingweb.dto.RazorpayVerificationRequestDto;
import org.telusco.travelbookingweb.dto.RazorpayVerificationResponseDto;
import org.telusco.travelbookingweb.service.PaymentService;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<RazorpayOrderResponseDto> createOrder(@Valid @RequestBody RazorpayOrderRequestDto request) {
        return ResponseEntity.ok(paymentService.createPaymentOrder(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<RazorpayVerificationResponseDto> verifyPayment(@Valid @RequestBody RazorpayVerificationRequestDto request) {
        return ResponseEntity.ok(paymentService.verifyPayment(request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.processWebhook(payload, signature);
        return ResponseEntity.ok("Webhook processed successfully");
    }

    @PostMapping
    public PaymentDto createPayment(@Valid @RequestBody PaymentDto paymentDto) {
        return paymentService.createPayment(paymentDto);
    }

    @GetMapping
    public List<PaymentDto> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @DeleteMapping("/{id}")
    public String deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return "Payment deleted successfully";
    }

    @GetMapping("/{id}")
    public PaymentDto getPaymentById(@PathVariable Long id) {
        return paymentService.getPaymentById(id);
    }
}
