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

@Service
@RequiredArgsConstructor
public class EstadisticasService {

    private final RegistroDiarioRepository registroRepository;
    private final UsuarioRepository usuarioRepository;
    private final EtiquetaRepository etiquetaRepository;

    public EstadisticasResponse calcularEstadisticasUsuario(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<RegistroDiario> registros = registroRepository.findByIdUsuario(usuario.getId());
        EstadisticasResponse stats = new EstadisticasResponse();
        stats.setTotalRegistros(registros.size());

        if (registros.isEmpty()) return stats;

        // 1. Promedio Global Histórico
        double promedioGlobal = registros.stream().mapToInt(RegistroDiario::getPuntuacionGlobal).average().orElse(0.0);
        stats.setPromedioGlobal(Math.round(promedioGlobal * 100.0) / 100.0);

        // 2. CU11: Evolución Temporal (Ordenada cronológicamente para el gráfico de líneas)
        List<EvolucionTemporal> evolucion = registros.stream()
                .sorted(Comparator.comparing(RegistroDiario::getFechaAsignada))
                .map(r -> {
                    EvolucionTemporal et = new EvolucionTemporal();
                    et.setFecha(r.getFechaAsignada().toLocalDate().toString());
                    et.setPuntuacion(r.getPuntuacionGlobal());
                    return et;
                }).collect(Collectors.toList());
        stats.setEvolucionTemporal(evolucion);

        // 3. CU12: Promedio por Día de la Semana
        Map<String, Double> porDia = registros.stream()
                .collect(Collectors.groupingBy(
                        r -> traducirDia(r.getFechaAsignada().getDayOfWeek().name()),
                        Collectors.averagingInt(RegistroDiario::getPuntuacionGlobal)
                ));
        stats.setPromediosPorDiaSemana(porDia);

        // 4. CU12: Distribución de Rangos (¡Con los textos exactos de tu wireframe!)
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

        // 5. CU12 y CU13: Análisis de Impacto de Etiquetas (Con vs Sin)
        List<Etiqueta> misEtiquetas = etiquetaRepository.findByIdUsuarioAndActivaTrue(usuario.getId());
        Map<String, DetalleImpactoEtiqueta> impactoEtiquetas = new HashMap<>();
        
        String mejorNombre = null, peorNombre = null;
        double maxImpacto = -10.0, minImpacto = 10.0;

        for (Etiqueta etiqueta : misEtiquetas) {
            // Separamos los días que Tienen la etiqueta de los que NO la tienen
            List<RegistroDiario> diasCon = registros.stream()
                    .filter(r -> r.getEtiquetasAsociadas() != null && r.getEtiquetasAsociadas().stream().anyMatch(e -> e.getIdEtiqueta().equals(etiqueta.getId())))
                    .collect(Collectors.toList());
            
            List<RegistroDiario> diasSin = registros.stream()
                    .filter(r -> r.getEtiquetasAsociadas() == null || r.getEtiquetasAsociadas().stream().noneMatch(e -> e.getIdEtiqueta().equals(etiqueta.getId())))
                    .collect(Collectors.toList());

            // Solo calculamos si hay datos suficientes para comparar (al menos 1 día con y 1 día sin)
            if (!diasCon.isEmpty() && !diasSin.isEmpty()) {
                double promCon = diasCon.stream().mapToInt(RegistroDiario::getPuntuacionGlobal).average().orElse(0.0);
                double promSin = diasSin.stream().mapToInt(RegistroDiario::getPuntuacionGlobal).average().orElse(0.0);
                double impacto = promCon - promSin;

                DetalleImpactoEtiqueta detalle = new DetalleImpactoEtiqueta();
                detalle.setPromedioConEtiqueta(Math.round(promCon * 100.0) / 100.0);
                detalle.setPromedioSinEtiqueta(Math.round(promSin * 100.0) / 100.0);
                detalle.setDiferencia(Math.round(impacto * 100.0) / 100.0);
                
                impactoEtiquetas.put(etiqueta.getNombre(), detalle);

                // Calculamos Mejor y Peor aliado basándonos en la diferencia
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

        if (mejorNombre != null) {
            EtiquetaDestacada mejor = new EtiquetaDestacada();
            mejor.setNombre(mejorNombre);
            mejor.setImpacto(Math.round(maxImpacto * 100.0) / 100.0);
            stats.setMejorAliado(mejor);
        }

        if (peorNombre != null) {
            EtiquetaDestacada peor = new EtiquetaDestacada();
            peor.setNombre(peorNombre);
            peor.setImpacto(Math.round(minImpacto * 100.0) / 100.0);
            stats.setPeorAliado(peor);
        }

        return stats;
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