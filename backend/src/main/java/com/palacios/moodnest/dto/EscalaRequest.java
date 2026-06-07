package com.palacios.moodnest.dto;

import lombok.Data;
import java.util.Map;

/**
 * Petición para personalizar la escala emocional del usuario.
 */
@Data
public class EscalaRequest {
    // Mapa donde la clave es el nivel (1-10) y el valor la descripción textual.
    private Map<String, String> escalaPersonalizada;
    private String familiaIconos;
}