package org.telusco.travelbookingweb.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.AdminPaymentResponseDto;
import org.telusco.travelbookingweb.service.PaymentService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {
    
    private final PaymentService paymentService;

    public AdminPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<AdminPaymentResponseDto> getAllPaymentsForAdmin() {
        return paymentService.getAllPaymentsForAdmin();
    }

    @GetMapping("/{id}")
    public AdminPaymentResponseDto getPaymentByIdForAdmin(@PathVariable Long id) {
        return paymentService.getPaymentByIdForAdmin(id);
    }
}
