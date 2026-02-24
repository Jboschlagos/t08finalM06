# 🐾 Ministerio de las Mascotas — Registro Civil

Proyecto final Módulo 6 · Full Stack JavaScript

---

## ¿Qué hace?

Aplicación web para registrar mascotas y sus dueños. Permite crear, consultar, buscar y eliminar registros, con soporte para subir una foto por mascota. Los datos se persisten en un archivo JSON y el servidor expone una API REST que el frontend consume mediante Axios.

---

## Mi contexto

Vengo de la arquitectura, el diseño y la carpintería en madera. Este es mi primer acercamiento al desarrollo backend.

Lo que más me aportó no fue lograr que el proyecto funcionara, sino entender la lógica detrás de cómo se organiza. La **arquitectura en capas** tiene mucho sentido cuando uno piensa en escala: cada capa tiene una responsabilidad única y si algo cambia, solo cambia esa parte. El resto del sistema no se entera.

Es la misma lógica que aplicamos en cualquier disciplina de diseño: no construyes pensando en hoy, construyes pensando en lo que viene.

---

## Arquitectura del proyecto

El backend está dividido en capas con responsabilidades claras:

- **`app.js`** configura Express pero no arranca el servidor. Esto permite importar la aplicación en otros contextos sin ocupar un puerto.
- **`server.js`** solo arranca el servidor. Su único trabajo es llamar a `app.listen()`.
- **`routes/`** es el mapa de URLs. No tiene lógica propia, solo conecta una URL con una función del controller.
- **`controllers/`** toma decisiones: recibe la petición, valida los datos, consulta el repository y responde. No sabe nada de archivos.
- **`repositories/`** es el único archivo que sabe dónde viven los datos. Si mañana cambio el JSON por una base de datos, solo toco este archivo. El resto del sistema no se entera.
- **`middlewares/`** es la red de seguridad. Cualquier error no manejado en el sistema llega aquí y se responde de forma controlada.

El frontend vive en `public/` y Express lo sirve directamente, lo que elimina el problema de CORS: ambos corren en el mismo origen.

```
t08finalM06/
├── data/
│   └── mascotas.json              ← base de datos
├── public/                        ← frontend
│   ├── index.html
│   └── assets/
│       ├── css/styles.css
│       ├── js/script.js
│       └── img/
├── src/                           ← backend
│   ├── app.js                     ← configura Express
│   ├── server.js                  ← arranca el servidor
│   ├── controllers/               ← lógica de negocio
│   ├── repositories/              ← acceso al archivo JSON
│   ├── routes/                    ← mapa de URLs
│   └── middlewares/               ← manejo de errores
└── package.json
```

---

## Construcción desde la terminal

Construí la estructura completa desde la terminal antes de escribir una sola línea de código. Es un hábito que aprendí en este proyecto y que pienso mantener.

```bash
mkdir t08finalM06 && cd t08finalM06
mkdir src src\controllers src\repositories src\routes src\middlewares
mkdir data public public\assets public\assets\css public\assets\js public\assets\img
type nul > src\app.js
type nul > src\server.js
type nul > src\controllers\mascotas.controller.js
type nul > src\repositories\mascotas.repository.js
type nul > src\routes\mascotas.routes.js
type nul > src\middlewares\error.middleware.js
type nul > public\index.html
type nul > public\assets\css\styles.css
type nul > public\assets\js\script.js
echo [] > data\mascotas.json
npm init -y
npm install express@4.22.1 multer@1.4.5-lts.1
npm install --save-dev nodemon
```

---

## API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/mascotas` | Todas las mascotas |
| `GET` | `/api/mascotas?nombre=Firulais` | Buscar por nombre |
| `GET` | `/api/mascotas?rut=12345678-9` | Buscar por RUT |
| `POST` | `/api/mascotas` | Registrar mascota |
| `DELETE` | `/api/mascotas?nombre=Firulais` | Eliminar por nombre |
| `DELETE` | `/api/mascotas?rut=12345678-9` | Eliminar por RUT |

### Manejo de errores

| Código | Cuándo ocurre |
|--------|--------------|
| `400` | Campos faltantes o RUT con formato inválido |
| `404` | Mascota o RUT no encontrado |
| `409` | Nombre de mascota duplicado |
| `500` | Archivo JSON corrupto o error interno |

---

## Cómo ejecutarlo

```bash
git clone https://github.com/Jboschlagos/t08finalM06.git
cd t08finalM06
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:3000`

---

**Jboschlagos** · Full Stack JavaScript Módulo 6 · [github.com/Jboschlagos](https://github.com/Jboschlagos)