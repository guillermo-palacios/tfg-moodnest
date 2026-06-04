package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.RegistroDiarioRequest;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.services.RegistroDiarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/registros")
@RequiredArgsConstructor
public class RegistroDiarioController {

    private final RegistroDiarioService registroService;

    // POST: http://localhost:8080/api/registros
    @PostMapping
    public ResponseEntity<?> crearRegistro(Authentication auth, @RequestBody RegistroDiarioRequest request) {
        try {
            RegistroDiario registro = registroService.crearRegistro(auth.getName(), request);
            return ResponseEntity.ok(registro);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // PUT (Editar): http://localhost:8080/api/registros/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarRegistro(
            Authentication auth, 
            @PathVariable("id") String id, // <-- ¡Aquí está la magia añadida!
            @RequestBody RegistroDiarioRequest request) {
        try {
            RegistroDiario registroActualizado = registroService.actualizarRegistro(auth.getName(), id, request);
            return ResponseEntity.ok(registroActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // DELETE (Borrar): http://localhost:8080/api/registros/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarRegistro(
            Authentication auth, 
            @PathVariable("id") String id) { // <-- ¡Y aquí también!
        try {
            registroService.eliminarRegistro(auth.getName(), id);
            return ResponseEntity.ok().body("{\"mensaje\": \"Registro eliminado correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // GET: http://localhost:8080/api/registros?inicio=2026-06-01T00:00:00&fin=2026-06-30T23:59:59
    @GetMapping
    public ResponseEntity<?> obtenerRegistrosMes(
            Authentication auth,
            // 1. Forzamos explícitamente el nombre del parámetro en la URL
            // 2. Lo recibimos como String para evitar que Spring Boot explote antes de tiempo
            @RequestParam("inicio") String inicioStr,
            @RequestParam("fin") String finStr) {
        try {
            // Transformamos el texto a fecha de forma manual (Es 100% seguro)
            LocalDateTime inicio = LocalDateTime.parse(inicioStr);
            LocalDateTime fin = LocalDateTime.parse(finStr);

            List<RegistroDiario> registros = registroService.obtenerRegistrosPorMes(auth.getName(), inicio, fin);
            return ResponseEntity.ok(registros);
            
        } catch (Exception e) {
            // Si la fecha viene mal, ahora sí nos avisará por aquí con un 400 Bad Request
            return ResponseEntity.badRequest().body("Error al leer las fechas: " + e.getMessage());
        }
    }
}