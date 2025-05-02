# Etapa 1: Construcción del build con Node
FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Servir la build con Nginx
FROM nginx:alpine
# Copia la carpeta "browser" generada dentro de la build al directorio de nginx.
# Esto sobreescribe el index.html por defecto de nginx.
COPY --from=builder /app/dist/incidencias-tic-instalaciones/browser/ /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
