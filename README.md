# Front‑End Angular · **Gestión de Incidencias** V1.0

Este repositorio contiene el _front_ de la **Aplicación de Gestión de Incidencias**, desarrollado con **Angular**.  
La interfaz permite a los **Coordinadores TIC** y **Profesores** registrar y consultar incidencias de forma sencilla.

---

## ✨ Características principales

- **Login básico (sin cifrado)** contra el back‑end.
- Gestión de roles: **Coordinador TIC** y **Profesor**.
- Diseño **responsive**.

---

## 📋 Requisitos previos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| Node.js     | ≥ 18 LTS            |
| npm         | ≥ 9                |
| Angular CLI | ≥ 16               |
| Git         | ≥ 2.30             |

---

# Back-End Spring Boot · **Gestión de Incidencias**

El repositorio https://github.com/migcabvid/PI-Incidencias-Backend.git contiene el *back-end* de la **Aplicación de Gestión de Incidencias**, desarrollado con **Spring Boot**.
Proporciona una API REST para que los **Coordinadores TIC** y **Profesores** puedan crear, consultar y gestionar incidencias de manera sencilla.

---

## ✨ Características principales

* **Autenticación básica** (sin cifrado) mediante filtro HTTP.
* Gestión de **roles**: `COORDINADOR_TIC` y `PROFESOR`.
* Persistencia en **Base de Datos** (MySQL).
* Endpoints REST para CRUD de incidencias, usuarios y roles.
* Manejo de **excepciones globales** y respuestas propias de error.
* Documentación automática de la API con **(Swagger)** http://localhost:8080/swagger-ui/index.html.

---

## 📋 Requisitos previos

| Herramienta   | Versión recomendada |
| ------------- | ------------------- |
| JDK           | ≥ 17                |
| Maven         | ≥ 3.8               |
| Git           | ≥ 2.30              |

---

## 🚀 Puesta en marcha

### 1) Clona el repositorio Front
git clone https://github.com/migcabvid/PI-Incidencias-Frontend.git

### 2) Clona el repositorio Back
git clone https://github.com/migcabvid/PI-Incidencias-Backend.git

### 3) Abre en la terminal la carpeta de Front
cd PI-Incidencias-Frontend

### 4) Dockerizamos la aplicación
docker-compose up

### 5) Abrimos la aplicacion
Escribimos en cualquier navegador [localhost](http://localhost:80)

### 6) Login
Para el login disponemos de 3 usuarios anteriormente predefinidos, sus credenciales son los siguientes:
- Profesor:  
  Usuario: p  
  Contraseña: p  

- Coordinador TIC:  
  Usuario: c  
  Contraseña: c  

- Equipo Directivo:  
  Usuario: e  
  Contraseña: e  

- Usuario con todos los roles:  
  Usuario: all  
  Contraseña: all  


