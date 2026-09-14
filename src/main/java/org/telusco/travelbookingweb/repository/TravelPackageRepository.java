package org.telusco.travelbookingweb.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.telusco.travelbookingweb.entity.TravelPackage;

import java.util.Optional;

@Repository
public interface TravelPackageRepository extends JpaRepository<TravelPackage, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tp FROM TravelPackage tp WHERE tp.id = :id")
    Optional<TravelPackage> findByIdWithLock(@Param("id") Long id);
}
