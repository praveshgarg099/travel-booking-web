package org.telusco.travelbookingweb.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.dto.TravelPackageDto;
import org.telusco.travelbookingweb.entity.Destination;
import org.telusco.travelbookingweb.entity.TravelPackage;
import org.telusco.travelbookingweb.exception.DestinationNotFoundException;
import org.telusco.travelbookingweb.exception.TravelPackageNotFoundException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.DestinationRepository;
import org.telusco.travelbookingweb.repository.ReviewRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;

import java.util.List;

@Service
@Transactional
public class TravelPackageService {
    private final TravelPackageRepository travelPackageRepository;
    private final DestinationRepository destinationRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    public TravelPackageService(TravelPackageRepository travelPackageRepository, DestinationRepository destinationRepository, BookingRepository bookingRepository, ReviewRepository reviewRepository) {
        this.travelPackageRepository = travelPackageRepository;
        this.destinationRepository = destinationRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<TravelPackageDto> getAllTravelPackages(){
        return travelPackageRepository.findAll().stream().map( travelPackage -> {
            TravelPackageDto dto = new TravelPackageDto();
            dto.setId(travelPackage.getId());
            dto.setTitle(travelPackage.getTitle());
            dto.setDescription(travelPackage.getDescription());
            dto.setPrice(travelPackage.getPrice());
            dto.setDuration(travelPackage.getDuration());
            dto.setAvailableSeats(travelPackage.getAvailableSeats());
            if (travelPackage.getDestination() != null) {
                dto.setDestinationId(travelPackage.getDestination().getId());
                dto.setDestinationName(travelPackage.getDestination().getName());
                dto.setCountry(travelPackage.getDestination().getCountry());
            }
            return dto;
        }).toList();

    }

    public TravelPackageDto getTravelPackageById(Long id){
        TravelPackage travelPackage = travelPackageRepository.findById(id).orElseThrow(()-> new TravelPackageNotFoundException(
                "Travel package not found"));
        TravelPackageDto dto1 = new TravelPackageDto();
        dto1.setId(travelPackage.getId());
        dto1.setTitle(travelPackage.getTitle());
        dto1.setDescription(travelPackage.getDescription());
        dto1.setPrice(travelPackage.getPrice());
        dto1.setDuration(travelPackage.getDuration());
        dto1.setAvailableSeats(travelPackage.getAvailableSeats());
        if (travelPackage.getDestination() != null) {
            dto1.setDestinationId(travelPackage.getDestination().getId());
            dto1.setDestinationName(travelPackage.getDestination().getName());
            dto1.setCountry(travelPackage.getDestination().getCountry());
        }
        return dto1;
    }

    public TravelPackageDto createTravelpackage(TravelPackageDto travelPackageDto) {
        if (travelPackageDto.getDestinationId() == null) {
            throw new IllegalArgumentException("Destination ID is required");
        }
        if (travelPackageDto.getTitle() == null || travelPackageDto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (travelPackageDto.getDescription() == null || travelPackageDto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (travelPackageDto.getPrice() == null || travelPackageDto.getPrice() <= 0 || travelPackageDto.getPrice().isNaN() || travelPackageDto.getPrice().isInfinite()) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        if (travelPackageDto.getDuration() == null || travelPackageDto.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be greater than 0");
        }
        if (travelPackageDto.getAvailableSeats() == null || travelPackageDto.getAvailableSeats() < 0) {
            throw new IllegalArgumentException("Available seats cannot be negative");
        }

        Destination destination = destinationRepository.findById(travelPackageDto.getDestinationId())
                .orElseThrow(() -> new DestinationNotFoundException("Destination not found with ID: " + travelPackageDto.getDestinationId()));

        TravelPackage travelPackage = new TravelPackage();
        travelPackage.setTitle(travelPackageDto.getTitle().trim());
        travelPackage.setDescription(travelPackageDto.getDescription().trim());
        travelPackage.setPrice(travelPackageDto.getPrice());
        travelPackage.setDuration(travelPackageDto.getDuration());
        travelPackage.setAvailableSeats(travelPackageDto.getAvailableSeats());
        travelPackage.setDestination(destination);
        TravelPackage savedPackage = travelPackageRepository.save(travelPackage);

        TravelPackageDto responce = new TravelPackageDto();
        responce.setId(savedPackage.getId());
        responce.setTitle(savedPackage.getTitle());
        responce.setDescription(savedPackage.getDescription());
        responce.setPrice(savedPackage.getPrice());
        responce.setDuration(savedPackage.getDuration());
        responce.setAvailableSeats(savedPackage.getAvailableSeats());
        if (savedPackage.getDestination() != null) {
            responce.setDestinationId(savedPackage.getDestination().getId());
            responce.setDestinationName(savedPackage.getDestination().getName());
            responce.setCountry(savedPackage.getDestination().getCountry());
        }
        return responce;
    }

    public TravelPackageDto updateTravelPackage(Long id, TravelPackageDto travelPackageDto) {
        if (travelPackageDto.getDestinationId() == null) {
            throw new IllegalArgumentException("Destination ID is required");
        }
        if (travelPackageDto.getTitle() == null || travelPackageDto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (travelPackageDto.getDescription() == null || travelPackageDto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (travelPackageDto.getPrice() == null || travelPackageDto.getPrice() <= 0 || travelPackageDto.getPrice().isNaN() || travelPackageDto.getPrice().isInfinite()) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        if (travelPackageDto.getDuration() == null || travelPackageDto.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be greater than 0");
        }
        if (travelPackageDto.getAvailableSeats() == null || travelPackageDto.getAvailableSeats() < 0) {
            throw new IllegalArgumentException("Available seats cannot be negative");
        }

        TravelPackage existingPackage = travelPackageRepository.findByIdWithLock(id)
                .orElseThrow(() -> new TravelPackageNotFoundException("Travel package not found with ID: " + id));
        Destination destination = destinationRepository.findById(travelPackageDto.getDestinationId())
                .orElseThrow(() -> new DestinationNotFoundException("Destination not found with ID: " + travelPackageDto.getDestinationId()));

        existingPackage.setTitle(travelPackageDto.getTitle().trim());
        existingPackage.setDescription(travelPackageDto.getDescription().trim());
        existingPackage.setPrice(travelPackageDto.getPrice());
        existingPackage.setDuration(travelPackageDto.getDuration());
        existingPackage.setDestination(destination);
        existingPackage.setAvailableSeats(travelPackageDto.getAvailableSeats());

        TravelPackage savedPackage = travelPackageRepository.save(existingPackage);
        TravelPackageDto responce = new TravelPackageDto();

        responce.setId(savedPackage.getId());
        responce.setTitle(savedPackage.getTitle());
        responce.setDescription(savedPackage.getDescription());
        responce.setPrice(savedPackage.getPrice());
        responce.setDuration(savedPackage.getDuration());
        responce.setAvailableSeats(savedPackage.getAvailableSeats());
        if (savedPackage.getDestination() != null) {
            responce.setDestinationId(savedPackage.getDestination().getId());
            responce.setDestinationName(savedPackage.getDestination().getName());
            responce.setCountry(savedPackage.getDestination().getCountry());
        }
        return responce;
    }

    public void deleteTravelPackage(Long id) {

        if (!travelPackageRepository.existsById(id)) {
            throw new TravelPackageNotFoundException(
                    "Travel Package not found"
            );
        }

        if (bookingRepository.existsByTravelPackageId(id)) {
            throw new IllegalArgumentException(
                    "Cannot delete travel package because it has bookings"
            );
        }

        if (reviewRepository.existsByTravelPackageId(id)) {
            throw new IllegalArgumentException(
                    "Cannot delete travel package because it has reviews"
            );
        }

        travelPackageRepository.deleteById(id);
    }
}
