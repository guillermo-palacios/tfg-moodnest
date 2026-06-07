# tfg-moodnest
Repositorio principal para el desarrollo de mi TFG, MoodNest: Una aplicación web para el seguimiento diario del estado de ánimo personal.


## Estructura del Proyecto

* `/backend`: API REST desarrollada en **Java con Spring Boot**.
* `/frontend`: Aplicación cliente desarrollada en **React (Vite)**, servida mediante Nginx.
* `/memoria`: Documentación técnica completa redactada en **LaTeX**.
* `docker-compose.yml`: Orquestador para el despliegue del entorno completo.


## Despliegue con Docker

### Requisitos previos
* Tener instalado: Docker y Docker Compose.

### Instrucciones de ejecución
Desde la carpeta raiz del proyecto "tfg-moodnest": 

1- Ejecutamos: sudo docker-compose up -d --build

2- Una vez completado, la aplicación estará disponible en: http://localhost:5173