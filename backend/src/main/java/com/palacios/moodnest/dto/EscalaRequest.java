package com.palacios.moodnest.dto;

import lombok.Data;
import java.util.Map;

@Data
public class EscalaRequest {
    private Map<String, String> escalaPersonalizada;
    private String familiaIconos;
}