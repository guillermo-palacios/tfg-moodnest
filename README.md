# tfg-moodnest
Repositorio principal para el desarrollo de mi TFG, MoodNest: Una aplicación web para el seguimiento diario del estado de ánimo personal.


## Estructura del Proyecto

* `/backend`: API REST desarrollada en **Java con Spring Boot**.
* `/frontend`: Aplicación cliente desarrollada en **React (Vite)**, servida mediante Nginx.
* `/memoria`: Documentación técnica completa redactada en **LaTeX**.
* `docker-compose.yml`: Orquestador para el despliegue del entorno completo.


## Despliegue con Docker
El proyecto ha sido contenerizado para garantizar un despliegue idéntico en cualquier sistema operativo, sin necesidad de instalar dependencias locales de lenguajes o bases de datos.

### Requisitos previos
Para levantar la plataforma, únicamente necesitas tener instalado en tu máquina:
* Git
* Docker
* Docker Compose.

### Instrucciones de ejecución
1- Clonar el repositorio: 

```bash
git clone [https://github.com/guillermo-palacios/tfg-moodnest.git](https://github.com/guillermo-palacios/tfg-moodnest.git)
```

2- Acceder al directorio raíz del proyecto:

```bash
cd tfg-moodnest
```

3- Construir las imágenes y levantar los contenedores en segundo plano: 

```bash
docker compose up -d --build
```

4- Una vez completado, la aplicación estará disponible en el navegador en: 

```bash
http://localhost:5173
```

### Detener los servicios
Para detener de forma limpia el ecosistema de contenedores y liberar los puertos del sistema, ejecuta:

```bash
docker compose down
```
