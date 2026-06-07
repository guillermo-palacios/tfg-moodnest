package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.EliminarCuentaRequest;
import com.palacios.moodnest.dto.EscalaRequest;
import com.palacios.moodnest.dto.InterfazRequest;
import com.palacios.moodnest.dto.PerfilUpdateRequest;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.UsuarioRepository;
import com.palacios.moodnest.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    
    // Inyectado únicamente para la recuperación directa del perfil maestro
    private final UsuarioRepository usuarioRepository;

    /**
     * Endpoint central del Frontend para hidratar el estado global de la SPA.
     */
    @GetMapping("/me")
    public ResponseEntity<?> obtenerUsuarioActual(Authentication auth) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(auth.getName());
        
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Prepara el endpoint de extensión futura para la personalización semántica (CU14).
     */
    @PutMapping("/escala")
    public ResponseEntity<?> personalizarEscala(Authentication auth, @RequestBody EscalaRequest request) {
        try {
            Usuario usuarioActualizado = usuarioService.guardarEscalaPersonalizada(auth.getName(), request);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/interfaz")
    public ResponseEntity<?> personalizarInterfaz(Authentication auth, @RequestBody InterfazRequest request) {
        try {
            Usuario usuarioActualizado = usuarioService.guardarInterfazPersonalizada(auth.getName(), request);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(Authentication auth, @RequestBody PerfilUpdateRequest request) {
        try {
            Usuario usuarioActualizado = usuarioService.actualizarPerfil(auth.getName(), request);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/cuenta")
    public ResponseEntity<?> eliminarCuenta(Authentication auth, @RequestBody EliminarCuentaRequest request) {
        try {
            usuarioService.eliminarCuenta(auth.getName(), request.getPassword());
            return ResponseEntity.ok(Map.of("message", "Cuenta eliminada permanentemente del sistema"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}