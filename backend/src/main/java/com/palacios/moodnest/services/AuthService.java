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

/**
 * Servicio encargado de gestionar la autenticación y el registro de usuarios.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Procesa el registro de un nuevo usuario en la plataforma.
     * Garantiza la unicidad del correo electrónico y cifra la contraseña antes de su persistencia.
     *
     * @param request Objeto de transferencia con los datos del usuario (nombre, email y contraseña).
     * @return AuthResponse Objeto que contiene el token JWT generado para iniciar sesión automáticamente.
     * @throws RuntimeException Si el correo electrónico proporcionado ya se encuentra registrado.
     */
    public AuthResponse registrar(AuthRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setFechaRegistro(LocalDateTime.now());
        
        inicializarPreferenciasPorDefecto(usuario);

        usuarioRepository.save(usuario);

        String jwtToken = jwtService.generarToken(usuario.getEmail());
        return new AuthResponse(jwtToken);
    }

    /**
     * Valida las credenciales de acceso de un usuario y genera una nueva sesión.
     *
     * @param request Objeto con las credenciales de acceso (email y contraseña).
     * @return AuthResponse Objeto que contiene el token JWT de sesión.
     * @throws RuntimeException Si el usuario no existe o la contraseña es incorrecta.
     */
    public AuthResponse login(AuthRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        usuario.setFechaUltimoRegistro(LocalDateTime.now()); 
        usuarioRepository.save(usuario);

        String jwtToken = jwtService.generarToken(usuario.getEmail());
        return new AuthResponse(jwtToken);
    }

    /**
     * Inicializa la configuración visual por defecto para un nuevo usuario.
     *
     * @param usuario Entidad del usuario recién instanciada.
     */
    private void inicializarPreferenciasPorDefecto(Usuario usuario) {
        Usuario.PreferenciasSistema prefs = new Usuario.PreferenciasSistema();
        prefs.setTema("claro");
        prefs.setColorPrincipal("indigo");
        prefs.setFamiliaIconos("default");
        
        usuario.setPreferenciasSistema(prefs);
        usuario.setEscalaPersonalizada(new HashMap<>());
        usuario.setRachaActual(0);
    }
}