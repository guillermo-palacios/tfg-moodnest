package com.palacios.moodnest.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.palacios.moodnest.models.Usuario;
import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByEmail(String email);
}
