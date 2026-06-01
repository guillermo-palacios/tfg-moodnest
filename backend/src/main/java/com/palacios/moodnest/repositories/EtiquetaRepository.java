package com.palacios.moodnest.repositories;

import com.palacios.moodnest.models.Etiqueta;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface EtiquetaRepository extends MongoRepository<Etiqueta, String> {
    List<Etiqueta> findByIdUsuarioAndActivaTrue(String idUsuario);
}