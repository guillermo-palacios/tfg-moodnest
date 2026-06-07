# ETAPA 1: Construcción (Build)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ETAPA 2: Ejecución (Run)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# MODO DIOS: Obligamos a Java a usar esta URL, ignorando cualquier properties
ENTRYPOINT ["java", "-jar", "app.jar"]