package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.EstadisticasResponse;
import com.palacios.moodnest.services.EstadisticasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controlador de análisis de datos. 
 * Expone las métricas calculadas sobre el histórico emocional del usuario.
 */
@RestController
@RequestMapping("/api/estadisticas")
@RequiredArgsConstructor
public class EstadisticasController {

    private final EstadisticasService estadisticasService;

    /**
     * Endpoint principal para visualizar el Dashboard analítico.
     * * @param auth Objeto de autenticación inyectado por Spring Security para obtener el usuario actual.
     * @return Objeto EstadisticasResponse con la evolución y promedios calculados.
     */
    @GetMapping
    public ResponseEntity<?> obtenerEstadisticas(Authentication auth) {
        try {
            // Obtenemos el email del usuario desde el contexto de seguridad del token JWT
            EstadisticasResponse stats = estadisticasService.calcularEstadisticasUsuario(auth.getName());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}