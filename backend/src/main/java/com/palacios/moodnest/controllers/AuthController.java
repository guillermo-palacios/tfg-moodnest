package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.AuthRequest;
import com.palacios.moodnest.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Registra un nuevo usuario en la plataforma.
     * @param request Datos del usuario (nombre, email, password).
     * @return Token JWT de acceso.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.registrar(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Valida credenciales y devuelve el token de sesión JWT.
     * @param request Credenciales (email, password).
     * @return Token JWT de sesión.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (Exception e) {
            // Devolvemos 401 Unauthorized para diferenciar de un error del servidor (500)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}