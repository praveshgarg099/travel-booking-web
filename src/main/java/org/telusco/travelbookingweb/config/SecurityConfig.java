package org.telusco.travelbookingweb.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.telusco.travelbookingweb.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers(
                                "/api/users/login"
                        ).permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/users")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/users")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/api/users/**")
                        .hasRole("ADMIN")

                        // Admin APIs
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        // Travel Package - GET allowed for logged-in users
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/travel-packages/**"
                        ).authenticated()

                        // Travel Package - ADMIN only
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/travel-packages"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/travel-packages/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/travel-packages/**"
                        ).hasRole("ADMIN")
                                // Destination - GET allowed for logged-in users
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/destinations/**"
                                ).authenticated()

// Destination - ADMIN only
                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/destinations"
                                ).hasRole("ADMIN")

                                .requestMatchers(
                                        HttpMethod.PUT,
                                        "/api/destinations/**"
                                ).hasRole("ADMIN")

                                .requestMatchers(
                                        HttpMethod.DELETE,
                                        "/api/destinations/**"
                                ).hasRole("ADMIN")

                        // Everything else requires login
                        .anyRequest().authenticated()
                )

                .exceptionHandling(exception -> exception

                        // 401 - No valid authentication
                        .authenticationEntryPoint(
                                (request, response, authException) -> {
                                    response.setStatus(
                                            HttpServletResponse.SC_UNAUTHORIZED
                                    );
                                }
                        )

                        // 403 - Authenticated but insufficient permission
                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {
                                    response.setStatus(
                                            HttpServletResponse.SC_FORBIDDEN
                                    );
                                }
                        )
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}