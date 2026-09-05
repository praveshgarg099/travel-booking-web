package org.telusco.travelbookingweb.service;


import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.entity.User;

@Service
public class AuthenticationService {
    public User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        return (User) authentication.getPrincipal();
    }
}
