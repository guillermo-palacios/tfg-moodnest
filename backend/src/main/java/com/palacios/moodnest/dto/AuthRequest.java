package com.palacios.moodnest.dto;

import lombok.Data;

/**
 * Objeto de transferencia para las peticiones de registro e inicio de sesión.
 */
@Data
public class AuthRequest {
    private String nombre; 
    private String email;
    private String password;
}