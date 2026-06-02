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
    
    // CU11: Datos para el gráfico de líneas temporal
    private List<EvolucionTemporal> evolucionTemporal;
    
    // CU13: Datos para el gráfico de barras de impacto (Con vs Sin)
    private Map<String, DetalleImpactoEtiqueta> impactoEtiquetas; 
    
    // CU12: Los recuadros superiores de Mejor/Peor aliado
    private EtiquetaDestacada mejorAliado;
    private EtiquetaDestacada peorAliado;

    // --- Subclases para estructurar el JSON ---

    @Data
    public static class EvolucionTemporal {
        private String fecha; // Formato YYYY-MM-DD
        private int puntuacion;
    }

    @Data
    public static class DetalleImpactoEtiqueta {
        private double promedioConEtiqueta;
        private double promedioSinEtiqueta;
        private double diferencia; // Ej: +2.0
    }

    @Data
    public static class EtiquetaDestacada {
        private String nombre;
        private double impacto;
    }
}