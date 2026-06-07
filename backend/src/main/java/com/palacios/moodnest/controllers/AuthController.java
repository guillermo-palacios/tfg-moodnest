package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.AuthRequest;
import com.palacios.moodnest.dto.AuthResponse;
import com.palacios.moodnest.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Endpoint público para Registrarse: POST http://localhost:8080/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registrar(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.registrar(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("Error: " + e.getMessage()));
        }
    }

    // Endpoint público para Login: POST http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (Exception e) {
            // Si las credenciales fallan, devolvemos un HTTP 401 Unauthorized
            return ResponseEntity.status(401).body(new AuthResponse("Error: " + e.getMessage()));
        }
    }
}