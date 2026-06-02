package com.palacios.moodnest.dto;

import lombok.Data;

@Data
public class InterfazRequest {
    private String tema; // "claro" o "oscuro"
    private String colorPrincipal; // Código hexadecimal, ej: "#5B61C4"
}
