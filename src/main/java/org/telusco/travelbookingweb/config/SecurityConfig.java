package org.telusco.travelbookingweb.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.telusco.travelbookingweb.security.JwtAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,https://yatramigo.dev,https://www.yatramigo.dev,https://travel-booking-web.vercel.app}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers(
                                "/api/users/login",
                                "/api/users/verify-email",
                                "/api/users/resend-verification",
                                "/api/users/google-login"
                        ).permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/users")
                        .permitAll()

                        // Razorpay Webhook (authenticated via HMAC signature header)
                        .requestMatchers(HttpMethod.POST, "/api/payments/webhook")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/users")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/api/users/**")
                        .hasRole("ADMIN")

                        // Admin APIs
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        // Travel Package - GET and HEAD allowed publicly for browsing & health checks
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/travel-packages",
                                "/api/travel-packages/**"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.HEAD,
                                "/api/travel-packages",
                                "/api/travel-packages/**"
                        ).permitAll()

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

                        // Destination - GET allowed publicly
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/destinations",
                                "/api/destinations/**"
                        ).permitAll()

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

                        // Reviews - GET allowed publicly
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reviews",
                                "/api/reviews/**"
                        ).permitAll()

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