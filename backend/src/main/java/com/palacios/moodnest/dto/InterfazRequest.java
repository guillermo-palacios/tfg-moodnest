package com.palacios.moodnest.dto;

import lombok.Data;

/**
 * Petición para persistir la configuración visual del usuario (Modo oscuro/claro y color).
 */
@Data
public class InterfazRequest {
    private String tema;
    private String colorPrincipal; 
}
