package org.telusco.travelbookingweb.service;


import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.entity.PaymentStatus;
import org.telusco.travelbookingweb.exception.*;
import org.telusco.travelbookingweb.dto.PaymentDto;
import org.telusco.travelbookingweb.entity.Booking;
import org.telusco.travelbookingweb.entity.Payment;
import org.telusco.travelbookingweb.entity.User;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final AuthenticationService authenticationService;

    public PaymentService(PaymentRepository paymentRepository, BookingRepository bookingRepository, AuthenticationService authenticationService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.authenticationService = authenticationService;
    }

    public PaymentDto createPayment(PaymentDto paymentDto){
        User currentUser = authenticationService.getCurrentUser();
        Booking booking = bookingRepository.findById(paymentDto.getBookingId())
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        if (!booking.getUser().getId()
                .equals(currentUser.getId())) {

            throw new ForbiddenException(
                    "You are not allowed to make payment for this booking"
            );
        }
        if (paymentRepository.existsByBookingId(booking.getId())) {
            throw new PaymentAlreadyExistsException("Payment already exists for this booking");
        }

        Payment payment = new Payment();
        payment.setAmount(booking.getTotalAmount());
        payment.setPaymentMethod(paymentDto.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setBooking(booking);

        Payment savesdPayment = paymentRepository.save(payment);

        PaymentDto responce = new PaymentDto();
        responce.setId(savesdPayment.getId());
        responce.setAmount(savesdPayment.getAmount());
        responce.setPaymentMethod(savesdPayment.getPaymentMethod());
        responce.setStatus(savesdPayment.getStatus());
        responce.setPaymentDate(savesdPayment.getPaymentDate());
        responce.setBookingId(savesdPayment.getBooking().getId());

        return responce;
    }
    public List<PaymentDto> getAllPayments() {

        User currentUser = authenticationService.getCurrentUser();

        return paymentRepository.findByBookingUserId(currentUser.getId())
                .stream()
                .map(payment -> {

                    PaymentDto response = new PaymentDto();

                    response.setId(payment.getId());
                    response.setAmount(payment.getAmount());
                    response.setPaymentMethod(payment.getPaymentMethod());
                    response.setStatus(payment.getStatus());
                    response.setPaymentDate(payment.getPaymentDate());
                    response.setBookingId(payment.getBooking().getId());

                    return response;
                })
                .toList();
    }
    public void deletePayment(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() ->
                        new PaymentNotFoundException("Payment not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!payment.getBooking().getUser().getId()
                .equals(currentUser.getId())) {

            throw new ForbiddenException(
                    "You are not allowed to delete this payment"
            );
        }

        paymentRepository.delete(payment);
    }
    public PaymentDto getPaymentById(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() ->
                        new PaymentNotFoundException("Payment not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!payment.getBooking().getUser().getId()
                .equals(currentUser.getId())) {

            throw new ForbiddenException(
                    "You are not allowed to view this payment"
            );
        }

        PaymentDto response = new PaymentDto();

        response.setId(payment.getId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setStatus(payment.getStatus());
        response.setPaymentDate(payment.getPaymentDate());
        response.setBookingId(payment.getBooking().getId());

        return response;
    }

}
