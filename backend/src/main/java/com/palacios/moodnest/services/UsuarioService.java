package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.EscalaRequest;
import com.palacios.moodnest.dto.InterfazRequest;
import com.palacios.moodnest.dto.PerfilUpdateRequest;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.EtiquetaRepository;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RegistroDiarioRepository registroRepository;
    private final EtiquetaRepository etiquetaRepository;
    private final PasswordEncoder passwordEncoder; // Inyectamos el encriptador

    public Usuario guardarEscalaPersonalizada(String email, EscalaRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        for (String texto : request.getEscalaPersonalizada().values()) {
            if (texto != null && texto.length() > 30) throw new RuntimeException("Los descriptores no pueden superar los 30 caracteres");
        }
        usuario.setEscalaPersonalizada(request.getEscalaPersonalizada());
        if (usuario.getPreferenciasSistema() != null) {
            usuario.getPreferenciasSistema().setFamiliaIconos(request.getFamiliaIconos());
        }
        return usuarioRepository.save(usuario);
    }

    public Usuario guardarInterfazPersonalizada(String email, InterfazRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (usuario.getPreferenciasSistema() == null) usuario.setPreferenciasSistema(new Usuario.PreferenciasSistema());
        usuario.getPreferenciasSistema().setTema(request.getTema());
        usuario.getPreferenciasSistema().setColorPrincipal(request.getColorPrincipal());
        return usuarioRepository.save(usuario);
    }

    // CU3: Gestionar Perfil (Modificar Nombre y/o Contraseña)
    public Usuario actualizarPerfil(String email, PerfilUpdateRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // 1. Actualizar Nombre (Si nos mandan uno)
        if (request.getNombre() != null && !request.getNombre().trim().isEmpty()) {
            usuario.setNombre(request.getNombre().trim());
        }

        // 2. Actualizar Contraseña (Si el usuario ha rellenado los campos)
        if (request.getNuevaPassword() != null && !request.getNuevaPassword().isEmpty()) {
            // Validamos que la contraseña actual que ha escrito coincide con la encriptada de la BD
            if (!passwordEncoder.matches(request.getPasswordActual(), usuario.getPassword())) {
                throw new RuntimeException("La contraseña actual es incorrecta.");
            }
            if (request.getNuevaPassword().length() < 6) {
                throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres.");
            }
            usuario.setPassword(passwordEncoder.encode(request.getNuevaPassword()));
        }

        return usuarioRepository.save(usuario);
    }

    // CU5: Eliminar Cuenta (Permanente y con borrado en cascada)
    public void eliminarCuenta(String email, String passwordConfirmacion) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Medida de seguridad crı́tica: Validar contraseña antes de borrar
        if (!passwordEncoder.matches(passwordConfirmacion, usuario.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta. Se ha abortado la eliminación de la cuenta.");
        }

        // Borrado en cascada exigido por el CU5
        registroRepository.deleteByIdUsuario(usuario.getId());
        etiquetaRepository.deleteByIdUsuario(usuario.getId());
        
        // Finalmente borramos al usuario
        usuarioRepository.delete(usuario);
    }
}