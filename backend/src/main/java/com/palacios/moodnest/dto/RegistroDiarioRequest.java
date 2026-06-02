package com.palacios.moodnest.dto;

import com.palacios.moodnest.models.RegistroDiario.EtiquetaAsociada;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;


@Data
public class RegistroDiarioRequest {
    private LocalDateTime fechaAsignada;
    private Integer puntuacionGlobal; // Valor del 1 al 10
    private String comentario;
    private List<EtiquetaAsociada> etiquetasAsociadas;
}
