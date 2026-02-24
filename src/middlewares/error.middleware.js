// ============================================================
// error.middleware.js — Red de seguridad global
//
// Captura cualquier error que llega via next(err) desde
// cualquier parte del sistema.
//
// IMPORTANTE: Express reconoce un middleware de errores
// por tener exactamente 4 parámetros (err, req, res, next).
// Si le pones 3, Express lo trata como middleware normal
// y los errores no llegarán aquí.
// ============================================================
module.exports = (err, req, res, next) => {
  console.error("ERROR:", err.message);

  // Error de JSON corrupto (lanzado por el repository)
  if (err.tipo === "JSON_CORRUPTO") {
    return res.status(500).json({
      error: "El archivo de datos está corrupto.",
      detalle: err.message
    });
  }

  // Error de multer: archivo muy pesado
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "La imagen no puede superar los 5MB."
    });
  }

  // Error de multer: tipo de archivo no permitido
  if (err.message.includes("Solo se aceptan imágenes")) {
    return res.status(400).json({
      error: err.message
    });
  }

  // Error genérico: no exponemos detalles internos al cliente
  res.status(500).json({
    error: "Error interno del servidor."
  });
};