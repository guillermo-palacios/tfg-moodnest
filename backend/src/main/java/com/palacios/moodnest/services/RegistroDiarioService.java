package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.RegistroDiarioRequest;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

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

        RegistroDiario guardado = registroRepository.save(registro);
        
        recalcularRacha(usuario);
        
        return guardado;
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

        RegistroDiario guardado = registroRepository.save(registro);
        
        recalcularRacha(usuario);
        
        return guardado;
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

        recalcularRacha(usuario);
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
     *
     * @param usuario       Entidad del usuario a actualizar.
     */
    private void recalcularRacha(Usuario usuario) {
        List<RegistroDiario> todos = registroRepository.findByIdUsuario(usuario.getId());
        
        if (todos.isEmpty()) {
            usuario.setRachaActual(0);
            usuario.setFechaUltimoRegistro(null);
            usuarioRepository.save(usuario);
            return;
        }

        // 1. Extraemos solo las fechas, quitamos duplicados (por si hubiera dos el mismo día) y ordenamos de más nueva a más antigua
        List<LocalDate> fechasDesc = todos.stream()
                .map(r -> r.getFechaAsignada().toLocalDate())
                .distinct()
                .sorted((a, b) -> b.compareTo(a))
                .collect(Collectors.toList());

        LocalDate hoy = LocalDate.now();
        LocalDate ayer = hoy.minusDays(1);
        
        LocalDate fechaMasReciente = fechasDesc.get(0);
        int racha = 0;

        // 2. Si el registro más reciente es anterior a ayer, la racha se ha perdido (0)
        if (fechaMasReciente.isBefore(ayer)) {
            usuario.setRachaActual(0);
        } else {
            // 3. Contamos hacia atrás buscando días consecutivos
            LocalDate fechaEsperada = fechaMasReciente;
            for (LocalDate fecha : fechasDesc) {
                if (fecha.equals(fechaEsperada)) {
                    racha++;
                    fechaEsperada = fechaEsperada.minusDays(1); // Restamos un día para buscar el anterior
                } else {
                    break; // Hueco encontrado, fin de la racha
                }
            }
            usuario.setRachaActual(racha);
        }
        
        usuario.setFechaUltimoRegistro(fechaMasReciente.atTime(12, 0));
        usuarioRepository.save(usuario);
    }

    /**
     * Recupera los últimos registros agregados al sistema por orden estricto de inserción.
     *
     * @param email  Correo del usuario autenticado.
     * @param limite Cantidad máxima de registros a recuperar (ej. 5).
     * @return Lista con los últimos N registros creados.
     */
    public List<RegistroDiario> obtenerUltimosRegistrosCreados(String email, int limite) {
        Usuario usuario = obtenerUsuarioActual(email);
        return registroRepository.findByIdUsuarioOrderByFechaCreacionDesc(usuario.getId(), PageRequest.of(0, limite));
    }
}