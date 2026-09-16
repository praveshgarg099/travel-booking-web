package org.telusco.travelbookingweb.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.emailVerified = true WHERE u.emailVerified IS NULL")
    int migrateLegacyNullEmailVerified();
}
