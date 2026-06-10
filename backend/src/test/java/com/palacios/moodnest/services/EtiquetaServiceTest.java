package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.EtiquetaRequest;
import com.palacios.moodnest.models.Etiqueta;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.EtiquetaRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EtiquetaServiceTest {

    @Mock
    private EtiquetaRepository etiquetaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private EtiquetaService etiquetaService;

    private Usuario usuarioMock;
    private EtiquetaRequest requestMock;

    @BeforeEach
    void setUp() {
        // Preparamos al usuario y la petición estándar antes de cada prueba
        usuarioMock = new Usuario();
        usuarioMock.setId("user-123");
        usuarioMock.setEmail("test@email.com");

        requestMock = new EtiquetaRequest();
        requestMock.setNombre(" Deporte "); // Ponemos espacios para probar la limpieza (trim)
        requestMock.setColor("#FF5733");
    }

    @Test
    void crearEtiqueta_DatosValidos_LimpiaNombreYGuardaCorrectamente() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        when(etiquetaRepository.findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(
                eq(usuarioMock.getId()), eq("Deporte"))).thenReturn(Optional.empty()); // No hay duplicados

        when(etiquetaRepository.save(any(Etiqueta.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Etiqueta resultado = etiquetaService.crearEtiqueta(usuarioMock.getEmail(), requestMock);

        // Assert
        assertNotNull(resultado);
        assertEquals("Deporte", resultado.getNombre(), "El nombre debe guardarse sin los espacios en blanco de los extremos");
        assertTrue(resultado.getActiva(), "Las nuevas etiquetas deben nacer siempre activas");
        verify(etiquetaRepository, times(1)).save(any(Etiqueta.class));
    }

    @Test
    void crearEtiqueta_NombreDuplicado_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        
        // Simulamos que la base de datos dice: "¡Oye, ya tengo una etiqueta activa llamada Deporte para este usuario!"
        when(etiquetaRepository.findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(
                eq(usuarioMock.getId()), eq("Deporte"))).thenReturn(Optional.of(new Etiqueta()));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            etiquetaService.crearEtiqueta(usuarioMock.getEmail(), requestMock);
        });

        assertTrue(exception.getMessage().contains("Ya existe una etiqueta activa"));
        verify(etiquetaRepository, never()).save(any()); // El sistema frena la creación
    }

    @Test
    void crearEtiqueta_NombreVacio_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        requestMock.setNombre("   "); // Un nombre de solo espacios es inválido

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            etiquetaService.crearEtiqueta(usuarioMock.getEmail(), requestMock);
        });

        assertTrue(exception.getMessage().contains("no puede estar vacío"));
        verify(etiquetaRepository, never()).save(any());
    }

    @Test
    void eliminarEtiqueta_Exito_RealizaBorradoLogico() {
        // Arrange
        String idEtiquetaTarget = "etiq-999";
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        
        Etiqueta etiquetaExistente = new Etiqueta();
        etiquetaExistente.setId(idEtiquetaTarget);
        etiquetaExistente.setActiva(true);
        
        when(etiquetaRepository.findByIdAndIdUsuario(idEtiquetaTarget, usuarioMock.getId()))
                .thenReturn(Optional.of(etiquetaExistente));

        // Act
        etiquetaService.eliminarEtiqueta(usuarioMock.getEmail(), idEtiquetaTarget);

        // Assert: Capturamos la etiqueta para ver qué intentó guardar el servicio
        ArgumentCaptor<Etiqueta> etiquetaCaptor = ArgumentCaptor.forClass(Etiqueta.class);
        verify(etiquetaRepository).save(etiquetaCaptor.capture());
        
        // ¡Magia! Comprobamos que NUNCA se llamó al método delete() físico de la BD
        verify(etiquetaRepository, never()).delete(any()); 

        Etiqueta etiquetaActualizada = etiquetaCaptor.getValue();
        assertFalse(etiquetaActualizada.getActiva(), "La etiqueta debe ser desactivada (borrado lógico), no eliminada físicamente");
    }

    @Test
    void actualizarEtiqueta_SinPermisos_LanzaExcepcion() {
        // Arrange
        when(usuarioRepository.findByEmail(usuarioMock.getEmail())).thenReturn(Optional.of(usuarioMock));
        
        // Simulamos que el usuario intenta editar una etiqueta de la que no es dueño
        when(etiquetaRepository.findByIdAndIdUsuario("etiq-secreta", usuarioMock.getId()))
                .thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            etiquetaService.actualizarEtiqueta(usuarioMock.getEmail(), "etiq-secreta", requestMock);
        });

        assertTrue(exception.getMessage().contains("no encontrada o sin permisos"));
        verify(etiquetaRepository, never()).save(any());
    }
}