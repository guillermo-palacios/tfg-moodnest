package com.palacios.moodnest.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "com.palacios.moodnest.repositories")
public class MongoConfig extends AbstractMongoClientConfiguration {

    // Leemos la variable de entorno, y si falla, forzamos el valor por defecto a 'mongo-server'
    @Value("${spring.data.mongodb.uri:mongodb://mongo-server:27017/moodnest_db}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        return "moodnest_db";
    }

    @Override
    public MongoClient mongoClient() {
        // Obligamos a Java a usar nuestra URI explícita
        return MongoClients.create(mongoUri);
    }
}
