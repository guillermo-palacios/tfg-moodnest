package com.palacios.moodnest.repositories;

import com.palacios.moodnest.models.RegistroDiario;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de persistencia de los registros de estado de ánimo.
 */
public interface RegistroDiarioRepository extends MongoRepository<RegistroDiario, String> {
    
    /**
     * Recupera registros en un rango temporal dado, filtrados por el ID de usuario.
     */
    List<RegistroDiario> findByIdUsuarioAndFechaAsignadaBetween(String idUsuario, LocalDateTime inicio, LocalDateTime fin);
    
    /** 
     * Busca por usuario, ordena por fechaCreacion descendente y permite paginar/limitar
     */
    List<RegistroDiario> findByIdUsuarioOrderByFechaCreacionDesc(String idUsuario, Pageable pageable);

    /**
     * Busca un registro por ID asegurando la pertenencia al usuario.
     */
    Optional<RegistroDiario> findByIdAndIdUsuario(String id, String idUsuario);
    
    /**
     * Obtiene el historial completo de un usuario.
     */
    List<RegistroDiario> findByIdUsuario(String idUsuario);

    /**
     * Ejecuta un borrado en cascada (físico) al eliminar la cuenta de un usuario.
     */
    void deleteByIdUsuario(String idUsuario);
}