package com.palacios.moodnest.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "registros_diarios")
public class RegistroDiario {

    @Id
    private String id;

    @Field("id_usuario")
    private String idUsuario;

    @Field("fecha_asignada")
    private LocalDateTime fechaAsignada;

    @Field("puntuacion_global")
    private Integer puntuacionGlobal;

    private String comentario;

    @Field("etiquetas_asociadas")
    private List<EtiquetaAsociada> etiquetasAsociadas;

    @Field("fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Field("fecha_modificacion")
    private LocalDateTime fechaModificacion;

    @Data
    public static class EtiquetaAsociada {
        @Field("id_etiqueta")
        private String idEtiqueta;
        
        private Integer puntuacion; 
    }
}
