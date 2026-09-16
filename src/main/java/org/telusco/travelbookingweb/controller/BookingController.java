package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.telusco.travelbookingweb.dto.BookingDto;
import org.telusco.travelbookingweb.service.BookingService;
import org.telusco.travelbookingweb.service.PdfVoucherService;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    
    private final BookingService bookingService;
    private final PdfVoucherService pdfVoucherService;

    public BookingController(BookingService bookingService, PdfVoucherService pdfVoucherService) {
        this.bookingService = bookingService;
        this.pdfVoucherService = pdfVoucherService;
    }

    @GetMapping
    public List<BookingDto> getAllBooking(){
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public BookingDto getBookingById(@PathVariable Long id){
        return bookingService.getBookingById(id);
    }

    @PostMapping
    public BookingDto createBooking(@Valid @RequestBody BookingDto bookingDto){
        return bookingService.createBooking(bookingDto);
    }
    @PutMapping("/{id}")
    public BookingDto updateById(@PathVariable Long id ,@Valid @RequestBody BookingDto bookingDto){
        return bookingService.UpdateById(id,bookingDto);
    }
    @PatchMapping("/{id}/cancel")
    public BookingDto cancelBooking(@PathVariable Long id){
        return bookingService.cancelBooking(id);
    }

    @DeleteMapping("/{id}")
    public void DeleteBooking(@PathVariable Long id){
        bookingService.DeleteBooking(id);
    }

    @GetMapping(value = "/{id}/voucher", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadVoucher(@PathVariable Long id) {
        byte[] pdfBytes = pdfVoucherService.generateBookingVoucherPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"yatramigo-voucher-BKG" + id + ".pdf\"")
                .header(HttpHeaders.CACHE_CONTROL, "must-revalidate, post-check=0, pre-check=0")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
