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
        TravelPackage travelPackage = travelPackageRepository.findByIdWithLock(bookingDto.getTravelPackageId())
                .orElseThrow(() -> new TravelPackageNotFoundException("Travel Package not found"));

        if (travelPackage.getAvailableSeats() < bookingDto.getNumberOfPeople()) {
            throw new InsufficientSeatsException("Not enough seats available");
        }

        java.math.BigDecimal price = java.math.BigDecimal.valueOf(travelPackage.getPrice());
        java.math.BigDecimal people = java.math.BigDecimal.valueOf(bookingDto.getNumberOfPeople());
        java.math.BigDecimal total = price.multiply(people);
        Double totalAmount = total.doubleValue();

        travelPackage.setAvailableSeats(travelPackage.getAvailableSeats() - bookingDto.getNumberOfPeople());
        travelPackageRepository.save(travelPackage);

        Booking booking = new Booking();
        booking.setNumberOfPeople(bookingDto.getNumberOfPeople());
        booking.setBookingDate(bookingDto.getBookingDate());
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(15));
        booking.setTotalAmount(totalAmount);
        booking.setUser(user);
        booking.setTravelPackage(travelPackage);
        Booking savedBooking = bookingRepository.save(booking);
        return mapToDto(savedBooking);
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
                .map(this::mapToDto)
                .toList();
    }

    public BookingDto getBookingById(Long id) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!booking.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to view this booking"
            );
        }

        return mapToDto(booking);
    }

    @Transactional
    public BookingDto UpdateById(Long id, BookingDto bookingDto) {

        Booking existingBooking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

        // Check ownership or ADMIN
        if (!existingBooking.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {

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

        // 5. Calculate new amount using BigDecimal for financial precision
        java.math.BigDecimal price = java.math.BigDecimal.valueOf(newPackage.getPrice());
        java.math.BigDecimal people = java.math.BigDecimal.valueOf(newNumberOfPeople);
        double totalAmount = price.multiply(people).doubleValue();

        // 6. Update booking (status remains PENDING_PAYMENT / existing status - never auto-confirmed without payment)
        existingBooking.setNumberOfPeople(newNumberOfPeople);
        existingBooking.setBookingDate(
                bookingDto.getBookingDate()
        );
        // Do NOT set status to CONFIRMED without payment!
        existingBooking.setTotalAmount(totalAmount);
        existingBooking.setTravelPackage(newPackage);

        bookingRepository.save(existingBooking);

        // 7. Create response
        return mapToDto(existingBooking);
    }

    @Transactional
    public BookingDto cancelBooking(Long id) {
        Booking booking = bookingRepository.findByIdWithLock(id)
                .or(() -> bookingRepository.findById(id))
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

        boolean isOwner = booking.getUser() != null && booking.getUser().getId().equals(currentUser.getId());
        if (!isOwner && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not allowed to cancel this booking");
        }

        boolean hasSuccessPayment = paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS);
        if ((hasSuccessPayment || booking.getStatus() == BookingStatus.CONFIRMED) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only administrators can cancel or void confirmed reservations");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }

        if (booking.getTravelPackage() != null) {
            TravelPackage travelPackage = travelPackageRepository.findByIdWithLock(booking.getTravelPackage().getId())
                    .or(() -> travelPackageRepository.findById(booking.getTravelPackage().getId()))
                    .orElse(booking.getTravelPackage());

            travelPackage.setAvailableSeats(
                    travelPackage.getAvailableSeats() + booking.getNumberOfPeople()
            );
            travelPackageRepository.save(travelPackage);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);

        List<Payment> payments = paymentRepository.findAllByBookingId(booking.getId());
        for (Payment payment : payments) {
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setUpdatedAt(java.time.LocalDateTime.now());
                paymentRepository.save(payment);
            }
        }

        return mapToDto(updatedBooking);
    }

    @Transactional
    public void DeleteBooking(Long id) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new BookingNotFoundException("Booking not found"));

        User currentUser = authenticationService.getCurrentUser();

        boolean isOwner = booking.getUser() != null && booking.getUser().getId().equals(currentUser.getId());
        if (!isOwner && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException(
                    "You are not allowed to delete this booking"
            );
        }

        boolean hasSuccessPayment = paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS);
        if (hasSuccessPayment || booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new InvalidPaymentStateException(
                    "Cannot permanently delete a confirmed or paid booking. Financial audit records must be preserved. Please cancel or void the booking instead."
            );
        }

        // Only restore seats if the booking was not already CANCELLED (prevents double seat release)
        if (booking.getStatus() != BookingStatus.CANCELLED) {
            TravelPackage travelPackage = booking.getTravelPackage();
            if (travelPackage != null) {
                travelPackage.setAvailableSeats(
                        travelPackage.getAvailableSeats() + booking.getNumberOfPeople()
                );
                travelPackageRepository.save(travelPackage);
            }
        }

        List<Payment> payments = paymentRepository.findAllByBookingId(booking.getId());
        List<Payment> nonFinalizedPayments = payments.stream()
                .filter(p -> p.getStatus() != PaymentStatus.SUCCESS)
                .toList();

        if (!nonFinalizedPayments.isEmpty()) {
            paymentRepository.deleteAll(nonFinalizedPayments);
            paymentRepository.flush();
        }

        bookingRepository.deleteById(id);
    }

    private BookingDto mapToDto(Booking booking) {
        BookingDto dto = new BookingDto();
        dto.setId(booking.getId());
        dto.setNumberOfPeople(booking.getNumberOfPeople());
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setBookingDate(booking.getBookingDate());
        dto.setExpiresAt(booking.getExpiresAt());
        dto.setStatus(booking.getStatus());
        if (booking.getTravelPackage() != null) {
            dto.setTravelPackageId(booking.getTravelPackage().getId());
            dto.setPackageTitle(booking.getTravelPackage().getTitle());
        }
        if (booking.getUser() != null) {
            dto.setUserId(booking.getUser().getId());
            dto.setCustomerName(booking.getUser().getName());
            dto.setCustomerEmail(booking.getUser().getEmail());
        }
        return dto;
    }
}
