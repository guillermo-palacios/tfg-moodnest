# ETAPA 1: Construcción (Build)
# Usamos Node.js para instalar dependencias y construir la SPA
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Construye la carpeta /dist de Vite
RUN npm run build 

# ETAPA 2: Servidor de Archivos (Nginx)
# Usamos Nginx para servir los archivos generados
FROM nginx:alpine
# Copiamos la configuración de enrutamiento de React
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamos los archivos estáticos de Vite al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Exponemos el puerto 80 del contenedor
EXPOSE 80
# Arrancamos Nginx
ENTRYPOINT ["nginx", "-g", "daemon off;"]