package org.telusco.travelbookingweb.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.dto.DestinationDto;
import org.telusco.travelbookingweb.entity.Destination;
import org.telusco.travelbookingweb.exception.DestinationNotFoundException;
import org.telusco.travelbookingweb.repository.DestinationRepository;

import java.util.List;

@Service
public class DestinationService {

    private final DestinationRepository destinationRepository;

    public DestinationService(DestinationRepository destinationRepository){
        this.destinationRepository = destinationRepository;
    }

    public DestinationDto createDestination(DestinationDto destinationDto){
         Destination destination = new Destination();
         destination.setName(destinationDto.getName());
         destination.setCountry(destinationDto.getCountry());
         destination.setDescription(destinationDto.getDescription());
         Destination savedDestination = destinationRepository.save(destination);

         DestinationDto response = new DestinationDto();
         response.setId(savedDestination.getId());
         response.setName(savedDestination.getName());
         response.setCountry(savedDestination.getCountry());
         response.setDescription(savedDestination.getDescription());
         return response;
    }

    public List<DestinationDto> getAllDestination(){
       List<Destination> destinations = destinationRepository.findAll();
       return destinations.stream().map(destination -> {
           DestinationDto dto = new DestinationDto();
           dto.setId(destination.getId());
           dto.setName(destination.getName());
           dto.setCountry(destination.getCountry());
           dto.setDescription(destination.getDescription());
           return dto;
       }).toList();
    }

    public DestinationDto getDestinationById(Long Id){
       Destination destination = destinationRepository.findById(Id).orElseThrow(()-> new DestinationNotFoundException("Destination is not there"));
       DestinationDto dto = new DestinationDto();
       dto.setId(destination.getId());
       dto.setName(destination.getName());
       dto.setCountry(destination.getCountry());
       dto.setDescription(destination.getDescription());
       return dto;
    }

    public DestinationDto updateDestination(Long id, DestinationDto destinationDto){
        Destination existingDestination = destinationRepository.findById(id).orElseThrow(()-> new DestinationNotFoundException(("Destination not found")));
        existingDestination.setName(destinationDto.getName());
        existingDestination.setCountry(destinationDto.getCountry());
        existingDestination.setDescription(destinationDto.getDescription());
        Destination savedDestination = destinationRepository.save(existingDestination);

        DestinationDto response = new DestinationDto();
        response.setId(savedDestination.getId());
        response.setName(savedDestination.getName());
        response.setCountry(savedDestination.getCountry());
        response.setDescription(savedDestination.getDescription());
        return response;
    }
    public void deleteDestination(Long id){
        Destination existingDestination = destinationRepository.findById(id).orElseThrow(()-> new DestinationNotFoundException("destination is not found"));
        destinationRepository.delete(existingDestination);
    }

}
