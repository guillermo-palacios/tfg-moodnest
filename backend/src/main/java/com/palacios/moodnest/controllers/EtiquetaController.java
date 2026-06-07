package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.EtiquetaRequest;
import com.palacios.moodnest.models.Etiqueta;
import com.palacios.moodnest.services.EtiquetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador para la gestión del catálogo de etiquetas personalizadas.
 */
@RestController
@RequestMapping("/api/etiquetas")
@RequiredArgsConstructor
public class EtiquetaController {

    private final EtiquetaService etiquetaService;

    /**
     * Recupera el catálogo de etiquetas disponibles (activas).
     */
    @GetMapping
    public ResponseEntity<?> obtenerEtiquetas(Authentication auth) {
        try {
            List<Etiqueta> etiquetas = etiquetaService.obtenerEtiquetasActivas(auth.getName());
            return ResponseEntity.ok(etiquetas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Recupera el catálogo completo incluyendo las borradas lógicamente para el Historial.
     */
    @GetMapping("/todas")
    public ResponseEntity<?> obtenerTodasLasEtiquetas(Authentication auth) {
        try {
            List<Etiqueta> etiquetas = etiquetaService.obtenerTodasLasEtiquetas(auth.getName());
            return ResponseEntity.ok(etiquetas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> crearEtiqueta(Authentication auth, @RequestBody EtiquetaRequest request) {
        try {
            Etiqueta etiqueta = etiquetaService.crearEtiqueta(auth.getName(), request);
            return ResponseEntity.ok(etiqueta);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarEtiqueta(Authentication auth, @PathVariable("id") String id, @RequestBody EtiquetaRequest request) {
        try {
            Etiqueta etiqueta = etiquetaService.actualizarEtiqueta(auth.getName(), id, request);
            return ResponseEntity.ok(etiqueta);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEtiqueta(Authentication auth, @PathVariable("id") String id) {
        try {
            etiquetaService.eliminarEtiqueta(auth.getName(), id);
            return ResponseEntity.ok().body(Map.of("message", "Etiqueta archivada correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}