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

@Service
@RequiredArgsConstructor
public class EtiquetaService {

    private final EtiquetaRepository etiquetaRepository;
    private final UsuarioRepository usuarioRepository;

    private Usuario getUsuarioActual(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    // Listar: Mostrar solo las etiquetas Activas
    public List<Etiqueta> obtenerEtiquetasActivas(String email) {
        Usuario usuario = getUsuarioActual(email);
        return etiquetaRepository.findByIdUsuarioAndActivaTrue(usuario.getId());
    }

    // Crear
    public Etiqueta crearEtiqueta(String email, EtiquetaRequest request) {
        Usuario usuario = getUsuarioActual(email);
        
        if (request.getNombre() == null || request.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre de la etiqueta no puede estar vacío");
        }

        // Regla de Negocio: Evitar nombres duplicados
        if (etiquetaRepository.findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(usuario.getId(), request.getNombre().trim()).isPresent()) {
            throw new RuntimeException("Ya existe una etiqueta activa con ese nombre");
        }

        Etiqueta etiqueta = new Etiqueta();
        etiqueta.setIdUsuario(usuario.getId());
        etiqueta.setNombre(request.getNombre().trim());
        etiqueta.setColor(request.getColor());
        etiqueta.setActiva(true); // Siempre nace activa
        etiqueta.setFechaCreacion(LocalDateTime.now());
        etiqueta.setFechaUltimoUso(LocalDateTime.now());

        return etiquetaRepository.save(etiqueta);
    }

    // Editar
    public Etiqueta actualizarEtiqueta(String email, String idEtiqueta, EtiquetaRequest request) {
        Usuario usuario = getUsuarioActual(email);
        Etiqueta etiqueta = etiquetaRepository.findByIdAndIdUsuario(idEtiqueta, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Etiqueta no encontrada o sin permisos"));

        if (request.getNombre() == null || request.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre de la etiqueta no puede estar vacío");
        }

        // Si intenta cambiar el nombre, comprobamos que el nuevo no exista ya
        if (!etiqueta.getNombre().equalsIgnoreCase(request.getNombre().trim())) {
            if (etiquetaRepository.findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(usuario.getId(), request.getNombre().trim()).isPresent()) {
                throw new RuntimeException("Ya existe una etiqueta activa con ese nombre");
            }
        }

        etiqueta.setNombre(request.getNombre().trim());
        etiqueta.setColor(request.getColor());

        return etiquetaRepository.save(etiqueta);
    }

    // Borrado Lógico
    public void eliminarEtiqueta(String email, String idEtiqueta) {
        Usuario usuario = getUsuarioActual(email);
        Etiqueta etiqueta = etiquetaRepository.findByIdAndIdUsuario(idEtiqueta, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Etiqueta no encontrada o sin permisos"));

        etiqueta.setActiva(false);
        etiquetaRepository.save(etiqueta);
    }
}