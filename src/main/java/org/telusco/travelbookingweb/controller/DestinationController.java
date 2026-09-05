package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.DestinationDto;
import org.telusco.travelbookingweb.repository.DestinationRepository;
import org.telusco.travelbookingweb.service.DestinationService;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    private final DestinationService destinationService;
    private final DestinationRepository destinationRepository;


    public DestinationController(DestinationService destinationService, DestinationRepository destinationRepository) {
        this.destinationService = destinationService;
        this.destinationRepository = destinationRepository;
    }

    @GetMapping
   public List<DestinationDto> getAllDestination(){
        return destinationService.getAllDestination();
   }

   @GetMapping("/{destinationId}")
   public DestinationDto getDestinationById(@PathVariable Long destinationId){
        return destinationService.getDestinationById(destinationId);
   }
   @PostMapping
   public DestinationDto createDestination(@Valid @RequestBody DestinationDto destinationDto){
        return destinationService.createDestination(destinationDto);
   }

   @PutMapping("/{id}")
    public DestinationDto updateDestination(@PathVariable Long id,@Valid @RequestBody DestinationDto destinationDto){
        return destinationService.updateDestination(id,destinationDto);

   }
   @DeleteMapping("/{id}")
    public void deleteDestination(@PathVariable Long id){
        destinationService.deleteDestination(id);
   }
}
