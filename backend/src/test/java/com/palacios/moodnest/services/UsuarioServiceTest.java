package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.EscalaRequest;
import com.palacios.moodnest.dto.InterfazRequest;
import com.palacios.moodnest.dto.PerfilUpdateRequest;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.EtiquetaRepository;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RegistroDiarioRepository registroRepository;

    @Mock
    private EtiquetaRepository etiquetaRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuarioMock;

    @BeforeEach
    void setUp() {
        // Preparamos un usuario estándar para todas las pruebas
        usuarioMock = new Usuario();
        usuarioMock.setId("user-123");
        usuarioMock.setEmail("test@email.com");
        usuarioMock.setNombre("Guillermo");
        usuarioMock.setPassword("hash_de_la_password_encriptada");
    }

    @Test
    void actualizarPerfil_SoloNombre_ActualizaYGuarda() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        PerfilUpdateRequest request = new PerfilUpdateRequest();
        request.setNombre(" Nuevo Nombre "); // Con espacios para probar el trim()

        // Act
        Usuario resultado = usuarioService.actualizarPerfil(usuarioMock.getEmail(), request);

        // Assert
        assertEquals("Nuevo Nombre", resultado.getNombre(), "El nombre debe limpiarse y actualizarse");
        verify(passwordEncoder, never()).matches(any(), any()); // No debe tocar las contraseñas
        verify(usuarioRepository, times(1)).save(usuarioMock);
    }

    @Test
    void actualizarPerfil_CambioContrasena_Exito() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        // Simulamos que la contraseña actual enviada coincide con la de la BD
        when(passwordEncoder.matches("miPasswordActual", usuarioMock.getPassword())).thenReturn(true);
        // Simulamos el proceso de encriptar la nueva
        when(passwordEncoder.encode("nuevaPassword123")).thenReturn("nuevo_hash_seguro");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        PerfilUpdateRequest request = new PerfilUpdateRequest();
        request.setPasswordActual("miPasswordActual");
        request.setNuevaPassword("nuevaPassword123");

        // Act
        Usuario resultado = usuarioService.actualizarPerfil(usuarioMock.getEmail(), request);

        // Assert
        assertEquals("nuevo_hash_seguro", resultado.getPassword(), "La contraseña debe haber sido encriptada y actualizada");
        verify(usuarioRepository, times(1)).save(usuarioMock);
    }

    @Test
    void actualizarPerfil_ContrasenaActualIncorrecta_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        // Simulamos que el usuario se equivoca al poner su contraseña actual
        when(passwordEncoder.matches("passwordEquivocada", usuarioMock.getPassword())).thenReturn(false);

        PerfilUpdateRequest request = new PerfilUpdateRequest();
        request.setPasswordActual("passwordEquivocada");
        request.setNuevaPassword("nuevaPassword123");

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.actualizarPerfil(usuarioMock.getEmail(), request);
        });

        assertTrue(exception.getMessage().contains("incorrecta"));
        verify(passwordEncoder, never()).encode(anyString()); // Frena antes de encriptar nada
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void eliminarCuenta_PasswordCorrecta_RealizaBorradoEnCascada() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(passwordEncoder.matches("miPasswordSegura", usuarioMock.getPassword())).thenReturn(true);

        // Act
        usuarioService.eliminarCuenta(usuarioMock.getEmail(), "miPasswordSegura");

        // Assert: ¡Comprobamos la regla de integridad referencial!
        verify(registroRepository, times(1)).deleteByIdUsuario(usuarioMock.getId());
        verify(etiquetaRepository, times(1)).deleteByIdUsuario(usuarioMock.getId());
        verify(usuarioRepository, times(1)).delete(usuarioMock); // El usuario muere el último
    }

    @Test
    void guardarInterfazPersonalizada_SinPreferenciasPrevias_CreaSubdocumentoYGuarda() {
        // Arrange
        // Aseguramos que las preferencias son nulas (como en una cuenta antigua)
        usuarioMock.setPreferenciasSistema(null); 
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        InterfazRequest request = new InterfazRequest();
        request.setTema("oscuro");
        request.setColorPrincipal("#123456");

        // Act
        Usuario resultado = usuarioService.guardarInterfazPersonalizada(usuarioMock.getEmail(), request);

        // Assert
        assertNotNull(resultado.getPreferenciasSistema(), "El servicio debe instanciar el objeto de preferencias si era nulo");
        assertEquals("oscuro", resultado.getPreferenciasSistema().getTema());
        assertEquals("#123456", resultado.getPreferenciasSistema().getColorPrincipal());
    }

    @Test
    void guardarEscalaPersonalizada_DescriptoresDemasiadoLargos_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));

        EscalaRequest request = new EscalaRequest();
        Map<String, String> escalaTrampa = new HashMap<>();
        escalaTrampa.put("1", "Este es un texto ridículamente largo que romperá toda la interfaz gráfica de ChartJS");
        request.setEscalaPersonalizada(escalaTrampa);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.guardarEscalaPersonalizada(usuarioMock.getEmail(), request);
        });

        assertTrue(exception.getMessage().contains("no pueden superar los 30 caracteres"));
        verify(usuarioRepository, never()).save(any());
    }
}