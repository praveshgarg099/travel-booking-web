package org.telusco.travelbookingweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.telusco.travelbookingweb.entity.Review;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByUserIdAndTravelPackageId(
            Long userId,
            Long travelPackageId
    );

    Optional<Review> findByUserIdAndTravelPackageId(
            Long userId,
            Long travelPackageId
    );

    boolean existsByTravelPackageId(Long travelPackageId);
}
