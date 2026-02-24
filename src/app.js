// ============================================================
// app.js — Configuración completa de Express
//
// Ahora conectamos las rutas y el middleware de errores.
// El orden importa: las rutas van antes que el middleware
// de errores, porque Express los ejecuta en secuencia.
// ============================================================
const express = require("express");
const path = require("path");
const mascotasRoutes = require("./routes/mascotas.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Middlewares globales
app.use(express.json());

// Frontend estático — mismo origen, sin CORS
app.use(express.static(path.join(__dirname, "../public")));

// Rutas de la API
app.use("/api/mascotas", mascotasRoutes);

// Middleware de errores — siempre al final
// Express lo reconoce por los 4 parámetros
app.use(errorMiddleware);

module.exports = app;