package com.palacios.moodnest.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidad central que encapsula el estado emocional de un día específico.
 * Contiene una lista embebida de {@link EtiquetaAsociada} para relacionar actividades.
 */
@Data
@Document(collection = "registros_diarios")
public class RegistroDiario {

    @Id
    private String id;

    @Field("id_usuario")
    private String idUsuario;

    /** Fecha real a la que el usuario asigna el estado de ánimo (puede diferir de la fecha de creación). */
    @Field("fecha_asignada")
    private LocalDateTime fechaAsignada;

    @Field("puntuacion_global")
    private Integer puntuacionGlobal;

    private String comentario;

    /** * Relación embebida (N:M desacoplada): 
     * Almacenamos el ID de la etiqueta y una puntuación opcional de impacto emocional. 
     */
    @Field("etiquetas_asociadas")
    private List<EtiquetaAsociada> etiquetasAsociadas;

    @Field("fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Field("fecha_modificacion")
    private LocalDateTime fechaModificacion;

    /**
     * Clase estática que representa la asociación entre un registro y una etiqueta.
     * Permite flexibilidad para añadir puntuaciones específicas por actividad.
     */
    @Data
    public static class EtiquetaAsociada {
        @Field("id_etiqueta")
        private String idEtiqueta;
        
        /** Puntuación opcional que el usuario asigna específicamente a esta actividad. */
        private Integer puntuacion; 
    }
}