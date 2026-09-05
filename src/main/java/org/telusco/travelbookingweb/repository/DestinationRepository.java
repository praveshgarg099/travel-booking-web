package org.telusco.travelbookingweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.telusco.travelbookingweb.entity.Destination;

@Repository
public interface DestinationRepository extends JpaRepository<Destination,Long> {
}
