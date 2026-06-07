package com.palacios.moodnest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Filtro de seguridad que intercepta peticiones HTTP para validar la identidad mediante JWT.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    /**
     * Flujo de filtrado:
     * 1. Extrae el token de la cabecera 'Authorization'.
     * 2. Valida la integridad criptográfica.
     * 3. Establece la identidad en el contexto de seguridad de Spring.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");

        // Si no hay token, delegamos al siguiente filtro de seguridad (que decidirá si el acceso está permitido)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        
        try {
            // Extracción y validación
            final String userEmail = jwtService.extraerEmail(jwt);

            // Si el token es legítimo y no hay sesión previa abierta, autorizamos al usuario
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userEmail, null, new ArrayList<>()
                );
                // Inyectamos la autenticación en el hilo de ejecución actual
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            // Seguridad defensiva: ante cualquier error en el token (caducado, firma errónea),
            // se limpia el contexto para evitar suplantaciones.
            SecurityContextHolder.clearContext();
        }
        
        filterChain.doFilter(request, response);
    }
}