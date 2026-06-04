package com.palacios.moodnest.dto;
import lombok.Data;

@Data
public class PerfilUpdateRequest {
    private String nombre;
    private String passwordActual;
    private String nuevaPassword;
}