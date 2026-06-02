package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.EscalaRequest;
import com.palacios.moodnest.dto.InterfazRequest;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // PUT: http://localhost:8080/api/usuario/escala
    @PutMapping("/escala")
    public ResponseEntity<?> personalizarEscala(Authentication auth, @RequestBody EscalaRequest request) {
        try {
            Usuario usuarioActualizado = usuarioService.guardarEscalaPersonalizada(auth.getName(), request);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // PUT: http://localhost:8080/api/usuario/interfaz
    @PutMapping("/interfaz")
    public ResponseEntity<?> personalizarInterfaz(Authentication auth, @RequestBody InterfazRequest request) {
        try {
            Usuario usuarioActualizado = usuarioService.guardarInterfazPersonalizada(auth.getName(), request);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}