package org.telusco.travelbookingweb.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
            dto.setDestinationId(travelPackage.getDestination().getId());
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
        dto1.setDestinationId(travelPackage.getDestination().getId());
        return dto1;



    }

    public TravelPackageDto createTravelpackage(TravelPackageDto travelPackageDto) {
        Destination destination = destinationRepository.findById(travelPackageDto.getDestinationId()).orElseThrow(()->new DestinationNotFoundException("Destination not found"));

        TravelPackage travelPackage = new TravelPackage();
        travelPackage.setTitle(travelPackageDto.getTitle());
        travelPackage.setDescription(travelPackageDto.getDescription());
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
        responce.setDestinationId(savedPackage.getDestination().getId());
        return responce;


    }

    public TravelPackageDto updateTravelPackage(Long id, TravelPackageDto travelPackageDto){
        TravelPackage existingPackage = travelPackageRepository.findById(id).orElseThrow(()-> new TravelPackageNotFoundException("Travel Packeage not found"));
        Destination destination = destinationRepository.findById(travelPackageDto.getDestinationId()).orElseThrow(()-> new DestinationNotFoundException("Destination not found "));
        existingPackage.setTitle(travelPackageDto.getTitle());
        existingPackage.setDescription(travelPackageDto.getDescription());
        existingPackage.setPrice(travelPackageDto.getPrice());
        existingPackage.setDuration(travelPackageDto.getDuration());
        existingPackage.setDestination(destination);
        TravelPackage savedPackage = travelPackageRepository.save(existingPackage);
        TravelPackageDto responce = new TravelPackageDto();

        responce.setId(savedPackage.getId());
        responce.setTitle(savedPackage.getTitle());
        responce.setDescription(savedPackage.getDescription());
        responce.setPrice(savedPackage.getPrice());
        responce.setDuration(savedPackage.getDuration());
        responce.setAvailableSeats(savedPackage.getAvailableSeats());
        responce.setDestinationId(savedPackage.getDestination().getId());
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
