package com.palacios.moodnest.dto;

import lombok.Data;
import java.util.Map;

@Data
public class EscalaRequest {
    // Recibirá un mapa con los 10 descriptores, ej: {"1": "Terrible", "5": "Normal", "10": "Excelente"}
    private Map<String, String> escalaPersonalizada;
    private String familiaIconos;
}