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

        // LA SOLUCIÓN SENCILLA: Comparamos solo la FECHA (LocalDate), ignorando las horas
        if (request.getFechaAsignada().toLocalDate().isAfter(LocalDate.now())) {
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

        // --- LÓGICA DE LA RACHA ---
        LocalDate fechaNuevoRegistro = request.getFechaAsignada().toLocalDate();
        LocalDate fechaUltimo = usuario.getFechaUltimoRegistro() != null
                ? usuario.getFechaUltimoRegistro().toLocalDate()
                : null;
        
        int rachaActual = usuario.getRachaActual() != null ? usuario.getRachaActual() : 0;

        if (fechaUltimo == null) {
            usuario.setRachaActual(1);
            usuario.setFechaUltimoRegistro(request.getFechaAsignada());
        } else {
            long diasDiferencia = ChronoUnit.DAYS.between(fechaUltimo, fechaNuevoRegistro);

            if (diasDiferencia == 1) {
                usuario.setRachaActual(rachaActual + 1);
                usuario.setFechaUltimoRegistro(request.getFechaAsignada());
            } else if (diasDiferencia > 1) {
                usuario.setRachaActual(1);
                usuario.setFechaUltimoRegistro(request.getFechaAsignada());
            } else if (diasDiferencia == 0) {
                if (rachaActual == 0) usuario.setRachaActual(1); 
                usuario.setFechaUltimoRegistro(request.getFechaAsignada());
            }
        }

        usuarioRepository.save(usuario); 
        return registroRepository.save(registro);
    }

    // CU7: Editar un registro existente
    public RegistroDiario actualizarRegistro(String email, String idRegistro, RegistroDiarioRequest request) {
        Usuario usuario = getUsuarioActual(email);

        RegistroDiario registro = registroRepository.findByIdAndIdUsuario(idRegistro, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Registro no encontrado o no tienes permisos para editarlo"));

        // LA SOLUCIÓN SENCILLA: Igual aquí, solo miramos LocalDate
        if (request.getFechaAsignada().toLocalDate().isAfter(LocalDate.now())) {
            throw new RuntimeException("No se pueden asignar fechas futuras");
        }

        registro.setFechaAsignada(request.getFechaAsignada());
        registro.setPuntuacionGlobal(request.getPuntuacionGlobal());
        registro.setComentario(request.getComentario());
        registro.setEtiquetasAsociadas(request.getEtiquetasAsociadas());
        registro.setFechaModificacion(LocalDateTime.now());

        return registroRepository.save(registro);
    }

    // CU7: Eliminar un registro de forma permanente
    public void eliminarRegistro(String email, String idRegistro) {
        Usuario usuario = getUsuarioActual(email);

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