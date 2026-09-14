package org.telusco.travelbookingweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TravelBookingWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelBookingWebApplication.class, args);
    }

}
