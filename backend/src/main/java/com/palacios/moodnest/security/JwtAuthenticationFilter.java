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

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");

        // 1. Comprobar si hay un token en la cabecera (Si no, lo dejamos pasar, pero la puerta lo bloqueará)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extraer el token (quitando la palabra "Bearer ")
        final String jwt = authHeader.substring(7);
        
        try {
            // 3. Extraer el email. Si el token es falso, modificado o caducado, esto lanzará un error
            final String userEmail = jwtService.extraerEmail(jwt);

            // 4. Si hay email y aún no está autenticado en este hilo
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // Le decimos a Spring: "Este usuario es legítimo y ha demostrado quién es, déjalo pasar"
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userEmail, null, new ArrayList<>()
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            // Token inválido, caducado, o manipulado -> Se ignora y Spring Security lanzará el 403
        }
        
        // 5. Continúa el flujo hacia el Controlador
        filterChain.doFilter(request, response);
    }
}