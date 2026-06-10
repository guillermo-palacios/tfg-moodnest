package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.RegistroDiarioRequest;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistroDiarioServiceTest {

    @Mock
    private RegistroDiarioRepository registroRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private RegistroDiarioService registroService;

    private Usuario usuarioMock;
    private RegistroDiarioRequest requestMock;

    @BeforeEach
    void setUp() {
        // Arrange general: Preparamos datos básicos antes de cada test
        usuarioMock = new Usuario();
        usuarioMock.setId("user-123");
        usuarioMock.setEmail("test@email.com");

        requestMock = new RegistroDiarioRequest();
        requestMock.setFechaAsignada(LocalDateTime.now());
        requestMock.setPuntuacionGlobal(8);
        requestMock.setComentario("Hoy ha sido un buen día");
    }

    @Test
    void crearRegistro_Exito_GuardaYRecalculaRacha() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(registroRepository.save(any(RegistroDiario.class))).thenReturn(new RegistroDiario());
        when(registroRepository.findByIdUsuario(usuarioMock.getId())).thenReturn(List.of()); // Sin historial previo

        // Act
        RegistroDiario resultado = registroService.crearRegistro(usuarioMock.getEmail(), requestMock);

        // Assert
        assertNotNull(resultado, "El registro no debe ser nulo");
        verify(registroRepository, times(1)).save(any(RegistroDiario.class));
        verify(usuarioRepository, times(1)).save(any(Usuario.class)); // Se guarda el usuario para actualizar la racha
    }

    @Test
    void crearRegistro_ConFechaFutura_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        requestMock.setFechaAsignada(LocalDateTime.now().plusDays(2)); // Fecha trampa

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            registroService.crearRegistro(usuarioMock.getEmail(), requestMock);
        });

        assertTrue(exception.getMessage().contains("fechas futuras"));
        verify(registroRepository, never()).save(any()); // Comprobamos que el sistema frenó la petición
    }

    @Test
    void actualizarRegistro_SinPermisosOInexistente_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        
        // Simulamos que la base de datos no encuentra ese registro para ese usuario
        when(registroRepository.findByIdAndIdUsuario("reg-999", usuarioMock.getId()))
                .thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            registroService.actualizarRegistro(usuarioMock.getEmail(), "reg-999", requestMock);
        });

        assertTrue(exception.getMessage().contains("no tienes permisos"));
        verify(registroRepository, never()).save(any());
    }

    @Test
    void recalcularRacha_ConTresDiasConsecutivos_RachaEsTres() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(registroRepository.save(any(RegistroDiario.class))).thenReturn(new RegistroDiario());

        // Simulamos un historial perfecto: Hoy, ayer y anteayer
        RegistroDiario r1 = new RegistroDiario(); r1.setFechaAsignada(LocalDateTime.now());
        RegistroDiario r2 = new RegistroDiario(); r2.setFechaAsignada(LocalDateTime.now().minusDays(1));
        RegistroDiario r3 = new RegistroDiario(); r3.setFechaAsignada(LocalDateTime.now().minusDays(2));
        
        when(registroRepository.findByIdUsuario(usuarioMock.getId())).thenReturn(List.of(r1, r2, r3));

        // Act
        registroService.crearRegistro(usuarioMock.getEmail(), requestMock);

        // Assert: Capturamos el usuario modificado para ver qué racha se le asignó
        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(usuarioCaptor.capture());

        Usuario usuarioActualizado = usuarioCaptor.getValue();
        assertEquals(3, usuarioActualizado.getRachaActual(), "La racha debe ser exactamente 3 días");
    }

    @Test
    void recalcularRacha_MasDeUnDiaSinRegistros_RachaEsCero() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(registroRepository.findByIdAndIdUsuario("reg-1", usuarioMock.getId()))
                .thenReturn(Optional.of(new RegistroDiario()));

        // Simulamos que el usuario borra su registro de hoy, y su anterior registro fue hace 3 días
        RegistroDiario registroViejo = new RegistroDiario(); 
        registroViejo.setFechaAsignada(LocalDateTime.now().minusDays(3));
        
        when(registroRepository.findByIdUsuario(usuarioMock.getId())).thenReturn(List.of(registroViejo));

        // Act
        registroService.eliminarRegistro(usuarioMock.getEmail(), "reg-1");

        // Assert
        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(usuarioCaptor.capture());

        Usuario usuarioActualizado = usuarioCaptor.getValue();
        assertEquals(0, usuarioActualizado.getRachaActual(), "Al haber un hueco mayor a un día, la racha debe reiniciarse a 0");
    }
}