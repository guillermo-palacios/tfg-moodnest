package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.RegistroDiarioRequest;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Servicio encargado de la lógica de negocio para la gestión de los registros de estado de ánimo.
 */
@Service
@RequiredArgsConstructor
public class RegistroDiarioService {

    private final RegistroDiarioRepository registroRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Crea un nuevo registro diario en el historial del usuario y actualiza su racha de constancia.
     *
     * @param email   Correo del usuario autenticado.
     * @param request Datos del registro (fecha, puntuación, etiquetas y comentario).
     * @return El registro creado y persistido.
     * @throws RuntimeException Si se intenta registrar una fecha futura.
     */
    public RegistroDiario crearRegistro(String email, RegistroDiarioRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);
        validarFechaNoFutura(request.getFechaAsignada().toLocalDate());

        RegistroDiario registro = new RegistroDiario();
        registro.setIdUsuario(usuario.getId());
        registro.setFechaAsignada(request.getFechaAsignada());
        registro.setPuntuacionGlobal(request.getPuntuacionGlobal());
        registro.setComentario(request.getComentario());
        registro.setEtiquetasAsociadas(request.getEtiquetasAsociadas());
        registro.setFechaCreacion(LocalDateTime.now());
        registro.setFechaModificacion(LocalDateTime.now());

        actualizarRacha(usuario, request.getFechaAsignada());

        usuarioRepository.save(usuario); 
        return registroRepository.save(registro);
    }

    /**
     * Modifica los atributos de un registro existente.
     *
     * @param email      Correo del usuario autenticado.
     * @param idRegistro Identificador único del registro a editar.
     * @param request    Nuevos datos a aplicar.
     * @return El registro actualizado.
     * @throws RuntimeException Si la nueva fecha es futura o no se tienen permisos.
     */
    public RegistroDiario actualizarRegistro(String email, String idRegistro, RegistroDiarioRequest request) {
        Usuario usuario = obtenerUsuarioActual(email);
        validarFechaNoFutura(request.getFechaAsignada().toLocalDate());

        RegistroDiario registro = registroRepository.findByIdAndIdUsuario(idRegistro, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Registro no encontrado o no tienes permisos para editarlo"));

        registro.setFechaAsignada(request.getFechaAsignada());
        registro.setPuntuacionGlobal(request.getPuntuacionGlobal());
        registro.setComentario(request.getComentario());
        registro.setEtiquetasAsociadas(request.getEtiquetasAsociadas());
        registro.setFechaModificacion(LocalDateTime.now());

        return registroRepository.save(registro);
    }

    /**
     * Elimina físicamente un registro del sistema.
     * Nota: No se recalcula la racha retroactivamente por reglas de negocio.
     *
     * @param email      Correo del usuario autenticado.
     * @param idRegistro Identificador único del registro a eliminar.
     */
    public void eliminarRegistro(String email, String idRegistro) {
        Usuario usuario = obtenerUsuarioActual(email);

        RegistroDiario registro = registroRepository.findByIdAndIdUsuario(idRegistro, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Registro no encontrado o no tienes permisos para borrarlo"));

        registroRepository.delete(registro);
    }

    /**
     * Recupera un listado cronológico de registros dentro de un marco temporal.
     * Utilizado principalmente para poblar las vistas de calendario en el cliente.
     *
     * @param email  Correo del usuario autenticado.
     * @param inicio Fecha inicial del rango.
     * @param fin    Fecha final del rango.
     * @return Lista de registros comprendidos en el periodo.
     */
    public List<RegistroDiario> obtenerRegistrosPorMes(String email, LocalDateTime inicio, LocalDateTime fin) {
        Usuario usuario = obtenerUsuarioActual(email);
        return registroRepository.findByIdUsuarioAndFechaAsignadaBetween(usuario.getId(), inicio, fin);
    }

    // --- MÉTODOS DE APOYO (Helpers) ---

    private Usuario obtenerUsuarioActual(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no identificado"));
    }

    private void validarFechaNoFutura(LocalDate fecha) {
        if (fecha.isAfter(LocalDate.now())) {
            throw new RuntimeException("Regla de negocio: No se pueden registrar estados de ánimo en fechas futuras");
        }
    }

    /**
     * Calcula y evalúa la racha de días consecutivos del usuario.
     * Solo incrementa si el registro se consolida exactamente al día siguiente del último registrado.
     *
     * @param usuario       Entidad del usuario a actualizar.
     * @param fechaAsignada Fecha del nuevo registro entrante.
     */
    private void actualizarRacha(Usuario usuario, LocalDateTime fechaAsignada) {
        LocalDate fechaNuevoRegistro = fechaAsignada.toLocalDate();
        LocalDate fechaUltimo = usuario.getFechaUltimoRegistro() != null
                ? usuario.getFechaUltimoRegistro().toLocalDate()
                : null;
        
        int rachaActual = usuario.getRachaActual() != null ? usuario.getRachaActual() : 0;

        if (fechaUltimo == null) {
            usuario.setRachaActual(1);
        } else {
            long diasDiferencia = ChronoUnit.DAYS.between(fechaUltimo, fechaNuevoRegistro);

            if (diasDiferencia == 1) {
                usuario.setRachaActual(rachaActual + 1);
            } else if (diasDiferencia > 1) {
                usuario.setRachaActual(1);
            } else if (diasDiferencia == 0 && rachaActual == 0) {
                usuario.setRachaActual(1); 
            }
        }
        
        usuario.setFechaUltimoRegistro(fechaAsignada);
    }
}