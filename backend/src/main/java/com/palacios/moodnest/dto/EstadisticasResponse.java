package com.palacios.moodnest.dto;

import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
public class EstadisticasResponse {
    private long totalRegistros;
    private double promedioGlobal;
    private Map<String, Double> promediosPorDiaSemana;
    private Map<String, Long> distribucionRangos;
    
    private List<EvolucionTemporal> evolucionTemporal;
    
    private Map<String, DetalleImpactoEtiqueta> impactoEtiquetas; 
    
    private EtiquetaDestacada mejorAliado;
    private EtiquetaDestacada peorAliado;

    @Data
    public static class EvolucionTemporal {
        private String fecha;
        private int puntuacion;
    }

    @Data
    public static class DetalleImpactoEtiqueta {
        private double promedioConEtiqueta;
        private double promedioSinEtiqueta;
        private double diferencia;
    }

    @Data
    public static class EtiquetaDestacada {
        private String nombre;
        private double impacto;
    }
}