package com.palacios.moodnest.services;

import com.palacios.moodnest.dto.EstadisticasResponse;
import com.palacios.moodnest.dto.EstadisticasResponse.DetalleImpactoEtiqueta;
import com.palacios.moodnest.dto.EstadisticasResponse.EtiquetaDestacada;
import com.palacios.moodnest.dto.EstadisticasResponse.EvolucionTemporal;
import com.palacios.moodnest.models.Etiqueta;
import com.palacios.moodnest.models.RegistroDiario;
import com.palacios.moodnest.models.Usuario;
import com.palacios.moodnest.repositories.EtiquetaRepository;
import com.palacios.moodnest.repositories.RegistroDiarioRepository;
import com.palacios.moodnest.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio principal de Inteligencia de Negocio (BI).
 * Encargado de procesar el histórico de datos del usuario y extraer métricas, 
 * promedios y conclusiones de impacto emocional.
 */
@Service
@RequiredArgsConstructor
public class EstadisticasService {

    private final RegistroDiarioRepository registroRepository;
    private final UsuarioRepository usuarioRepository;
    private final EtiquetaRepository etiquetaRepository;

    /**
     * Calcula en tiempo real el panel completo de estadísticas para un usuario.
     *
     * @param email Correo del usuario en sesión.
     * @return Objeto EstadisticasResponse con todos los cálculos consolidados.
     */
    public EstadisticasResponse calcularEstadisticasUsuario(String email) {
        Usuario usuario = obtenerUsuario(email);
        List<RegistroDiario> registros = registroRepository.findByIdUsuario(usuario.getId());
        
        EstadisticasResponse stats = new EstadisticasResponse();
        stats.setTotalRegistros(registros.size());

        // Cláusula de guarda: Si el usuario es nuevo y no tiene registros, 
        // devolvemos el objeto vacío para que el Frontend renderice los "Empty States".
        if (registros.isEmpty()) {
            return stats;
        }

        // 1. Promedio Global Histórico
        double promedioGlobal = registros.stream()
                .mapToInt(RegistroDiario::getPuntuacionGlobal)
                .average()
                .orElse(0.0);
        stats.setPromedioGlobal(redondear(promedioGlobal));

        // 2. Evolución Temporal
        // Ordenamos estrictamente por fecha para garantizar que el gráfico de líneas del Frontend 
        // no dibuje trazos cruzados hacia atrás en el tiempo.
        List<EvolucionTemporal> evolucion = registros.stream()
                .sorted(Comparator.comparing(RegistroDiario::getFechaAsignada))
                .map(r -> {
                    EvolucionTemporal et = new EvolucionTemporal();
                    et.setFecha(r.getFechaAsignada().toLocalDate().toString());
                    et.setPuntuacion(r.getPuntuacionGlobal());
                    return et;
                }).collect(Collectors.toList());
        stats.setEvolucionTemporal(evolucion);

        // 3. Promedio por Día de la Semana
        // Agrupamos los registros según el día (Lunes, Martes...) y calculamos la media de cada grupo.
        Map<String, Double> porDia = registros.stream()
                .collect(Collectors.groupingBy(
                        r -> traducirDia(r.getFechaAsignada().getDayOfWeek().name()),
                        Collectors.averagingInt(RegistroDiario::getPuntuacionGlobal)
                ));
        stats.setPromediosPorDiaSemana(porDia);

        // 4. Distribución de Rangos (Algoritmo Heurístico)
        // Clasificamos cada nota numérica en una categoría semántica basada en los requisitos del sistema.
        Map<String, Long> distribucion = registros.stream()
                .collect(Collectors.groupingBy(r -> {
                    int p = r.getPuntuacionGlobal();
                    if (p <= 2) return "Días Terribles";
                    if (p <= 4) return "Días Malos";
                    if (p <= 6) return "Días Normales";
                    if (p <= 8) return "Días Buenos";
                    return "Días Increíbles";
                }, Collectors.counting()));
        stats.setDistribucionRangos(distribucion);

        // 5. Análisis de Impacto de Etiquetas (Matemática diferencial)
        calcularImpactoEtiquetas(usuario.getId(), registros, stats);

        return stats;
    }

    /**
     * Calcula la desviación matemática (positiva o negativa) que produce cada etiqueta 
     * en comparación con los días en los que no se realiza dicha actividad.
     *
     * @param usuarioId ID del usuario.
     * @param registros Histórico completo de registros.
     * @param stats     Objeto de respuesta donde se inyectarán los resultados.
     */
    private void calcularImpactoEtiquetas(String usuarioId, List<RegistroDiario> registros, EstadisticasResponse stats) {
        List<Etiqueta> misEtiquetas = etiquetaRepository.findByIdUsuarioAndActivaTrue(usuarioId);
        Map<String, DetalleImpactoEtiqueta> impactoEtiquetas = new HashMap<>();
        
        String mejorNombre = null;
        String peorNombre = null;
        double maxImpacto = -10.0;
        double minImpacto = 10.0;

        for (Etiqueta etiqueta : misEtiquetas) {
            
            // OPTIMIZACIÓN DE RENDIMIENTO: En lugar de iterar la lista entera dos veces (una para buscar
            // los días CON etiqueta y otra para los días SIN ella), usamos partitioningBy para 
            // dividir la lista en dos grupos en una única pasada O(N).
            Map<Boolean, List<RegistroDiario>> particion = registros.stream()
                    .collect(Collectors.partitioningBy(r -> 
                            r.getEtiquetasAsociadas() != null && 
                            r.getEtiquetasAsociadas().stream()
                             .anyMatch(e -> e.getIdEtiqueta().equals(etiqueta.getId()))
                    ));
            
            List<RegistroDiario> diasCon = particion.get(true);
            List<RegistroDiario> diasSin = particion.get(false);

            // Requisito estadístico: Solo tiene sentido calcular el impacto si el usuario 
            // tiene muestras de ambos escenarios (días haciéndolo vs días sin hacerlo).
            if (!diasCon.isEmpty() && !diasSin.isEmpty()) {
                double promCon = diasCon.stream().mapToInt(RegistroDiario::getPuntuacionGlobal).average().orElse(0.0);
                double promSin = diasSin.stream().mapToInt(RegistroDiario::getPuntuacionGlobal).average().orElse(0.0);
                
                // La diferencia neta indica si la actividad suma o resta a su bienestar
                double impacto = promCon - promSin;

                DetalleImpactoEtiqueta detalle = new DetalleImpactoEtiqueta();
                detalle.setPromedioConEtiqueta(redondear(promCon));
                detalle.setPromedioSinEtiqueta(redondear(promSin));
                detalle.setDiferencia(redondear(impacto));
                
                impactoEtiquetas.put(etiqueta.getNombre(), detalle);

                // Evaluamos dinámicamente si es el mayor impacto positivo o negativo registrado hasta ahora
                if (impacto > maxImpacto) {
                    maxImpacto = impacto;
                    mejorNombre = etiqueta.getNombre();
                }
                if (impacto < minImpacto) {
                    minImpacto = impacto;
                    peorNombre = etiqueta.getNombre();
                }
            }
        }

        stats.setImpactoEtiquetas(impactoEtiquetas);

        // Si se encontraron extremos estadísticos válidos, los adjuntamos a la respuesta
        if (mejorNombre != null) {
            EtiquetaDestacada mejor = new EtiquetaDestacada();
            mejor.setNombre(mejorNombre);
            mejor.setImpacto(redondear(maxImpacto));
            stats.setMejorAliado(mejor);
        }

        if (peorNombre != null) {
            EtiquetaDestacada peor = new EtiquetaDestacada();
            peor.setNombre(peorNombre);
            peor.setImpacto(redondear(minImpacto));
            stats.setPeorAliado(peor);
        }
    }

    // --- MÉTODOS DE APOYO (Helpers) ---

    private Usuario obtenerUsuario(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la generación de estadísticas"));
    }

    /**
     * Redondea un valor decimal a dos cifras significativas para una visualización limpia en el cliente.
     */
    private double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private String traducirDia(String diaIngles) {
        switch (diaIngles) {
            case "MONDAY": return "Lunes";
            case "TUESDAY": return "Martes";
            case "WEDNESDAY": return "Miércoles";
            case "THURSDAY": return "Jueves";
            case "FRIDAY": return "Viernes";
            case "SATURDAY": return "Sábado";
            case "SUNDAY": return "Domingo";
            default: return diaIngles;
        }
    }
}