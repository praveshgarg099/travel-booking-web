package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.PaymentDto;
import org.telusco.travelbookingweb.service.PaymentService;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentDto createPayment(@Valid @RequestBody PaymentDto paymentDto){
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
