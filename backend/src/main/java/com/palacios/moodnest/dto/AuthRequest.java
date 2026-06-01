package com.palacios.moodnest.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String nombre; // Solo se usará en el registro
    private String email;
    private String password;
}