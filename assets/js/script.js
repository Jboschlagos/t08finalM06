// ============================================================
// CONFIGURACIÓN BASE DE AXIOS
// ============================================================
axios.defaults.baseURL = "http://localhost:3000";

// URL base para construir las rutas de las fotos.
// Cuando el servidor nos devuelve { foto: "firulais-123.jpg" },
// nosotros construimos la URL completa así:
// BASE_FOTOS + "firulais-123.jpg" → http://localhost:3000/assets/img/firulais-123.jpg
const BASE_FOTOS = "http://localhost:3000/assets/img/";

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
//
// Novedad respecto a v1: ahora cada fila muestra una miniatura
// de la foto y es clickeable. Al hacer clic, abre el modal
// con los detalles de esa mascota.
//
// El atributo data-index="i" guarda la posición de la mascota
// en el arreglo para poder recuperarla al hacer clic.
// ============================================================
let mascotasActuales = []; // guardamos las mascotas en memoria para el modal

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
            // Construimos la miniatura o el placeholder si no hay foto
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
// (Sin cambios respecto a v1)
// ============================================================
function manejarErrorAxios(error) {
    if (error.response) {
        const data = error.response.data;
        mostrarAlerta("error", data.error || "Error", data.detalle || "Ocurrió un error.");
    } else {
        mostrarAlerta("error", "Sin conexión con el servidor", "Asegúrate de que el servidor Node esté corriendo con 'npm start'.");
    }
}

// ============================================================
// MODAL: abrirModal(index)
//
// Recibe el índice de la mascota en mascotasActuales[],
// llena el modal con sus datos y lo hace visible.
//
// ¿Por qué guardamos mascotasActuales en memoria?
// Para no tener que hacer otra llamada al servidor solo para
// mostrar el detalle. Ya tenemos los datos, los reutilizamos.
// ============================================================
function abrirModal(index) {
    const mascota = mascotasActuales[index];
    if (!mascota) return;

    // Foto en el modal: imagen real o placeholder
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

// ============================================================
// MODAL: cerrarModal()
//
// Cierra el modal quitando la clase 'visible'.
// También cerramos si el usuario hace clic fuera del modal
// (en el overlay oscuro), lo cual se configura en el HTML.
// ============================================================
function cerrarModal() {
    document.getElementById("modal-overlay").classList.remove("visible");
}

// ============================================================
// VISTA PREVIA DE FOTO antes de subir
//
// Cuando el usuario selecciona un archivo, leemos el archivo
// localmente con FileReader y mostramos una previsualización.
// Esto no sube nada al servidor todavía, solo es feedback visual.
// ============================================================
function previsualizarFoto(input) {
    const preview = document.getElementById("preview-foto");
    const previewImg = document.getElementById("preview-img");
    const nombreArchivo = document.getElementById("nombre-archivo");

    if (input.files && input.files[0]) {
        const archivo = input.files[0];

        // FileReader lee el archivo como una URL de datos (base64)
        // que podemos usar directamente en un <img src="...">
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            nombreArchivo.textContent = archivo.name;
            preview.style.display = "block";
        };
        reader.readAsDataURL(archivo);
    }
}

// ============================================================
// OPERACIÓN 1: REGISTRAR MASCOTA (POST con archivo)
//
// CAMBIO IMPORTANTE respecto a v1:
// Ya no usamos axios.post(url, { nombre, rut }) con JSON.
// Ahora usamos FormData, que es el objeto de JavaScript que
// permite enviar archivos junto con datos de texto.
//
// FormData construye automáticamente el multipart/form-data
// que multer espera en el servidor.
// ============================================================
async function registrarMascota() {
    const nombre = document.getElementById("input-nombre-post").value.trim();
    const rut = document.getElementById("input-rut-post").value.trim();
    const fotoInput = document.getElementById("input-foto");

    if (!nombre || !rut) {
        mostrarAlerta("advertencia", "Campos incompletos", "Debes ingresar nombre y RUT.");
        return;
    }

    // Construimos el FormData con los campos de texto y el archivo
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("rut", rut);

    // Solo agregamos la foto si el usuario seleccionó una
    if (fotoInput.files[0]) {
        formData.append("foto", fotoInput.files[0]);
    }

    try {
        // Al enviar FormData, NO ponemos Content-Type manualmente.
        // Axios lo detecta automáticamente y pone multipart/form-data
        // con el boundary correcto. Si lo pusieras manualmente, rompería.
        const respuesta = await axios.post("/mascotas", formData);
        mostrarAlerta("exito", "✅ Mascota registrada", respuesta.data.mensaje);

        // Limpiar formulario
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
// OPERACIONES 2 y 3: GET y DELETE (sin cambios respecto a v1)
// Solo actualizamos renderizarTabla para mostrar la foto.
// ============================================================
async function obtenerTodas() {
    try {
        const respuesta = await axios.get("/mascotas");
        renderizarTabla(respuesta.data);
        mostrarAlerta("exito", "Registro completo", `Se encontraron ${respuesta.data.length} mascota(s).`);
    } catch (error) {
        manejarErrorAxios(error);
    }
}

async function buscarPorNombre() {
    const nombre = document.getElementById("input-nombre-get").value.trim();
    if (!nombre) { mostrarAlerta("advertencia", "Campo vacío", "Ingresa el nombre a buscar."); return; }

    try {
        const respuesta = await axios.get("/mascotas", { params: { nombre } });
        renderizarTabla(respuesta.data);
        mostrarAlerta("exito", "Mascota encontrada", `Se encontró a "${nombre}".`);
    } catch (error) {
        manejarErrorAxios(error);
    }
}

async function buscarPorRut() {
    const rut = document.getElementById("input-rut-get").value.trim();
    if (!rut) { mostrarAlerta("advertencia", "Campo vacío", "Ingresa el RUT a buscar."); return; }

    try {
        const respuesta = await axios.get("/mascotas", { params: { rut } });
        renderizarTabla(respuesta.data);
        mostrarAlerta("exito", "Búsqueda exitosa", `${respuesta.data.length} mascota(s) para el RUT "${rut}".`);
    } catch (error) {
        manejarErrorAxios(error);
    }
}

async function eliminarPorNombre() {
    const nombre = document.getElementById("input-nombre-delete").value.trim();
    if (!nombre) { mostrarAlerta("advertencia", "Campo vacío", "Ingresa el nombre a eliminar."); return; }

    try {
        const respuesta = await axios.delete("/mascotas", { params: { nombre } });
        mostrarAlerta("exito", "✅ Eliminada", respuesta.data.mensaje);
        document.getElementById("input-nombre-delete").value = "";
        obtenerTodas();
    } catch (error) {
        manejarErrorAxios(error);
    }
}

async function eliminarPorRut() {
    const rut = document.getElementById("input-rut-delete").value.trim();
    if (!rut) { mostrarAlerta("advertencia", "Campo vacío", "Ingresa el RUT para eliminar."); return; }

    try {
        const respuesta = await axios.delete("/mascotas", { params: { rut } });
        mostrarAlerta("exito", "✅ Eliminadas", respuesta.data.mensaje);
        document.getElementById("input-rut-delete").value = "";
        obtenerTodas();
    } catch (error) {
        manejarErrorAxios(error);
    }
}