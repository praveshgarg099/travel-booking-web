package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.TravelPackageDto;
import org.telusco.travelbookingweb.service.TravelPackageService;

import java.util.List;

@RestController
@RequestMapping("/api/travel-packages")
public class TravelController {
    private final TravelPackageService travelPackageService;

    public TravelController(TravelPackageService travelPackageService) {
        this.travelPackageService = travelPackageService;
    }
    @GetMapping
    public List<TravelPackageDto> getAllTravelPackages(){
        return travelPackageService.getAllTravelPackages();
    }
    @GetMapping("/{id}")
    public TravelPackageDto getTravelPackagesById(@PathVariable Long id ){
        return travelPackageService.getTravelPackageById(id);
    }
    @PostMapping
    public TravelPackageDto createTravelPackage(@Valid @RequestBody TravelPackageDto travelPackageDto){
        return travelPackageService.createTravelpackage(travelPackageDto);
    }
    @PutMapping("/{id}")
    public TravelPackageDto updateTravelPackage(@PathVariable Long id ,@Valid @RequestBody TravelPackageDto travelPackageDto){
        return travelPackageService.updateTravelPackage(id,travelPackageDto);
    }

    @DeleteMapping("/{id}")
    public void deleteTravelPackage(@PathVariable Long id){
        travelPackageService.deleteTravelPackage(id);
    }

}
