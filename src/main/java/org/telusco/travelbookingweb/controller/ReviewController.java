package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.telusco.travelbookingweb.dto.ReviewDTO;
import org.telusco.travelbookingweb.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ReviewDTO createReview(
            @Valid @RequestBody ReviewDTO reviewDTO) {

        return reviewService.createReview(reviewDTO);
    }
    @PutMapping("/{id}")
    public ReviewDTO updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewDTO reviewDTO) {

        return reviewService.updateReview(id, reviewDTO);
    }

    @GetMapping
    public List<ReviewDTO> getAllReviews(
            @RequestParam(required = false) Long packageId,
            @RequestParam(required = false) Boolean my) {
        if (packageId != null) {
            return reviewService.getReviewsByPackage(packageId);
        }
        if (Boolean.TRUE.equals(my)) {
            return reviewService.getMyReviews();
        }
        return reviewService.getAllReviews();
    }

    @GetMapping("/package/{packageId}")
    public List<ReviewDTO> getReviewsByPackage(@PathVariable Long packageId) {
        return reviewService.getReviewsByPackage(packageId);
    }

    @GetMapping("/my")
    public List<ReviewDTO> getMyReviews() {
        return reviewService.getMyReviews();
    }

    @GetMapping("/{id}")
    public ReviewDTO getReviewById(@PathVariable Long id) {

        return reviewService.getReviewById(id);
    }

    @DeleteMapping("/{id}")
    public String deleteReview(@PathVariable Long id) {

        reviewService.deleteReview(id);

        return "Review deleted successfully";
    }
}
