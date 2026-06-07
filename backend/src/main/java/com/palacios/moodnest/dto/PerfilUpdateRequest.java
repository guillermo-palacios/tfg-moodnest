package com.palacios.moodnest.dto;
import lombok.Data;


/**
 * Petición para actualizar datos de perfil. Nueva contraseña opcional.
 */
@Data
public class PerfilUpdateRequest {
    private String nombre;
    private String passwordActual;
    private String nuevaPassword;
}