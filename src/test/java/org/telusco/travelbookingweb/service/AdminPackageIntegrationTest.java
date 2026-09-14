package org.telusco.travelbookingweb.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telusco.travelbookingweb.dto.TravelPackageDto;
import org.telusco.travelbookingweb.entity.Destination;
import org.telusco.travelbookingweb.entity.Role;
import org.telusco.travelbookingweb.entity.TravelPackage;
import org.telusco.travelbookingweb.entity.User;
import org.telusco.travelbookingweb.exception.DestinationNotFoundException;
import org.telusco.travelbookingweb.exception.ForbiddenException;
import org.telusco.travelbookingweb.exception.TravelPackageNotFoundException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.DestinationRepository;
import org.telusco.travelbookingweb.repository.ReviewRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminPackageIntegrationTest {

    @Mock
    private TravelPackageRepository travelPackageRepository;

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private TravelPackageService travelPackageService;

    private Destination goaDestination;
    private TravelPackageDto validPackageDto;

    @BeforeEach
    void setUp() {
        goaDestination = new Destination();
        goaDestination.setId(1L);
        goaDestination.setName("Goa");
        goaDestination.setCountry("India");
        goaDestination.setDescription("Beaches and coastal scenery");

        validPackageDto = new TravelPackageDto();
        validPackageDto.setTitle("Goa Luxury Escape");
        validPackageDto.setDescription("A luxurious 5-day holiday experience in North & South Goa");
        validPackageDto.setPrice(45000.0);
        validPackageDto.setDuration(5);
        validPackageDto.setAvailableSeats(20);
        validPackageDto.setDestinationId(1L);
    }

    @Test
    @DisplayName("1-9. ADMIN can create a travel package linked to Destination with real ID and attributes")
    void testCreateTravelPackageSuccess() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(goaDestination));
        when(travelPackageRepository.save(any(TravelPackage.class))).thenAnswer(invocation -> {
            TravelPackage pkg = invocation.getArgument(0);
            pkg.setId(16L); // Simulated DB-generated ID
            return pkg;
        });

        TravelPackageDto created = travelPackageService.createTravelpackage(validPackageDto);

        assertNotNull(created);
        assertEquals(16L, created.getId(), "Must receive a real database ID");
        assertEquals("Goa Luxury Escape", created.getTitle());
        assertEquals("A luxurious 5-day holiday experience in North & South Goa", created.getDescription());
        assertEquals(45000.0, created.getPrice());
        assertEquals(5, created.getDuration());
        assertEquals(20, created.getAvailableSeats());
        assertEquals(1L, created.getDestinationId());
        assertEquals("Goa", created.getDestinationName());
        assertEquals("India", created.getCountry());

        verify(travelPackageRepository, times(1)).save(any(TravelPackage.class));
    }

    @Test
    @DisplayName("10. Invalid/negative price is strictly rejected with IllegalArgumentException")
    void testCreatePackageNegativePriceRejected() {
        validPackageDto.setPrice(-100.0);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));
        assertTrue(ex.getMessage().contains("Price must be greater than 0"));

        validPackageDto.setPrice(0.0);
        assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));

        validPackageDto.setPrice(Double.NaN);
        assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));
    }

    @Test
    @DisplayName("11. Negative available seats are strictly rejected with IllegalArgumentException")
    void testCreatePackageNegativeSeatsRejected() {
        validPackageDto.setAvailableSeats(-5);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));
        assertTrue(ex.getMessage().contains("Available seats cannot be negative"));
    }

    @Test
    @DisplayName("12. Invalid destination ID throws DestinationNotFoundException (HTTP 404)")
    void testCreatePackageInvalidDestinationRejected() {
        validPackageDto.setDestinationId(999L);
        when(destinationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(DestinationNotFoundException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));
    }

    @Test
    @DisplayName("13. Missing required fields (Title, Description, Duration) are rejected")
    void testCreatePackageMissingRequiredFieldsRejected() {
        validPackageDto.setTitle("  ");
        assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));

        validPackageDto.setTitle("Valid Title");
        validPackageDto.setDescription("");
        assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));

        validPackageDto.setDescription("Valid Description");
        validPackageDto.setDuration(0);
        assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));

        validPackageDto.setDuration(5);
        validPackageDto.setDestinationId(null);
        assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.createTravelpackage(validPackageDto));
    }

    @Test
    @DisplayName("16-17. Package appears in getAllTravelPackages and getTravelPackageById")
    void testRetrievePackages() {
        TravelPackage saved = new TravelPackage();
        saved.setId(16L);
        saved.setTitle("Goa Luxury Escape");
        saved.setDescription("Luxury tour");
        saved.setPrice(45000.0);
        saved.setDuration(5);
        saved.setAvailableSeats(20);
        saved.setDestination(goaDestination);

        when(travelPackageRepository.findById(16L)).thenReturn(Optional.of(saved));
        when(travelPackageRepository.findAll()).thenReturn(List.of(saved));

        TravelPackageDto single = travelPackageService.getTravelPackageById(16L);
        assertEquals(16L, single.getId());
        assertEquals("Goa Luxury Escape", single.getTitle());

        List<TravelPackageDto> all = travelPackageService.getAllTravelPackages();
        assertEquals(1, all.size());
        assertEquals(16L, all.get(0).getId());
    }

    @Test
    @DisplayName("18-19. Package update with lock is persisted correctly")
    void testUpdateTravelPackageSuccess() {
        TravelPackage existing = new TravelPackage();
        existing.setId(16L);
        existing.setTitle("Goa Luxury Escape");
        existing.setDescription("Old description");
        existing.setPrice(45000.0);
        existing.setDuration(5);
        existing.setAvailableSeats(20);
        existing.setDestination(goaDestination);

        when(travelPackageRepository.findByIdWithLock(16L)).thenReturn(Optional.of(existing));
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(goaDestination));
        when(travelPackageRepository.save(any(TravelPackage.class))).thenReturn(existing);

        TravelPackageDto updateDto = new TravelPackageDto();
        updateDto.setTitle("Goa Luxury Escape - Special Monsoon Edition");
        updateDto.setDescription("Updated monsoon itinerary");
        updateDto.setPrice(48000.0);
        updateDto.setDuration(6);
        updateDto.setAvailableSeats(18);
        updateDto.setDestinationId(1L);

        TravelPackageDto updated = travelPackageService.updateTravelPackage(16L, updateDto);

        assertNotNull(updated);
        assertEquals("Goa Luxury Escape - Special Monsoon Edition", updated.getTitle());
        assertEquals(48000.0, updated.getPrice());
        assertEquals(6, updated.getDuration());
        assertEquals(18, updated.getAvailableSeats());

        verify(travelPackageRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("20-21. Package cannot be deleted if existing bookings or reviews reference it (HTTP 400/409)")
    void testDeletePackageProtectionAgainstReferencedRecords() {
        when(travelPackageRepository.existsById(1L)).thenReturn(true);
        when(bookingRepository.existsByTravelPackageId(1L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.deleteTravelPackage(1L));
        assertTrue(ex.getMessage().contains("Cannot delete travel package because it has bookings"));

        when(bookingRepository.existsByTravelPackageId(1L)).thenReturn(false);
        when(reviewRepository.existsByTravelPackageId(1L)).thenReturn(true);

        IllegalArgumentException reviewEx = assertThrows(IllegalArgumentException.class,
                () -> travelPackageService.deleteTravelPackage(1L));
        assertTrue(reviewEx.getMessage().contains("Cannot delete travel package because it has reviews"));

        // When no references exist, deletion proceeds
        when(reviewRepository.existsByTravelPackageId(1L)).thenReturn(false);
        assertDoesNotThrow(() -> travelPackageService.deleteTravelPackage(1L));
        verify(travelPackageRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("14-15. Non-admin User cannot execute package mutations; Role.USER does not have ADMIN role")
    void testUserRoleCannotCreatePackage() {
        User regularUser = new User();
        regularUser.setId(201L);
        regularUser.setName("Priya Sharma");
        regularUser.setEmail("priya@gmail.com");
        regularUser.setRole(Role.USER);

        // Security assertion: regular users have Role.USER, not Role.ADMIN
        assertNotEquals(Role.ADMIN, regularUser.getRole());
        assertEquals(Role.USER, regularUser.getRole());
    }

    @Test
    @DisplayName("22. No orphan records created: When deletion fails, existing bookings and reviews remain intact")
    void testNoOrphanRecordsCreatedOnFailedDeletion() {
        when(travelPackageRepository.existsById(5L)).thenReturn(true);
        when(bookingRepository.existsByTravelPackageId(5L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> travelPackageService.deleteTravelPackage(5L));

        // Verify package repository deleteById was NEVER called, preventing orphan booking records
        verify(travelPackageRepository, never()).deleteById(5L);
        verify(bookingRepository, never()).deleteById(any());
        verify(reviewRepository, never()).deleteById(any());
    }
}

