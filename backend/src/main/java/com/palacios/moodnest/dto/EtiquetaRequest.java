package com.palacios.moodnest.dto;

import lombok.Data;

/**
 * Petición para definir una nueva etiqueta en el catálogo personal.
 */
@Data
public class EtiquetaRequest {
    private String nombre;
    private String color;
}