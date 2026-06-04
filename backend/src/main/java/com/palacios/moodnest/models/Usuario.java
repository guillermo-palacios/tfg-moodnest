package com.palacios.moodnest.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.Map;

// Data -> Genera las funciones básicas (Getters, Setters, etc)
@Data
@Document(collection = "usuarios")
public class Usuario {
    
    @Id
    private String id;
    
    private String nombre;
    
    @Indexed(unique = true) // El email debe ser único
    private String email;
    
    @JsonIgnore
    private String password;
    
    @Field("preferencias_sistema")
    private PreferenciasSistema preferenciasSistema;
    
    @Field("escala_personalizada")
    private Map<String, String> escalaPersonalizada; // REVISAR LO DEL MAP
    
    @Field("racha_actual")
    private Integer rachaActual;
    
    @Field("fecha_registro")
    private LocalDateTime fechaRegistro;
    
    @Field("fecha_ultimo_registro")
    private LocalDateTime fechaUltimoRegistro;

    // Clase interna para respetar la estructura anidada de preferencias
    @Data
    public static class PreferenciasSistema {

        private String tema;
        
        @Field("color_principal")
        private String colorPrincipal;
        
        @Field("familia_iconos")
        private String familiaIconos;
    }
}