package org.telusco.travelbookingweb.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.telusco.travelbookingweb.dto.LoginRequestDTO;
import org.telusco.travelbookingweb.dto.LoginResponseDTO;
import org.telusco.travelbookingweb.dto.UserDto;
import org.telusco.travelbookingweb.entity.Role;
import org.telusco.travelbookingweb.entity.User;
import org.telusco.travelbookingweb.exception.EmailAlreadyExistsException;
import org.telusco.travelbookingweb.exception.ForbiddenException;
import org.telusco.travelbookingweb.exception.InvalidCredentialsException;
import org.telusco.travelbookingweb.exception.UserNotFoundException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;

    public UserService(
            UserRepository userRepository,
            BookingRepository bookingRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationService authenticationService) {

        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
    }

    // Get all users
    public List<UserDto> getAllUser() {

        return userRepository.findAll()
                .stream()
                .map(user -> {

                    UserDto response = new UserDto();

                    response.setId(user.getId());
                    response.setName(user.getName());
                    response.setEmail(user.getEmail());
                    response.setRole(user.getRole() != null ? user.getRole().name() : null);

                    return response;

                })
                .toList();
    }

    // Create user
    public UserDto createUser(UserDto userDto) {

        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User();

        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setRole(Role.USER);

        // Encrypt password before saving
        user.setPassword(
                passwordEncoder.encode(userDto.getPassword())
        );

        User savedUser = userRepository.save(user);

        UserDto response = new UserDto();

        response.setId(savedUser.getId());
        response.setName(savedUser.getName());
        response.setEmail(savedUser.getEmail());

        return response;
    }

    // Get user by ID
    public UserDto getUserById(Long id) {

        User currentUser = authenticationService.getCurrentUser();

        // User can see only himself.
        // Admin can see anyone.
        if (!currentUser.getId().equals(id)
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to view this user"
            );
        }

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found")
                );

        UserDto response = new UserDto();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole() != null ? user.getRole().name() : null);

        return response;
    }

    // Update user
    public UserDto updateUser(Long id, UserDto userDto) {

        User currentUser = authenticationService.getCurrentUser();

        // User can update only himself.
        // Admin can update anyone.
        if (!currentUser.getId().equals(id)
                && currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to update this user"
            );
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found")
                );

        // Check whether another user already has this email
        Optional<User> userWithSameEmail =
                userRepository.findByEmail(userDto.getEmail());

        if (userWithSameEmail.isPresent()
                && !userWithSameEmail.get().getId().equals(id)) {

            throw new EmailAlreadyExistsException(
                    "Email already exists"
            );
        }

        existingUser.setName(userDto.getName());
        existingUser.setEmail(userDto.getEmail());

        User savedUser = userRepository.save(existingUser);

        UserDto response = new UserDto();

        response.setId(savedUser.getId());
        response.setName(savedUser.getName());
        response.setEmail(savedUser.getEmail());
        response.setRole(savedUser.getRole() != null ? savedUser.getRole().name() : null);

        return response;
    }

    // Delete user
    public void deleteUser(Long id) {

        User currentUser = authenticationService.getCurrentUser();

        // Only admin can delete users
        if (currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "You are not allowed to delete this user"
            );
        }

        if (!userRepository.existsById(id)) {

            throw new UserNotFoundException(
                    "User not found"
            );
        }

        userRepository.deleteById(id);
    }

    // Login
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {

        User user = userRepository.findByEmail(
                loginRequestDTO.getEmail()
        ).orElseThrow(() ->
                new InvalidCredentialsException(
                        "Invalid email or password"
                )
        );

        // Check password
        if (!passwordEncoder.matches(
                loginRequestDTO.getPassword(),
                user.getPassword())) {

            throw new InvalidCredentialsException(
                    "Invalid email or password"
            );
        }

        // Generate JWT token
        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        LoginResponseDTO response = new LoginResponseDTO();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setToken(token);

        return response;
    }
}