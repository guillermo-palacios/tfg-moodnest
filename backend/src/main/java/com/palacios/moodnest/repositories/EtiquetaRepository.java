package com.palacios.moodnest.repositories;

import com.palacios.moodnest.models.Etiqueta;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface EtiquetaRepository extends MongoRepository<Etiqueta, String> {
    // Devuelve todas las etiquetas que NO han sido borradas (activa = true)
    List<Etiqueta> findByIdUsuarioAndActivaTrue(String idUsuario);
    
    // Busca una etiqueta concreta asegurándose de que es del usuario
    Optional<Etiqueta> findByIdAndIdUsuario(String id, String idUsuario);
    
    // Busca si ya existe una etiqueta activa con el mismo nombre (Ignorando mayúsculas/minúsculas)
    Optional<Etiqueta> findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(String idUsuario, String nombre);
}