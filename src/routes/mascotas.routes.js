// ============================================================
// mascotas.routes.js — Mapa de URLs
//
// Solo conecta URLs con funciones del controller.
// No tiene lógica propia.
//
// multer se configura aquí porque es parte del transporte
// HTTP (recibir archivos), no de la lógica de negocio.
// ============================================================
const express = require("express");
const multer = require("multer");
const path = require("path");
const controller = require("../controllers/mascotas.controller");

const router = express.Router();

// Configuración de multer: dónde y cómo guardar las fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../public/assets/img"));
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const nombreBase = path.basename(file.originalname, extension);
        cb(null, `${nombreBase}-${Date.now()}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    const permitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (permitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Solo se aceptan imágenes (jpg, png, webp, gif)."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Mapa de rutas
// upload.single("foto") intercepta el archivo antes de que
// llegue al controller. Cuando el controller se ejecuta,
// req.file ya tiene la info del archivo guardado.
router.get("/", controller.getMascotas);
router.post("/", upload.single("foto"), controller.createMascota);
router.delete("/", controller.deleteMascota);

module.exports = router;