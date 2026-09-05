package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.BookingDto;
import org.telusco.travelbookingweb.service.BookingService;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
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
    @DeleteMapping("/{id}")
    public void DeleteBooking(@PathVariable Long id){
        bookingService.DeleteBooking(id);

    }
}
