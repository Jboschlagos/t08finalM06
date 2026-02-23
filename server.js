// ============================================================
// IMPORTACIONES
// Nueva incorporación: 'multer' maneja la recepción de archivos.
// 'path' lo usábamos antes para rutas de archivo.
// ============================================================
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

// ============================================================
// MIDDLEWARE: JSON y CORS (igual que antes)
// ============================================================
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// ============================================================
// ARCHIVOS ESTÁTICOS
// Esta línea le dice a Express: "si alguien pide un archivo
// que está dentro de la carpeta 'assets', entrégalo directamente
// sin pasar por ninguna ruta ni lógica."
//
// Gracias a esto, el frontend puede acceder a las fotos con:
// http://localhost:3000/assets/img/firulais.jpg
// ============================================================
app.use("/assets", express.static(path.join(__dirname, "assets")));

// ============================================================
// CONFIGURACIÓN DE MULTER
//
// multer necesita saber DOS cosas:
//   1. destination → en qué carpeta guardar el archivo
//   2. filename    → con qué nombre guardarlo
//
// Para el nombre usamos: nombre-original + timestamp.
// El timestamp (Date.now()) garantiza que dos fotos con el
// mismo nombre original no se sobreescriban entre sí.
//
// Ejemplo: si subes "foto.jpg", se guarda como "foto-1710000000000.jpg"
// ============================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "assets/img"));
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);          // ".jpg", ".png", etc.
        const nombreBase = path.basename(file.originalname, extension); // nombre sin extensión
        const nombreFinal = `${nombreBase}-${Date.now()}${extension}`;
        cb(null, nombreFinal);
    }
});

// ============================================================
// FILTRO DE ARCHIVOS
// Solo aceptamos imágenes. Si alguien intenta subir un .exe
// o un .pdf, lo rechazamos con un mensaje claro.
// Este filtro cubre el Error 3 (dato inválido) para archivos.
// ============================================================
const fileFilter = (req, file, cb) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);  // aceptar el archivo
    } else {
        cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes (jpg, png, webp, gif)."), false);
    }
};

// Unimos storage + fileFilter en el middleware 'upload'
// limits.fileSize limita el tamaño a 5MB (5 * 1024 * 1024 bytes)
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================================
// RUTAS Y FUNCIONES AUXILIARES (sin cambios respecto a v1)
// ============================================================
const DATA_FILE = path.join(__dirname, "mascotas.json");

function leerMascotas() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, "[]", "utf-8");
    }
    const contenido = fs.readFileSync(DATA_FILE, "utf-8");
    try {
        return JSON.parse(contenido);
    } catch (e) {
        const error = new Error("El archivo de datos está corrupto y no puede ser leído.");
        error.tipo = "JSON_CORRUPTO";
        throw error;
    }
}

function guardarMascotas(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function validarRut(rut) {
    return /^\d{7,8}-[\dkK]$/.test(rut);
}

function manejarError(res, error) {
    if (error.tipo === "JSON_CORRUPTO") {
        return res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
    }
    return res.status(500).json({ error: "Error interno del servidor", detalle: "Ocurrió un error inesperado." });
}

// ============================================================
// ENDPOINT GET /mascotas
// Sin cambios funcionales. Ahora cada mascota incluye 'foto'.
// ============================================================
app.get("/mascotas", (req, res) => {
    let mascotas;
    try { mascotas = leerMascotas(); }
    catch (error) { return manejarError(res, error); }

    const { nombre, rut } = req.query;

    if (nombre) {
        const mascota = mascotas.find(m => m.nombre.toLowerCase() === nombre.toLowerCase());
        if (!mascota) return res.status(404).json({ error: "Mascota no encontrada", detalle: `No existe una mascota con el nombre "${nombre}".` });
        return res.status(200).json(mascota);
    }

    if (rut) {
        const resultado = mascotas.filter(m => m.rut === rut);
        if (resultado.length === 0) return res.status(404).json({ error: "RUT no encontrado", detalle: `No hay mascotas registradas para el RUT "${rut}".` });
        return res.status(200).json(resultado);
    }

    return res.status(200).json(mascotas);
});

// ============================================================
// ENDPOINT POST /mascotas  ← ACTUALIZADO CON MULTER
//
// Antes usábamos express.json() para leer el body.
// Ahora usamos upload.single("foto") como middleware.
//
// upload.single("foto") hace tres cosas automáticamente:
//   1. Lee el multipart/form-data que envía el frontend
//   2. Guarda el archivo en assets/img/ con el nombre configurado
//   3. Pone la info del archivo en req.file para que la usemos
//
// Los campos de texto (nombre, rut) ahora llegan en req.body
// igual que antes, pero como parte del multipart.
// ============================================================
app.post("/mascotas", upload.single("foto"), (req, res) => {
    const { nombre, rut } = req.body;

    if (!nombre || !rut) {
        return res.status(400).json({ error: "Datos inválidos", detalle: "Los campos 'nombre' y 'rut' son obligatorios." });
    }

    if (!validarRut(rut)) {
        return res.status(400).json({ error: "RUT inválido", detalle: `El RUT "${rut}" no tiene un formato válido. Use: 12345678-9` });
    }

    let mascotas;
    try { mascotas = leerMascotas(); }
    catch (error) { return manejarError(res, error); }

    const existe = mascotas.find(m => m.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
        return res.status(400).json({ error: "Nombre duplicado", detalle: `Ya existe una mascota con el nombre "${nombre}".` });
    }

    // req.file existe solo si se subió un archivo.
    // req.file.filename es el nombre que multer le asignó al guardarlo.
    // Si no se subió foto, guardamos null.
    const foto = req.file ? req.file.filename : null;

    const nuevaMascota = { nombre, rut, foto };
    mascotas.push(nuevaMascota);
    guardarMascotas(mascotas);

    return res.status(201).json({ mensaje: "Mascota registrada exitosamente.", mascota: nuevaMascota });
});

// ============================================================
// ENDPOINT DELETE /mascotas  ← ACTUALIZADO
// Al eliminar una mascota, también borramos su foto del disco
// para no acumular archivos huérfanos.
// ============================================================
app.delete("/mascotas", (req, res) => {
    const { nombre, rut } = req.query;

    if (!nombre && !rut) {
        return res.status(400).json({ error: "Parámetro requerido", detalle: "Debe indicar 'nombre' o 'rut'." });
    }

    let mascotas;
    try { mascotas = leerMascotas(); }
    catch (error) { return manejarError(res, error); }

    // Función auxiliar interna: borra la foto del disco si existe
    function borrarFoto(mascota) {
        if (mascota.foto) {
            const rutaFoto = path.join(__dirname, "assets/img", mascota.foto);
            if (fs.existsSync(rutaFoto)) fs.unlinkSync(rutaFoto);
        }
    }

    if (nombre) {
        const indice = mascotas.findIndex(m => m.nombre.toLowerCase() === nombre.toLowerCase());
        if (indice === -1) return res.status(404).json({ error: "Mascota no encontrada", detalle: `No existe una mascota con el nombre "${nombre}".` });

        const eliminada = mascotas.splice(indice, 1)[0];
        borrarFoto(eliminada);
        guardarMascotas(mascotas);
        return res.status(200).json({ mensaje: "Mascota eliminada exitosamente.", mascota: eliminada });
    }

    if (rut) {
        const asociadas = mascotas.filter(m => m.rut === rut);
        if (asociadas.length === 0) return res.status(404).json({ error: "RUT no encontrado", detalle: `No hay mascotas para el RUT "${rut}".` });

        asociadas.forEach(borrarFoto);
        const restantes = mascotas.filter(m => m.rut !== rut);
        guardarMascotas(restantes);
        return res.status(200).json({ mensaje: `Se eliminaron ${asociadas.length} mascota(s) del RUT "${rut}".`, eliminadas: asociadas });
    }
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Fotos guardadas en: assets/img/`);
});