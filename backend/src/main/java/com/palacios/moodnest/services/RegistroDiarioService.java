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
import java.time.temporal.ChronoUnit; // Importante para calcular los días matemáticamente
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

        // --- LÓGICA DE LA RACHA ---
        // Extraemos solo el "Día" (ignoramos las horas/minutos para no falsear el cálculo)
        LocalDate fechaNuevoRegistro = request.getFechaAsignada().toLocalDate();
        LocalDate fechaUltimo = usuario.getFechaUltimoRegistro() != null
                ? usuario.getFechaUltimoRegistro().toLocalDate()
                : null;
        
        int rachaActual = usuario.getRachaActual() != null ? usuario.getRachaActual() : 0;

        if (fechaUltimo == null) {
            // 1. Es su primer registro histórico
            usuario.setRachaActual(1);
            usuario.setFechaUltimoRegistro(request.getFechaAsignada());
        } else {
            long diasDiferencia = ChronoUnit.DAYS.between(fechaUltimo, fechaNuevoRegistro);

            if (diasDiferencia == 1) {
                // 2. Registro consecutivo (Justo al día siguiente) -> Sumamos 1
                usuario.setRachaActual(rachaActual + 1);
                usuario.setFechaUltimoRegistro(request.getFechaAsignada());
            } else if (diasDiferencia > 1) {
                // 3. Han pasado 2 o más días -> Se rompe la racha y vuelve a 1
                usuario.setRachaActual(1);
                usuario.setFechaUltimoRegistro(request.getFechaAsignada());
            } else if (diasDiferencia == 0) {
                // 4. Ya había registrado algo HOY -> Mantenemos la racha igual
                if (rachaActual == 0) { 
                    usuario.setRachaActual(1); // Por si venía de un fallo previo en 0
                }
                usuario.setFechaUltimoRegistro(request.getFechaAsignada());
            }
            // 5. Si diasDiferencia < 0 (es un registro del pasado para rellenar el calendario): 
            // Ignoramos la racha y no tocamos la fechaUltimoRegistro para no estropear el progreso actual.
        }

        // Guardamos el usuario con su nueva racha calculada
        usuarioRepository.save(usuario); 
        
        // Guardamos la nota en sí
        return registroRepository.save(registro);
    }

    // CU7: Editar un registro existente
    public RegistroDiario actualizarRegistro(String email, String idRegistro, RegistroDiarioRequest request) {
        Usuario usuario = getUsuarioActual(email);

        RegistroDiario registro = registroRepository.findByIdAndIdUsuario(idRegistro, usuario.getId())
                .orElseThrow(() -> new RuntimeException("Registro no encontrado o no tienes permisos para editarlo"));

        if (request.getFechaAsignada().isAfter(LocalDateTime.now())) {
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