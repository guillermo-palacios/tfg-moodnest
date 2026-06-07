package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.RegistroDiarioRequest;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.services.RegistroDiarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registros")
@RequiredArgsConstructor
public class RegistroDiarioController {

    private final RegistroDiarioService registroService;

    /**
     * Recupera los registros del usuario dentro de un rango temporal específico.
     */
    @GetMapping
    public ResponseEntity<?> obtenerRegistrosMes(
            Authentication auth,
            @RequestParam("inicio") String inicioStr,
            @RequestParam("fin") String finStr) {
        try {
            LocalDateTime inicio = LocalDateTime.parse(inicioStr);
            LocalDateTime fin = LocalDateTime.parse(finStr);

            List<RegistroDiario> registros = registroService.obtenerRegistrosPorMes(auth.getName(), inicio, fin);
            return ResponseEntity.ok(registros);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al procesar las fechas cronológicas"));
        }
    }

    @PostMapping
    public ResponseEntity<?> crearRegistro(Authentication auth, @RequestBody RegistroDiarioRequest request) {
        try {
            RegistroDiario registro = registroService.crearRegistro(auth.getName(), request);
            return ResponseEntity.ok(registro);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarRegistro(Authentication auth, @PathVariable("id") String id, @RequestBody RegistroDiarioRequest request) {
        try {
            RegistroDiario registroActualizado = registroService.actualizarRegistro(auth.getName(), id, request);
            return ResponseEntity.ok(registroActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarRegistro(Authentication auth, @PathVariable("id") String id) { 
        try {
            registroService.eliminarRegistro(auth.getName(), id);
            return ResponseEntity.ok().body(Map.of("message", "Registro eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}