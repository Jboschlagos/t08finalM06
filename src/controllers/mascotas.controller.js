// ============================================================
// mascotas.controller.js — Lógica de negocio
//
// Recibe peticiones HTTP, consulta el Repository,
// y devuelve respuestas. No sabe nada de archivos ni rutas.
//
// Cada función recibe (req, res, next):
//   req  → datos de la petición (body, query, params)
//   res  → métodos para responder
//   next → función para pasar errores al middleware
// ============================================================
const repo = require("../repositories/mascotas.repository");

// ============================================================
// VALIDADOR: isNonEmptyString(value)
// Verifica que un valor sea texto y no esté vacío.
// Lo usamos para validar nombre y rut antes de operar.
// ============================================================
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

// ============================================================
// VALIDADOR: validarRut(rut)
// Formato chileno: 7-8 dígitos, guión, dígito o K.
// ============================================================
function validarRut(rut) {
    return /^\d{7,8}-[\dkK]$/.test(rut);
}

// ============================================================
// GET /api/mascotas
// Sin parámetros  → todas las mascotas
// ?nombre=X       → mascota por nombre
// ?rut=X          → mascotas por RUT
// Ambos a la vez  → error 400 (ambiguo)
// ============================================================
exports.getMascotas = async (req, res, next) => {
    try {
        const { nombre, rut } = req.query;
        const mascotas = await repo.readAll();

        // Caso inválido: no permitimos ambos parámetros a la vez
        if (isNonEmptyString(nombre) && isNonEmptyString(rut)) {
            return res.status(400).json({
                error: "Usa solo un parámetro: nombre o rut, no ambos."
            });
        }

        // Sin parámetros: devolver todo
        if (!isNonEmptyString(nombre) && !isNonEmptyString(rut)) {
            return res.status(200).json(mascotas);
        }

        // Por nombre: devuelve una sola mascota
        if (isNonEmptyString(nombre)) {
            const mascota = mascotas.find(
                m => m.nombre.toLowerCase() === nombre.trim().toLowerCase()
            );
            if (!mascota) {
                return res.status(404).json({
                    error: `No existe una mascota con el nombre "${nombre}".`
                });
            }
            return res.status(200).json(mascota);
        }

        // Por RUT: devuelve todas las del dueño
        const resultado = mascotas.filter(
            m => m.rut.trim() === rut.trim()
        );
        if (resultado.length === 0) {
            return res.status(404).json({
                error: `No hay mascotas registradas para el RUT "${rut}".`
            });
        }
        return res.status(200).json(resultado);

    } catch (err) {
        // No manejamos el error aquí: se lo pasamos al middleware
        next(err);
    }
};

// ============================================================
// POST /api/mascotas
// Crea una nueva mascota.
// Valida campos obligatorios, formato RUT y nombre duplicado.
// ============================================================
exports.createMascota = async (req, res, next) => {
    try {
        const { nombre, rut } = req.body;

        if (!isNonEmptyString(nombre) || !isNonEmptyString(rut)) {
            return res.status(400).json({
                error: "Los campos 'nombre' y 'rut' son obligatorios."
            });
        }

        if (!validarRut(rut.trim())) {
            return res.status(400).json({
                error: `El RUT "${rut}" no tiene formato válido. Use: 12345678-9`
            });
        }

        const mascotas = await repo.readAll();

        // 409 Conflict: el nombre ya existe
        // Usamos 409 y no 400 porque el dato está bien formado,
        // simplemente entra en conflicto con uno ya existente.
        const existe = mascotas.some(
            m => m.nombre.toLowerCase() === nombre.trim().toLowerCase()
        );
        if (existe) {
            return res.status(409).json({
                error: `Ya existe una mascota con el nombre "${nombre}".`
            });
        }

        // La foto la maneja multer en las rutas (Etapa 4)
        // Aquí solo guardamos el nombre del archivo si llegó
        const foto = req.file ? req.file.filename : null;

        const nuevaMascota = {
            nombre: nombre.trim(),
            rut: rut.trim(),
            foto
        };

        mascotas.push(nuevaMascota);
        await repo.writeAll(mascotas);

        return res.status(201).json(nuevaMascota);

    } catch (err) {
        next(err);
    }
};

// ============================================================
// DELETE /api/mascotas
// ?nombre=X  → elimina una mascota por nombre
// ?rut=X     → elimina todas las mascotas del RUT
// ============================================================
exports.deleteMascota = async (req, res, next) => {
    try {
        const { nombre, rut } = req.query;

        if (isNonEmptyString(nombre) && isNonEmptyString(rut)) {
            return res.status(400).json({
                error: "Usa solo un parámetro: nombre o rut, no ambos."
            });
        }

        if (!isNonEmptyString(nombre) && !isNonEmptyString(rut)) {
            return res.status(400).json({
                error: "Debes indicar 'nombre' o 'rut' para eliminar."
            });
        }

        const mascotas = await repo.readAll();

        // Eliminar por nombre
        if (isNonEmptyString(nombre)) {
            const indice = mascotas.findIndex(
                m => m.nombre.toLowerCase() === nombre.trim().toLowerCase()
            );
            if (indice === -1) {
                return res.status(404).json({
                    error: `No existe una mascota con el nombre "${nombre}".`
                });
            }
            const eliminada = mascotas.splice(indice, 1)[0];

            // Si tenía foto, la borramos del disco
            if (eliminada.foto) {
                const fs = require("fs/promises");
                const path = require("path");
                const rutaFoto = path.join(__dirname, "../../public/assets/img", eliminada.foto);
                try {
                    await fs.unlink(rutaFoto);
                } catch {
                    // Si la foto no existe en disco, no interrumpimos la operación
                }
            }

            await repo.writeAll(mascotas);
            return res.status(200).json({ eliminada });
        }

        // Eliminar por RUT
        const asociadas = mascotas.filter(m => m.rut.trim() === rut.trim());
        if (asociadas.length === 0) {
            return res.status(404).json({
                error: `No hay mascotas para el RUT "${rut}".`
            });
        }

        // Borrar fotos de todas las mascotas eliminadas
        const fs = require("fs/promises");
        const path = require("path");
        for (const mascota of asociadas) {
            if (mascota.foto) {
                const rutaFoto = path.join(__dirname, "../../public/assets/img", mascota.foto);
                try {
                    await fs.unlink(rutaFoto);
                } catch {
                    // Si la foto no existe en disco, continuamos
                }
            }
        }

        const restantes = mascotas.filter(m => m.rut.trim() !== rut.trim());
        await repo.writeAll(restantes);

        return res.status(200).json({
            mensaje: `Se eliminaron ${asociadas.length} mascota(s) del RUT "${rut}".`,
            eliminadas: asociadas
        });

    } catch (err) {
        next(err);
    }
};