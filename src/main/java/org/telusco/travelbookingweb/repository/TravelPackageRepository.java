package org.telusco.travelbookingweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.telusco.travelbookingweb.entity.TravelPackage;

@Repository
public interface TravelPackageRepository extends JpaRepository<TravelPackage,Long> {
}
