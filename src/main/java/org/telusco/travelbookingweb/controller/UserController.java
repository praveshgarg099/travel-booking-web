package org.telusco.travelbookingweb.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.telusco.travelbookingweb.dto.GoogleLoginRequestDto;
import org.telusco.travelbookingweb.dto.LoginRequestDTO;
import org.telusco.travelbookingweb.dto.LoginResponseDTO;
import org.telusco.travelbookingweb.dto.UserDto;
import org.telusco.travelbookingweb.dto.VerifyEmailRequestDto;
import org.telusco.travelbookingweb.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserDto> getAllUser(){
        return userService.getAllUser();
    }

    @GetMapping("/{id}")
    public UserDto getUserById(@PathVariable Long id){
        return userService.getUserById(id);
    }

    @PostMapping
    public UserDto createUser(@Valid @RequestBody UserDto userDto){
        return userService.createUser(userDto);
    }

    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable Long id,@Valid @RequestBody UserDto userDto){
        return userService.updateUser(id,userDto);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id){
        userService.deleteUser(id);
    }

    // login controller
    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
        return userService.login(loginRequestDTO);
    }

    // Email verification controller
    @PostMapping("/verify-email")
    public LoginResponseDTO verifyEmail(@Valid @RequestBody VerifyEmailRequestDto request) {
        return userService.verifyEmail(request);
    }

    // Resend verification code controller
    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerification(@RequestParam String email) {
        return ResponseEntity.ok(userService.resendVerificationCode(email));
    }

    // Google OAuth login controller
    @PostMapping("/google-login")
    public LoginResponseDTO googleLogin(@Valid @RequestBody GoogleLoginRequestDto request) {
        return userService.loginWithGoogle(request);
    }
}
