package com.palacios.moodnest.controllers;

import com.palacios.moodnest.dto.EscalaRequest;
import com.palacios.moodnest.dto.InterfazRequest;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.UsuarioRepository;
import com.palacios.moodnest.services.UsuarioService;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;


    @GetMapping("/me")
    public ResponseEntity<?> obtenerUsuarioActual(Authentication auth) {
        // Busca al usuario en el repositorio a partir de auth.getName() (que suele ser el ID o email del token)
        Optional<Usuario> usuario = usuarioRepository.findByEmail(auth.getName());
        
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }


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

    // CU3: PUT http://localhost:8080/api/usuario/perfil
    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(Authentication auth, @RequestBody com.palacios.moodnest.dto.PerfilUpdateRequest request) {
        try {
            Usuario usuarioActualizado = usuarioService.actualizarPerfil(auth.getName(), request);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    // CU5: DELETE http://localhost:8080/api/usuario/cuenta
    @DeleteMapping("/cuenta")
    public ResponseEntity<?> eliminarCuenta(Authentication auth, @RequestBody com.palacios.moodnest.dto.EliminarCuentaRequest request) {
        try {
            usuarioService.eliminarCuenta(auth.getName(), request.getPassword());
            return ResponseEntity.ok(java.util.Map.of("message", "Cuenta eliminada correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}