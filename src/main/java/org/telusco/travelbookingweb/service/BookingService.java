package org.telusco.travelbookingweb.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.dto.BookingDto;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.*;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;
import org.telusco.travelbookingweb.repository.UserRepository;
import java.time.LocalDate;

import org.telusco.travelbookingweb.repository.PaymentRepository;


import java.util.List;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final AuthenticationService authenticationService;
    private final PaymentRepository paymentRepository;

    public BookingService(
            BookingRepository bookingRepository,
            TravelPackageRepository travelPackageRepository,
            AuthenticationService authenticationService,
            PaymentRepository paymentRepository) {

        this.bookingRepository = bookingRepository;
        this.travelPackageRepository = travelPackageRepository;
        this.authenticationService = authenticationService;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public BookingDto createBooking(BookingDto bookingDto){
        User user = authenticationService.getCurrentUser();
        if (bookingDto.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Booking date cannot be in the past");
        }
        TravelPackage travelPackage = travelPackageRepository.findById(bookingDto.getTravelPackageId()).orElseThrow(()-> new TravelPackageNotFoundException("Travel Package not found"));
        Double totalAmount = travelPackage.getPrice()*bookingDto.getNumberOfPeople();
        if(travelPackage.getAvailableSeats()<bookingDto.getNumberOfPeople()){
            throw new InsufficientSeatsException("Not enough seats available");
        }
        travelPackage.setAvailableSeats(travelPackage.getAvailableSeats()-bookingDto.getNumberOfPeople());
        travelPackageRepository.save(travelPackage);
        Booking booking = new Booking();
        booking.setNumberOfPeople(bookingDto.getNumberOfPeople());
        booking.setBookingDate(bookingDto.getBookingDate());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setTotalAmount(totalAmount);
        booking.setUser(user);
        booking.setTravelPackage(travelPackage);
        Booking savedBooking = bookingRepository.save(booking);
        BookingDto response = new BookingDto();

        response.setId(savedBooking.getId());
        response.setNumberOfPeople(savedBooking.getNumberOfPeople());
        response.setBookingDate(savedBooking.getBookingDate());
        response.setStatus(savedBooking.getStatus());
        response.setTotalAmount(savedBooking.getTotalAmount());
        //response.setUserId(savedBooking.getUser().getId());
        response.setTravelPackageId(savedBooking.getTravelPackage().getId());
        return response;


    }

    public List<BookingDto> getAllBookings() {

        User currentUser = authenticationService.getCurrentUser();

        List<Booking> bookings;

        if (currentUser.getRole() == Role.ADMIN) {
            bookings = bookingRepository.findAll();
        } else {
            bookings = bookingRepository.findByUserId(currentUser.getId());
        }

        return bookings.stream()
                .map(booking -> {
                    BookingDto dto = new BookingDto();
                    dto.setId(booking.getId());
                    dto.setNumberOfPeople(booking.getNumberOfPeople());
                    dto.setTotalAmount(booking.getTotalAmount());
                    dto.setBookingDate(booking.getBookingDate());
                    dto.setStatus(booking.getStatus());
                    // dto.setUserId(booking.getUser().getId());
                    dto.setTravelPackageId(booking.getTravelPackage().getId());
                    return dto;
                }).toList();
    }
    public BookingDto getBookingById(Long id) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!booking.getUser().getId()
                .equals(currentUser.getId())) {

            throw new ForbiddenException(
                    "You are not allowed to view this booking"
            );
        }

        BookingDto response = new BookingDto();

        response.setId(booking.getId());
        response.setNumberOfPeople(booking.getNumberOfPeople());
        response.setTotalAmount(booking.getTotalAmount());
        response.setBookingDate(booking.getBookingDate());
        response.setStatus(booking.getStatus());
        response.setTravelPackageId(
                booking.getTravelPackage().getId()
        );

        return response;
    }
    @Transactional
    public BookingDto UpdateById(Long id, BookingDto bookingDto) {

        Booking existingBooking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

// Check ownership first
        if (!existingBooking.getUser().getId()
                .equals(currentUser.getId())) {

            throw new ForbiddenException(
                    "You are not allowed to update this booking"
            );
        }

// Check if booking already has a payment
        if (paymentRepository.findByBookingId(id) != null) {
            throw new IllegalArgumentException(
                    "Paid booking cannot be updated"
            );
        }

        if (bookingDto.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Booking date cannot be in the past"
            );
        }

        // 2. Get old and new package
        TravelPackage oldPackage = existingBooking.getTravelPackage();

        TravelPackage newPackage =
                travelPackageRepository.findById(
                                bookingDto.getTravelPackageId()
                        )
                        .orElseThrow(() ->
                                new TravelPackageNotFoundException(
                                        "Travel package not found"
                                ));

        int oldNumberOfPeople =
                existingBooking.getNumberOfPeople();

        int newNumberOfPeople =
                bookingDto.getNumberOfPeople();

        // 3. If package is changed
        if (!oldPackage.getId().equals(newPackage.getId())) {

            // Return old seats
            oldPackage.setAvailableSeats(
                    oldPackage.getAvailableSeats()
                            + oldNumberOfPeople
            );

            // Check new package seats
            if (newPackage.getAvailableSeats()
                    < newNumberOfPeople) {

                throw new InsufficientSeatsException(
                        "Not enough seats available in new travel package"
                );
            }

            // Take seats from new package
            newPackage.setAvailableSeats(
                    newPackage.getAvailableSeats()
                            - newNumberOfPeople
            );

            travelPackageRepository.save(oldPackage);
            travelPackageRepository.save(newPackage);

        } else {

            // 4. Same package → only adjust difference
            int difference =
                    newNumberOfPeople - oldNumberOfPeople;

            if (difference > 0 &&
                    newPackage.getAvailableSeats() < difference) {

                throw new InsufficientSeatsException(
                        "Not enough seats available"
                );
            }

            newPackage.setAvailableSeats(
                    newPackage.getAvailableSeats() - difference
            );

            travelPackageRepository.save(newPackage);
        }

        // 5. Calculate new amount
        double totalAmount =
                newPackage.getPrice() * newNumberOfPeople;

        // 6. Update booking
        existingBooking.setNumberOfPeople(newNumberOfPeople);
        existingBooking.setBookingDate(
                bookingDto.getBookingDate()
        );
        existingBooking.setStatus(BookingStatus.CONFIRMED);
        existingBooking.setTotalAmount(totalAmount);
        existingBooking.setTravelPackage(newPackage);

        bookingRepository.save(existingBooking);

        // 7. Create response
        BookingDto response = new BookingDto();

        response.setId(existingBooking.getId());
        response.setNumberOfPeople(
                existingBooking.getNumberOfPeople()
        );
        response.setTotalAmount(
                existingBooking.getTotalAmount()
        );
        response.setBookingDate(
                existingBooking.getBookingDate()
        );
        response.setStatus(
                existingBooking.getStatus()
        );
        response.setTravelPackageId(
                existingBooking.getTravelPackage().getId()
        );

        return response;
    }
    @Transactional
    public void DeleteBooking(Long id) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException(
                    "You are not allowed to delete this booking"
            );
        }

        TravelPackage travelPackage = booking.getTravelPackage();

        travelPackage.setAvailableSeats(
                travelPackage.getAvailableSeats()
                        + booking.getNumberOfPeople()
        );

        travelPackageRepository.save(travelPackage);
        Payment payment = paymentRepository.findByBookingId(booking.getId());

        if (payment != null) {
            paymentRepository.delete(payment);
        }

        bookingRepository.deleteById(id);
    }


}
