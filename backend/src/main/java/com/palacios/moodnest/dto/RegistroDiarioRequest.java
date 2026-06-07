package com.palacios.moodnest.dto;

import com.palacios.moodnest.models.RegistroDiario.EtiquetaAsociada;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Petición para crear o actualizar un registro diario.
 */
@Data
public class RegistroDiarioRequest {
    private LocalDateTime fechaAsignada;
    private Integer puntuacionGlobal; 
    private String comentario;
    private List<EtiquetaAsociada> etiquetasAsociadas;
}
