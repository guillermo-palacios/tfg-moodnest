package com.palacios.moodnest.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.palacios.moodnest.models.Usuario;
import java.util.Optional;

/**
 * Repositorio para la gestión de persistencia de la entidad Usuario.
 */
public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    
    /**
     * Busca un usuario por su correo electrónico único.
     * Utilizado para validar el acceso en el proceso de Login.
     * * @param email El correo electrónico del usuario.
     * @return Un Optional que contiene el Usuario si existe.
     */
    Optional<Usuario> findByEmail(String email);
}