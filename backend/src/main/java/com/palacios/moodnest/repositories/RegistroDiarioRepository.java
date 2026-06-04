package com.palacios.moodnest.repositories;

import com.palacios.moodnest.models.RegistroDiario;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RegistroDiarioRepository extends MongoRepository<RegistroDiario, String> {
    // Busca los registros de un usuario entre dos fechas (Ideal para el Calendario)
    List<RegistroDiario> findByIdUsuarioAndFechaAsignadaBetween(String idUsuario, LocalDateTime inicio, LocalDateTime fin);
    
    // Busca un registro concreto asegurándose de que pertenece a ese usuario (Seguridad)
    Optional<RegistroDiario> findByIdAndIdUsuario(String id, String idUsuario);
    
    // Busca todos los registros históricos de un usuario (Necesario para las Estadísticas)
    List<RegistroDiario> findByIdUsuario(String idUsuario);

    // Borrado en cascada de todos los registros del usuario
    void deleteByIdUsuario(String idUsuario);
}
