package org.telusco.travelbookingweb.service;

import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.dto.ReviewDTO;
import org.telusco.travelbookingweb.entity.Review;
import org.telusco.travelbookingweb.entity.Role;
import org.telusco.travelbookingweb.entity.User;
import org.telusco.travelbookingweb.entity.TravelPackage;
import org.telusco.travelbookingweb.exception.*;
import org.telusco.travelbookingweb.repository.ReviewRepository;
import org.telusco.travelbookingweb.repository.TravelPackageRepository;
import java.util.Optional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final AuthenticationService authenticationService;
    private final org.telusco.travelbookingweb.repository.BookingRepository bookingRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         TravelPackageRepository travelPackageRepository,
                         AuthenticationService authenticationService,
                         org.telusco.travelbookingweb.repository.BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.travelPackageRepository = travelPackageRepository;
        this.authenticationService = authenticationService;
        this.bookingRepository = bookingRepository;
    }

    public ReviewDTO createReview(ReviewDTO reviewDTO) {

        User user = authenticationService.getCurrentUser();

        TravelPackage travelPackage =
                travelPackageRepository.findById(
                        reviewDTO.getTravelPackageId()
                ).orElseThrow(() ->
                        new TravelPackageNotFoundException(
                                "Travel Package not found"));

        if (reviewRepository.existsByUserIdAndTravelPackageId(
                user.getId(),
                travelPackage.getId())) {

            throw new ReviewAlreadyExistsException(
                    "You have already reviewed this travel package");
        }

        // Verified Traveler enforcement: Ensure user has a CONFIRMED booking for this package
        boolean hasConfirmedBooking = bookingRepository.existsByUserIdAndTravelPackageIdAndStatus(
                user.getId(),
                travelPackage.getId(),
                org.telusco.travelbookingweb.entity.BookingStatus.CONFIRMED
        );

        if (!hasConfirmedBooking && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException(
                    "Only verified travelers with a confirmed booking can review this package"
            );
        }

        Review review = new Review();

        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        review.setUser(user);
        review.setTravelPackage(travelPackage);

        Review savedReview = reviewRepository.save(review);
        return mapToDto(savedReview);
    }


    public List<ReviewDTO> getAllReviews() {

        return reviewRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public ReviewDTO getReviewById(Long id) {

        Review review = reviewRepository.findById(id)
                .orElseThrow(() ->
                        new ReviewNotFoundException("Review not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!review.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to view this review"
            );
        }

        return mapToDto(review);
    }

    public ReviewDTO updateReview(Long id, ReviewDTO reviewDTO) {

        Review review = reviewRepository.findById(id)
                .orElseThrow(() ->
                        new ReviewNotFoundException("Review not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!review.getUser().getId()
                .equals(currentUser.getId())) {

            throw new ForbiddenException(
                    "You are not allowed to update this review"
            );
        }

        // Check duplicate review for the new travel package
        Optional<Review> existingReview =
                reviewRepository.findByUserIdAndTravelPackageId(
                        currentUser.getId(),
                        reviewDTO.getTravelPackageId()
                );

        if (existingReview.isPresent()
                && !existingReview.get().getId().equals(id)) {

            throw new ReviewAlreadyExistsException(
                    "You have already reviewed this travel package"
            );
        }

        TravelPackage travelPackage =
                travelPackageRepository.findById(
                        reviewDTO.getTravelPackageId()
                ).orElseThrow(() ->
                        new TravelPackageNotFoundException(
                                "Travel Package not found"));

        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        review.setTravelPackage(travelPackage);
        review.setUser(currentUser);

        Review updatedReview = reviewRepository.save(review);
        return mapToDto(updatedReview);
    }

    public List<ReviewDTO> getReviewsByPackage(Long packageId) {
        return reviewRepository.findByTravelPackageId(packageId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public List<ReviewDTO> getMyReviews() {
        User currentUser = authenticationService.getCurrentUser();
        return reviewRepository.findByUserId(currentUser.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public void deleteReview(Long id) {

        Review review = reviewRepository.findById(id)
                .orElseThrow(() ->
                        new ReviewNotFoundException("Review not found"));

        User currentUser = authenticationService.getCurrentUser();

        if (!review.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to delete this review"
            );
        }

        reviewRepository.delete(review);
    }

    private ReviewDTO mapToDto(Review review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        if (review.getUser() != null) {
            dto.setUserId(review.getUser().getId());
            dto.setCustomerName(review.getUser().getName());
        }
        if (review.getTravelPackage() != null) {
            dto.setTravelPackageId(review.getTravelPackage().getId());
            dto.setPackageTitle(review.getTravelPackage().getTitle());
        }
        return dto;
    }
}