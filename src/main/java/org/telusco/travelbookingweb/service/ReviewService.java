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

    public ReviewService(ReviewRepository reviewRepository, TravelPackageRepository travelPackageRepository, AuthenticationService authenticationService) {
        this.reviewRepository = reviewRepository;
        this.travelPackageRepository = travelPackageRepository;
        this.authenticationService = authenticationService;
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

        Review review = new Review();

        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        review.setUser(user);
        review.setTravelPackage(travelPackage);

        Review savedReview = reviewRepository.save(review);

        ReviewDTO response = new ReviewDTO();

        response.setId(savedReview.getId());
        response.setRating(savedReview.getRating());
        response.setComment(savedReview.getComment());
        response.setUserId(savedReview.getUser().getId());
        response.setTravelPackageId(
                savedReview.getTravelPackage().getId()
        );

        return response;
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

        ReviewDTO response = new ReviewDTO();

        response.setId(updatedReview.getId());
        response.setRating(updatedReview.getRating());
        response.setComment(updatedReview.getComment());
        response.setUserId(updatedReview.getUser().getId());
        response.setTravelPackageId(
                updatedReview.getTravelPackage().getId()
        );

        return response;
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