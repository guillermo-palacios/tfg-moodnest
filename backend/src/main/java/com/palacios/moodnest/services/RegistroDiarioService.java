package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.RegistroDiarioRequest;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistroDiarioService {

    private final RegistroDiarioRepository registroRepository;
    private final UsuarioRepository usuarioRepository;

    private Usuario getUsuarioActual(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    // CU6: Crear Registro Diario
    public RegistroDiario crearRegistro(String email, RegistroDiarioRequest request) {
        Usuario usuario = getUsuarioActual(email);

        // Cumplimiento del RF2.2: Bloquear fechas futuras explícitamente
        if (request.getFechaAsignada().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("No se pueden crear registros en fechas futuras");
        }

        RegistroDiario registro = new RegistroDiario();
        registro.setIdUsuario(usuario.getId());
        registro.setFechaAsignada(request.getFechaAsignada());
        registro.setPuntuacionGlobal(request.getPuntuacionGlobal());
        registro.setComentario(request.getComentario());
        registro.setEtiquetasAsociadas(request.getEtiquetasAsociadas());
        registro.setFechaCreacion(LocalDateTime.now());
        registro.setFechaModificacion(LocalDateTime.now());

        // TODO: Aquí en la Fase B recalcularemos la racha del usuario

        return registroRepository.save(registro);
    }

    // CU7: Editar un registro existente
    public RegistroDiario actualizarRegistro(String email, String idRegistro, RegistroDiarioRequest request) {
        Usuario usuario = getUsuarioActual(email);

        // Buscamos el registro, asegurándonos de que existe y de que pertenece a este
        // usuario
        RegistroDiario registro = registroRepository.findByIdAndIdUsuario(idRegistro, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Registro no encontrado o no tienes permisos para editarlo"));

        // Validamos la regla de negocio: no se permiten fechas futuras
        if (request.getFechaAsignada().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("No se pueden asignar fechas futuras");
        }

        // Actualizamos los datos permitidos
        registro.setFechaAsignada(request.getFechaAsignada());
        registro.setPuntuacionGlobal(request.getPuntuacionGlobal());
        registro.setComentario(request.getComentario());
        registro.setEtiquetasAsociadas(request.getEtiquetasAsociadas());
        registro.setFechaModificacion(LocalDateTime.now()); // Actualizamos la marca temporal

        return registroRepository.save(registro);
    }

    // CU7: Eliminar un registro de forma permanente
    public void eliminarRegistro(String email, String idRegistro) {
        Usuario usuario = getUsuarioActual(email);

        // Verificamos propiedad antes de borrar
        RegistroDiario registro = registroRepository.findByIdAndIdUsuario(idRegistro, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Registro no encontrado o no tienes permisos para borrarlo"));

        registroRepository.delete(registro);
    }

    // CU10: Visualizar Historial (Obtener los de un mes)
    public List<RegistroDiario> obtenerRegistrosPorMes(String email, LocalDateTime inicio, LocalDateTime fin) {
        Usuario usuario = getUsuarioActual(email);
        return registroRepository.findByIdUsuarioAndFechaAsignadaBetween(usuario.getId(), inicio, fin);
    }
}