package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.EtiquetaRequest;
import com.palacios.moodnest.models.Etiqueta;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.EtiquetaRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio encargado de la gestión del catálogo de etiquetas personalizadas del usuario.
 */
@Service
@RequiredArgsConstructor
public class EtiquetaService {

    private final EtiquetaRepository etiquetaRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Recupera el catálogo de etiquetas disponibles para ser asignadas a nuevos registros.
     *
     * @param email Correo del usuario autenticado.
     * @return Lista de etiquetas que se encuentran activas.
     */
    public List<Etiqueta> obtenerEtiquetasActivas(String email) {
        Usuario usuario = obtenerUsuarioActual(email);
        return etiquetaRepository.findByIdUsuarioAndActivaTrue(usuario.getId());
    }

    /**
     * Recupera el histórico completo de etiquetas del usuario.
     * Necesario para mantener la integridad visual del Historial en el cliente.
     *
     * @param email Correo del usuario autenticado.
     * @return Lista de todas las etiquetas (activas e inactivas).
     */
    public List<Etiqueta> obtenerTodasLasEtiquetas(String email) {
        Usuario usuario = obtenerUsuarioActual(email);
        return etiquetaRepository.findByIdUsuario(usuario.getId()); 
    }

    /**
     * Crea una nueva etiqueta en el catálogo del usuario.
     *
     * @param email   Correo del usuario autenticado.
     * @param request Datos de la nueva etiqueta (nombre y color).
     * @return La etiqueta recién creada y persistida.
     * @throws RuntimeException Si el nombre está vacío o ya existe una etiqueta activa con ese nombre.
     */
    public Etiqueta crearEtiqueta(String email, EtiquetaRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);
        String nombreLimpio = validarNombre(request.getNombre());
        comprobarDuplicado(usuario.getId(), nombreLimpio);

        Etiqueta etiqueta = new Etiqueta();
        etiqueta.setIdUsuario(usuario.getId());
        etiqueta.setNombre(nombreLimpio);
        etiqueta.setColor(request.getColor());
        etiqueta.setActiva(true); 
        etiqueta.setFechaCreacion(LocalDateTime.now());
        etiqueta.setFechaUltimoUso(LocalDateTime.now());

        return etiquetaRepository.save(etiqueta);
    }

    /**
     * Actualiza los datos de una etiqueta existente.
     *
     * @param email      Correo del usuario autenticado.
     * @param idEtiqueta Identificador único de la etiqueta a modificar.
     * @param request    Nuevos datos a aplicar.
     * @return La etiqueta actualizada.
     * @throws RuntimeException Si la etiqueta no existe, no pertenece al usuario o el nuevo nombre choca con otro existente.
     */
    public Etiqueta actualizarEtiqueta(String email, String idEtiqueta, EtiquetaRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);
        Etiqueta etiqueta = etiquetaRepository.findByIdAndIdUsuario(idEtiqueta, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Etiqueta no encontrada o sin permisos"));

        String nombreLimpio = validarNombre(request.getNombre());

        if (!etiqueta.getNombre().equalsIgnoreCase(nombreLimpio)) {
            comprobarDuplicado(usuario.getId(), nombreLimpio);
        }

        etiqueta.setNombre(nombreLimpio);
        etiqueta.setColor(request.getColor());

        return etiquetaRepository.save(etiqueta);
    }

    /**
     * Archiva una etiqueta mediante el patrón de Borrado Lógico.
     * Evita la eliminación física para no corromper los registros históricos dependientes.
     *
     * @param email      Correo del usuario autenticado.
     * @param idEtiqueta Identificador único de la etiqueta a archivar.
     * @throws RuntimeException Si la etiqueta no es encontrada.
     */
    public void eliminarEtiqueta(String email, String idEtiqueta) {
        Usuario usuario = obtenerUsuarioActual(email);
        Etiqueta etiqueta = etiquetaRepository.findByIdAndIdUsuario(idEtiqueta, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Etiqueta no encontrada o sin permisos"));

        etiqueta.setActiva(false);
        etiquetaRepository.save(etiqueta);
    }

    // --- MÉTODOS DE APOYO (Helpers) ---

    private Usuario obtenerUsuarioActual(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no identificado"));
    }

    private String validarNombre(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new RuntimeException("El nombre de la etiqueta no puede estar vacío");
        }
        return nombre.trim();
    }

    private void comprobarDuplicado(String usuarioId, String nombreLimpio) {
        if (etiquetaRepository.findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(usuarioId, nombreLimpio).isPresent()) {
            throw new RuntimeException("Ya existe una etiqueta activa con ese nombre");
        }
    }
}