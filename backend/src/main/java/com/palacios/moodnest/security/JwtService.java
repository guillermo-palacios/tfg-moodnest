package com.palacios.moodnest.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

/**
 * Servicio encargado de las operaciones criptográficas sobre los Tokens JWT.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Crea un JWT firmado con el algoritmo HS256.
     * @param email Correo electrónico usado como 'Subject' del token.
     * @return El token en formato String.
     */
    public String generarToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extrae el email del payload del token.
     */
    public String extraerEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Valida la firma criptográfica y la fecha de expiración.
     */
    public boolean esTokenValido(String token, String email) {
        final String emailExtraido = extraerEmail(token);
        return (emailExtraido.equals(email)) && !isTokenExpired(token);
    }

    // --- MÉTODOS INTERNOS DE APOYO (Helpers Criptográficos) ---

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parsea el token utilizando la clave secreta para verificar su firma.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Convierte la cadena de texto de configuración en una llave criptográfica HMAC robusta.
     */
    private Key getSignInKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}