// ============================================================
// server.js — Punto de entrada
//
// Su único trabajo: importar la app configurada y
// ponerla a escuchar en un puerto.
// ============================================================
const app  = require("./app");

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});