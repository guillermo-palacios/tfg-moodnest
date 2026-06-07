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

/**
 * Servicio encargado de la gestión integral de la cuenta de usuario, 
 * incluyendo preferencias del sistema, actualización de credenciales y baja de la plataforma.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RegistroDiarioRepository registroRepository;
    private final EtiquetaRepository etiquetaRepository;
    private final PasswordEncoder passwordEncoder; 

    /**
     * Permite al usuario personalizar los descriptores textuales de su escala del 1 al 10.
     * (Preparado para la escalabilidad futura del CU14)
     *
     * @param email   Correo del usuario autenticado.
     * @param request Datos con los nuevos textos descriptivos.
     * @return Perfil de usuario actualizado.
     */
    public Usuario guardarEscalaPersonalizada(String email, EscalaRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);
        
        // Validación de interfaz: Evitamos textos excesivamente largos.
        for (String texto : request.getEscalaPersonalizada().values()) {
            if (texto != null && texto.length() > 30) {
                throw new RuntimeException("Los descriptores no pueden superar los 30 caracteres");
            }
        }
        
        usuario.setEscalaPersonalizada(request.getEscalaPersonalizada());
        
        if (usuario.getPreferenciasSistema() != null && request.getFamiliaIconos() != null) {
            usuario.getPreferenciasSistema().setFamiliaIconos(request.getFamiliaIconos());
        }
        
        return usuarioRepository.save(usuario);
    }

    /**
     * Actualiza las variables de tema (claro/oscuro) y color primario que consumirá Tailwind CSS.
     *
     * @param email   Correo del usuario autenticado.
     * @param request Datos con las preferencias de UI.
     * @return Perfil de usuario actualizado.
     */
    public Usuario guardarInterfazPersonalizada(String email, InterfazRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);
        
        // Inicializar el subdocumento si el usuario es antiguo y no lo poseía
        if (usuario.getPreferenciasSistema() == null) {
            usuario.setPreferenciasSistema(new Usuario.PreferenciasSistema());
        }
        
        usuario.getPreferenciasSistema().setTema(request.getTema());
        usuario.getPreferenciasSistema().setColorPrincipal(request.getColorPrincipal());
        
        return usuarioRepository.save(usuario);
    }

    /**
     * Gestiona las modificaciones del perfil. Solo actualiza los campos que el cliente haya enviado.
     *
     * @param email   Correo del usuario autenticado.
     * @param request Objeto con el nuevo nombre o nueva contraseña.
     * @return Perfil de usuario modificado.
     */
    public Usuario actualizarPerfil(String email, PerfilUpdateRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);

        // 1. Modificación de datos no sensibles (Nombre)
        if (request.getNombre() != null && !request.getNombre().trim().isEmpty()) {
            usuario.setNombre(request.getNombre().trim());
        }

        // 2. Modificación de datos críticos (Contraseña)
        if (request.getNuevaPassword() != null && !request.getNuevaPassword().isEmpty()) {
            
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

    /**
     * Procesa la baja definitiva del sistema y purga toda la información asociada al usuario.
     *
     * @param email                Correo del usuario autenticado.
     * @param passwordConfirmacion Contraseña actual como medida de confirmación irreversible.
     */
    public void eliminarCuenta(String email, String passwordConfirmacion) {
        Usuario usuario = obtenerUsuarioActual(email);

        // Barrera de seguridad perimetral para evitar borrados accidentales
        if (!passwordEncoder.matches(passwordConfirmacion, usuario.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta. Se ha abortado la eliminación de la cuenta.");
        }

        // --- BORRADO EN CASCADA (Integridad Referencial) ---
        // Debemos eliminar manualmente los documentos hijos antes de borrar el documento maestro.
        registroRepository.deleteByIdUsuario(usuario.getId());
        etiquetaRepository.deleteByIdUsuario(usuario.getId());
        
        // Finalmente, eliminamos la identidad central
        usuarioRepository.delete(usuario);
    }

    // --- MÉTODOS DE APOYO (Helpers) ---
    
    private Usuario obtenerUsuarioActual(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No se ha podido identificar al usuario en sesión"));
    }
}