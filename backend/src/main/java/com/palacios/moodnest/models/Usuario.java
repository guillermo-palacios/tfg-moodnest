package com.palacios.moodnest.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Representa la identidad, seguridad y configuración del usuario en el sistema.
 */
@Data
@Document(collection = "usuarios")
public class Usuario {
    
    @Id
    private String id;
    
    private String nombre;
    
    /** Índice único para garantizar que no existan cuentas duplicadas en el sistema. */
    @Indexed(unique = true)
    private String email;
    
    /** JsonIgnore impide que la contraseña encriptada se exponga accidentalmente en las APIs. */
    @JsonIgnore
    private String password;
    
    @Field("preferencias_sistema")
    private PreferenciasSistema preferenciasSistema;
    
    /** * Mapa flexible para la personalización de la escala emocional (CU14).
     * Clave: Nivel (1-10), Valor: Descripción textual personalizada.
     */
    @Field("escala_personalizada")
    private Map<String, String> escalaPersonalizada; 
    
    @Field("racha_actual")
    private Integer rachaActual;
    
    @Field("fecha_registro")
    private LocalDateTime fechaRegistro;
    
    @Field("fecha_ultimo_registro")
    private LocalDateTime fechaUltimoRegistro;

    /**
     * Preferencias visuales persistidas para mantener el aspecto de la app entre sesiones.
     */
    @Data
    public static class PreferenciasSistema {

        private String tema; // "claro" o "oscuro"
        
        @Field("color_principal")
        private String colorPrincipal;
        
        @Field("familia_iconos")
        private String familiaIconos;
    }
}