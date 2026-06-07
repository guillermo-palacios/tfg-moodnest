package com.palacios.moodnest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;


/**
 * Respuesta estándar tras una autenticación exitosa.
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
}