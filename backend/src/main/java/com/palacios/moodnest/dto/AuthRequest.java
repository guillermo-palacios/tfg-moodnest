package com.palacios.moodnest.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String nombre; 
    private String email;
    private String password;
}