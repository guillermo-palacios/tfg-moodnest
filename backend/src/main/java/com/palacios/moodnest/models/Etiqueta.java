package com.palacios.moodnest.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;

/**
 * Representa una categoría o actividad personalizada por el usuario.
 * Utiliza el patrón de borrado lógico (campo 'activa') para garantizar que los registros 
 * históricos que hacen referencia a esta etiqueta no pierdan su contexto.
 */
@Data
@Document(collection = "etiquetas")
public class Etiqueta {

    @Id
    private String id;

    /** Referencia al usuario propietario de la etiqueta. */
    @Field("id_usuario")
    private String idUsuario;

    private String nombre;
    private String color;
    
    /** * Flag para el borrado lógico:
     * true = visible en el selector; false = archivada (solo visible en el histórico). 
     */
    private Boolean activa;

    @Field("fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Field("fecha_ultimo_uso")
    private LocalDateTime fechaUltimoUso;
}