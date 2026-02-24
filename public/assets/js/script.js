// ============================================================
// CONFIGURACIÓN BASE DE AXIOS
//
// Al estar en el mismo origen que el servidor (ambos en
// localhost:3000), no necesitamos URL absoluta.
// Una cadena vacía significa "usa el mismo origen".
// Esto elimina completamente el problema de CORS.
// ============================================================
axios.defaults.baseURL = "";

// URL base para construir rutas de fotos
const BASE_FOTOS = "/assets/img/";

// ============================================================
// FUNCIÓN AUXILIAR: mostrarAlerta(tipo, titulo, detalle)
// ============================================================
function mostrarAlerta(tipo, titulo, detalle) {
    const alerta = document.getElementById("alerta");
    const tituloEl = document.getElementById("alerta-titulo");
    const detalleEl = document.getElementById("alerta-detalle");

    alerta.className = `alerta visible ${tipo}`;
    tituloEl.textContent = titulo;
    detalleEl.textContent = detalle || "";
}

// ============================================================
// FUNCIÓN AUXILIAR: renderizarTabla(data)
// ============================================================
let mascotasActuales = [];

function renderizarTabla(data) {
    const tbody = document.getElementById("tabla-body");
    const badge = document.getElementById("badge-count");

    mascotasActuales = Array.isArray(data) ? data : [data];
    badge.textContent = mascotasActuales.length;

    if (mascotasActuales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="estado-vacio">No se encontraron mascotas.</td></tr>`;
        return;
    }

    tbody.innerHTML = mascotasActuales
        .map((m, index) => {
            const fotoHTML = m.foto
                ? `<img src="${BASE_FOTOS}${m.foto}" alt="${m.nombre}" class="miniatura"/>`
                : `<span class="sin-foto">🐾</span>`;

            return `
        <tr class="clickeable" data-index="${index}" onclick="abrirModal(${index})">
          <td>${fotoHTML}</td>
          <td><strong>${m.nombre}</strong></td>
          <td>${m.rut}</td>
        </tr>
      `;
        })
        .join("");
}

// ============================================================
// FUNCIÓN AUXILIAR: manejarErrorAxios(error)
//
// Tres casos posibles:
// 1. El servidor respondió con error (4xx, 5xx) → error.response
// 2. La petición salió pero no hubo respuesta   → error.request
// 3. Error al construir la petición             → error.message
// ============================================================
function manejarErrorAxios(error) {
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        mostrarAlerta("error", `Error ${status}`, data?.error || "Ocurrió un error.");
    } else if (error.request) {
        mostrarAlerta("error", "Sin respuesta del servidor", "¿Está corriendo el backend con npm run dev?");
    } else {
        mostrarAlerta("error", "Error inesperado", error.message);
    }
}

// ============================================================
// MODAL
// ============================================================
function abrirModal(index) {
    const mascota = mascotasActuales[index];
    if (!mascota) return;

    const fotoContainer = document.getElementById("modal-foto-container");
    if (mascota.foto) {
        fotoContainer.innerHTML = `<img src="${BASE_FOTOS}${mascota.foto}" alt="${mascota.nombre}"/>`;
    } else {
        fotoContainer.innerHTML = `<div class="sin-foto-modal">🐾</div>`;
    }

    document.getElementById("modal-nombre").textContent = mascota.nombre;
    document.getElementById("modal-rut").textContent = mascota.rut;
    document.getElementById("modal-overlay").classList.add("visible");
}

function cerrarModal() {
    document.getElementById("modal-overlay").classList.remove("visible");
}

// ============================================================
// VISTA PREVIA DE FOTO
// ============================================================
function previsualizarFoto(input) {
    const preview = document.getElementById("preview-foto");
    const previewImg = document.getElementById("preview-img");
    const nombreArchivo = document.getElementById("nombre-archivo");

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            nombreArchivo.textContent = input.files[0].name;
            preview.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================================
// OPERACIÓN 1: REGISTRAR MASCOTA (POST)
// ============================================================
async function registrarMascota() {
    const nombre = document.getElementById("input-nombre-post").value.trim();
    const rut = document.getElementById("input-rut-post").value.trim();
    const fotoInput = document.getElementById("input-foto");

    if (!nombre || !rut) {
        mostrarAlerta("advertencia", "Campos incompletos", "Debes ingresar nombre y RUT.");
        return;
    }

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("rut", rut);
    if (fotoInput.files[0]) {
        formData.append("foto", fotoInput.files[0]);
    }

    try {
        const respuesta = await axios.post("/api/mascotas", formData);
        mostrarAlerta("exito", "✅ Mascota registrada", `${respuesta.data.nombre} fue inscrita exitosamente.`);

        document.getElementById("input-nombre-post").value = "";
        document.getElementById("input-rut-post").value = "";
        fotoInput.value = "";
        document.getElementById("preview-foto").style.display = "none";

        obtenerTodas();
    } catch (error) {
        manejarErrorAxios(error);
    }
}

// ============================================================
// OPERACIÓN 2a: OBTENER TODAS
// ============================================================
async function obtenerTodas() {
    try {
        const respuesta = await axios.get("/api/mascotas");
        renderizarTabla(respuesta.data);
        mostrarAlerta("exito", "Registro completo", `${respuesta.data.length} mascota(s) encontrada(s).`);
    } catch (error) {
        manejarErrorAxios(error);
    }
}

// ============================================================
// OPERACIÓN 2b: BUSCAR POR NOMBRE
// ============================================================
async function buscarPorNombre() {
    const nombre = document.getElementById("input-nombre-get").value.trim();
    if (!nombre) {
        mostrarAlerta("advertencia", "Campo vacío", "Ingresa el nombre a buscar.");
        return;
    }

    try {
        const respuesta = await axios.get("/api/mascotas", { params: { nombre } });
        renderizarTabla(respuesta.data);
        mostrarAlerta("exito", "Mascota encontrada", `Se encontró a "${nombre}".`);
    } catch (error) {
        manejarErrorAxios(error);
    }
}

// ============================================================
// OPERACIÓN 2c: BUSCAR POR RUT
// ============================================================
async function buscarPorRut() {
    const rut = document.getElementById("input-rut-get").value.trim();
    if (!rut) {
        mostrarAlerta("advertencia", "Campo vacío", "Ingresa el RUT a buscar.");
        return;
    }

    try {
        const respuesta = await axios.get("/api/mascotas", { params: { rut } });
        renderizarTabla(respuesta.data);
        mostrarAlerta("exito", "Búsqueda exitosa", `${respuesta.data.length} mascota(s) para el RUT "${rut}".`);
    } catch (error) {
        manejarErrorAxios(error);
    }
}

// ============================================================
// OPERACIÓN 3a: ELIMINAR POR NOMBRE
// ============================================================
async function eliminarPorNombre() {
    const nombre = document.getElementById("input-nombre-delete").value.trim();
    if (!nombre) {
        mostrarAlerta("advertencia", "Campo vacío", "Ingresa el nombre a eliminar.");
        return;
    }

    try {
        const respuesta = await axios.delete("/api/mascotas", { params: { nombre } });
        mostrarAlerta("exito", "✅ Eliminada", `${respuesta.data.eliminada.nombre} fue dada de baja.`);
        document.getElementById("input-nombre-delete").value = "";
        obtenerTodas();
    } catch (error) {
        manejarErrorAxios(error);
    }
}

// ============================================================
// OPERACIÓN 3b: ELIMINAR POR RUT
// ============================================================
async function eliminarPorRut() {
    const rut = document.getElementById("input-rut-delete").value.trim();
    if (!rut) {
        mostrarAlerta("advertencia", "Campo vacío", "Ingresa el RUT para eliminar.");
        return;
    }

    try {
        const respuesta = await axios.delete("/api/mascotas", { params: { rut } });
        mostrarAlerta("exito", "✅ Eliminadas", respuesta.data.mensaje);
        document.getElementById("input-rut-delete").value = "";
        obtenerTodas();
    } catch (error) {
        manejarErrorAxios(error);
    }
}