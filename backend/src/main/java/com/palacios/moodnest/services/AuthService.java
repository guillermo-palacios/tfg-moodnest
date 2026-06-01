package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.AuthRequest;
import com.palacios.moodnest.dto.AuthResponse;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.UsuarioRepository;
import com.palacios.moodnest.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Lógica de Registro de Usuarios
    public AuthResponse registrar(AuthRequest request) {
        // Validación básica: comprobar si el email ya existe en MongoDB (RI-01 de tu memoria)
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        // ¡CRUCIAL! Encriptamos la contraseña con BCrypt antes de guardar
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setFechaRegistro(LocalDateTime.now());
        
        // Inicializamos preferencias por defecto tal y como definiste en tu esquema JSON
        Usuario.PreferenciasSistema prefs = new Usuario.PreferenciasSistema();
        prefs.setTema("claro");
        prefs.setColorPrincipal("#4A90E2");
        prefs.setFamiliaIconos("default");
        usuario.setPreferenciasSistema(prefs);
        usuario.setEscalaPersonalizada(new HashMap<>());
        usuario.setRachaActual(0);

        usuarioRepository.save(usuario);

        // Le generamos y devolvemos su token de acceso
        String jwtToken = jwtService.generarToken(usuario.getEmail());
        return new AuthResponse(jwtToken);
    }

    // Lógica de Login/Acceso
    public AuthResponse login(AuthRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Comparamos la contraseña que mete en Postman con el hash encriptado de MongoDB
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        // Si es correcto, actualizamos su última fecha de acceso y generamos Token
        usuario.setFechaUltimoRegistro(LocalDateTime.now()); // Nota: usa el nombre exacto de tu modelo si cambia, ej: fechaUltimoRegistro
        usuarioRepository.save(usuario);

        String jwtToken = jwtService.generarToken(usuario.getEmail());
        return new AuthResponse(jwtToken);
    }
}