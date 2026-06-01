package com.palacios.moodnest.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;

@Data
@Document(collection = "etiquetas")
public class Etiqueta {

    @Id
    private String id;

    @Field("id_usuario")
    private String idUsuario;

    private String nombre;
    private String color;
    private Boolean activa;

    @Field("fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Field("fecha_ultimo_uso")
    private LocalDateTime fechaUltimoUso;
}