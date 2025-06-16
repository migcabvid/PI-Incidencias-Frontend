# ---------- ETAPA 1: Build de Angular con Node LTS Alpine ----------
FROM node:lts-alpine AS build
WORKDIR /app

# Instalamos dependencias del sistema que Angular necesita
RUN apk add --no-cache python3 g++ make git

# Copiamos package.json y package-lock.json e instalamos paquetes
COPY package.json package-lock.json ./
RUN npm install

# Copiamos el resto del código y generamos el build de producción
COPY . .
RUN npm run build -- --configuration=production

# ---------- ETAPA 2: Nginx para servir estáticos ----------
FROM nginx:stable-alpine AS production
WORKDIR /usr/share/nginx/html

# Limpiamos cualquier cosa que haya por defecto
RUN rm -rf ./*

# Copiamos TODO el contenido generado por Angular (la carpeta "browser/")
# Nótese la barra al final de la fuente y del destino: 
# - "/app/dist/.../browser/" indica “copia todos los ficheros y carpetas dentro de browser”
# - "/usr/share/nginx/html/" es la carpeta raíz de Nginx
COPY --from=build /app/dist/incidencias-tic-instalaciones/browser/ /usr/share/nginx/html/

# Copiamos la configuración personalizada de Nginx
COPY default.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 y arrancamos Nginx en primer plano
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
