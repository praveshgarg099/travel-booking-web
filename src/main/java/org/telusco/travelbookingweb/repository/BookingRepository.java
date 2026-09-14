package org.telusco.travelbookingweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.telusco.travelbookingweb.entity.Booking;

import org.telusco.travelbookingweb.entity.BookingStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {
    List<Booking> findByUserId(Long userId);
    boolean existsByTravelPackageId(Long travelPackageId);
    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime dateTime);
}
