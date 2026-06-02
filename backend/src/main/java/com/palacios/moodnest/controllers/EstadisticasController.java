package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.EstadisticasResponse;
import com.palacios.moodnest.services.EstadisticasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estadisticas")
@RequiredArgsConstructor
public class EstadisticasController {

    private final EstadisticasService estadisticasService;

    // GET: http://localhost:8080/api/estadisticas
    @GetMapping
    public ResponseEntity<?> obtenerEstadisticas(Authentication auth) {
        try {
            // auth.getName() nos da el email del token JWT de forma segura
            EstadisticasResponse stats = estadisticasService.calcularEstadisticasUsuario(auth.getName());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
