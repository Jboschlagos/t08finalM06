// ============================================================
// mascotas.repository.js — Capa de acceso a datos
//
// Es el ÚNICO archivo del sistema que sabe que los datos
// viven en un archivo JSON. Si mañana cambias a PostgreSQL,
// solo reescribes este archivo. El resto no se entera.
// ============================================================
const fs = require("fs/promises");
const path = require("path");

// Ruta absoluta al archivo de datos.
// __dirname es la carpeta donde está este archivo (src/repositories/).
// Subimos dos niveles con "../.." para llegar a la raíz del proyecto
// y luego entramos a data/mascotas.json.
const DB_PATH = path.join(__dirname, "../../data/mascotas.json");

// ============================================================
// readAll()
// Lee el archivo y devuelve el arreglo de mascotas.
//
// Maneja dos casos de error automáticamente:
// - ENOENT: el archivo no existe todavía → devuelve []
// - JSON inválido: el archivo está corrupto → lanza error
//   con un tipo personalizado para que el middleware lo capture
// ============================================================
async function readAll() {
    try {
        const content = await fs.readFile(DB_PATH, "utf-8");
        return JSON.parse(content);
    } catch (err) {
        if (err.code === "ENOENT") {
            // El archivo no existe aún, es válido devolver vacío
            return [];
        }
        if (err instanceof SyntaxError) {
            // El archivo existe pero el JSON está malformado
            const error = new Error("El archivo de datos está corrupto.");
            error.tipo = "JSON_CORRUPTO";
            throw error;
        }
        throw err;
    }
}

// ============================================================
// writeAll(mascotas)
// Escribe el arreglo completo de vuelta al archivo.
// JSON.stringify(data, null, 2) formatea con indentación
// para que el archivo sea legible por humanos.
// ============================================================
async function writeAll(mascotas) {
    const json = JSON.stringify(mascotas, null, 2);
    await fs.writeFile(DB_PATH, json, "utf-8");
}

module.exports = { readAll, writeAll };