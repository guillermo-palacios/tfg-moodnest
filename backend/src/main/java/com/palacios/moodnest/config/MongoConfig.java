package com.palacios.moodnest.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Configuración explícita del cliente de MongoDB.
 * Desactiva la autoconfiguración de Spring Boot para forzar el uso de la URI definida en el entorno.
 */
@Configuration
@EnableMongoRepositories(basePackages = "com.palacios.moodnest.repositories")
public class MongoConfig extends AbstractMongoClientConfiguration {

    // Leemos la variable de entorno de Docker. Si falla, forzamos conexión a mongo-server
    @Value("${spring.data.mongodb.uri:mongodb://mongo-server:27017/moodnest_db}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        return "moodnest_db";
    }

    @Override
    public MongoClient mongoClient() {
        // Desactiva el piloto automático de Spring Boot y fuerza el uso explícito de nuestra URI
        return MongoClients.create(mongoUri);
    }
}
