# 🐾 Ministerio de las Mascotas — Registro Civil

Sistema de registro de mascotas desarrollado con **Node.js + Express** en el backend y **HTML/CSS/JS + Axios** en el frontend. Proyecto correspondiente al Módulo 6, Tarea 8.

---

## 📋 Descripción

Aplicación web que permite registrar, consultar y eliminar mascotas asociadas a un RUT de dueño. Los datos se persisten en un archivo `mascotas.json` y las fotos se almacenan en `assets/img/`.

---

## 🗂️ Estructura del proyecto

```
registro-mascotas/
├── assets/
│   ├── css/
│   │   └── styles.css       # Estilos del frontend
│   ├── js/
│   │   └── script.js        # Lógica del frontend (Axios)
│   └── img/                 # Fotos de mascotas (generadas al registrar)
├── index.html               # Interfaz de usuario
├── server.js                # Servidor web (Express)
├── mascotas.json            # Base de datos en formato JSON
├── package.json             # Configuración y dependencias del proyecto
└── .gitignore               # Archivos excluidos de Git
```

---

## ⚙️ Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior

---

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/registro-mascotas.git
cd registro-mascotas

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
npm start
```

El servidor quedará corriendo en: `http://localhost:3000`

Luego abrir `index.html` en el navegador (con Live Server de VSCode o doble clic).

---

## 🔌 Endpoints de la API

### `GET /mascotas`
Retorna todas las mascotas registradas.

### `GET /mascotas?nombre=Firulais`
Retorna la mascota con ese nombre.

### `GET /mascotas?rut=12345678-9`
Retorna todas las mascotas asociadas a ese RUT.

### `POST /mascotas`
Inserta una nueva mascota. Acepta `multipart/form-data` con los campos:

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| nombre | texto | ✅ |
| rut | texto (formato `12345678-9`) | ✅ |
| foto | archivo imagen (jpg, png, webp) | ❌ |

### `DELETE /mascotas?nombre=Firulais`
Elimina la mascota con ese nombre.

### `DELETE /mascotas?rut=12345678-9`
Elimina todas las mascotas asociadas a ese RUT.

---

## 🛡️ Manejo de errores

| Código HTTP | Situación |
|-------------|-----------|
| `400` | Campos faltantes, RUT con formato inválido, nombre duplicado |
| `404` | Mascota o RUT no encontrado |
| `500` | Archivo `mascotas.json` corrupto |
| Sin respuesta | Servidor apagado (detectado en el frontend) |

---

## 🧰 Tecnologías utilizadas

**Backend:** Node.js, Express, Multer

**Frontend:** HTML5, CSS3, Axios, Google Fonts

---

## 👤 Autor

Desarrollado como parte del curso Full Stack JavaScript — Módulo 6.