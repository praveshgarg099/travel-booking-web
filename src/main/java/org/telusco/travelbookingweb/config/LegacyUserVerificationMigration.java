package org.telusco.travelbookingweb.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.telusco.travelbookingweb.repository.UserRepository;

/**
 * Migration runner that executes on application startup.
 * Safely marks pre-existing legacy accounts (where email_verified IS NULL) as verified,
 * ensuring trusted legacy users remain active while eliminating the permanent 'null' authentication bypass.
 */
@Component
public class LegacyUserVerificationMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyUserVerificationMigration.class);
    private final UserRepository userRepository;

    public LegacyUserVerificationMigration(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int updated = userRepository.migrateLegacyNullEmailVerified();
            if (updated > 0) {
                log.info("Migrated {} legacy user account(s) from email_verified=NULL to email_verified=TRUE", updated);
            }
        } catch (Exception e) {
            log.warn("Legacy user email_verified migration check encountered an error: {}", e.getMessage());
        }
    }
}
