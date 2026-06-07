package com.palacios.moodnest.dto;
import lombok.Data;

/**
 * Petición para confirmar la eliminación de cuenta. Requiere contraseña por seguridad.
 */
@Data
public class EliminarCuentaRequest {
    private String password;
}