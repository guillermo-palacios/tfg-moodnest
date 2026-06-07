package com.palacios.moodnest.repositories;

import com.palacios.moodnest.models.Etiqueta;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión del catálogo de etiquetas personales.
 */
public interface EtiquetaRepository extends MongoRepository<Etiqueta, String> {
    
    /**
     * Recupera únicamente las etiquetas activas para su selección en nuevos registros.
     */
    List<Etiqueta> findByIdUsuarioAndActivaTrue(String idUsuario);

    /**
     * Recupera el catálogo completo (incluyendo etiquetas archivadas/inactivas).
     */
    List<Etiqueta> findByIdUsuario(String idUsuario);
    
    /**
     * Valida la existencia y pertenencia de una etiqueta específica.
     */
    Optional<Etiqueta> findByIdAndIdUsuario(String id, String idUsuario);
    
    /**
     * Valida la unicidad de nombre dentro del catálogo del usuario, ignorando mayúsculas/minúsculas.
     */
    Optional<Etiqueta> findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(String idUsuario, String nombre);

    /**
     * Borrado en cascada para limpiar las etiquetas vinculadas al eliminar la cuenta.
     */
    void deleteByIdUsuario(String idUsuario);
}