package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.EscalaRequest;
import com.palacios.moodnest.dto.InterfazRequest;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    // CU14: Guardar personalización de la escala y descriptores del 1 al 10
    public Usuario guardarEscalaPersonalizada(String email, EscalaRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Validamos el límite de caracteres (Flujo Alternativo 1 del CU14)
        for (String texto : request.getEscalaPersonalizada().values()) {
            if (texto != null && texto.length() > 30) {
                throw new RuntimeException("Los descriptores no pueden superar los 30 caracteres");
            }
        }

        usuario.setEscalaPersonalizada(request.getEscalaPersonalizada());
        
        // La familia de iconos vive dentro del objeto de preferencias
        if (usuario.getPreferenciasSistema() != null) {
            usuario.getPreferenciasSistema().setFamiliaIconos(request.getFamiliaIconos());
        }

        return usuarioRepository.save(usuario);
    }

    // CU15: Guardar personalización visual (Tema y Color de acento)
    public Usuario guardarInterfazPersonalizada(String email, InterfazRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.getPreferenciasSistema() == null) {
            usuario.setPreferenciasSistema(new Usuario.PreferenciasSistema());
        }

        // Modificamos los atributos exigidos por el RF5.4 y RF5.5
        usuario.getPreferenciasSistema().setTema(request.getTema());
        usuario.getPreferenciasSistema().setColorPrincipal(request.getColorPrincipal());

        return usuarioRepository.save(usuario);
    }
}