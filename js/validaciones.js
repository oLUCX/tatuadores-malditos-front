// Validaciones de los formularios hechas con JavaScript.
//
// Cada funcion "validarXxx" recibe el texto del campo y devuelve:
//   - "" (texto vacio) si esta todo bien
//   - un mensaje de error si algo esta mal
// Despues las funciones de abajo muestran el mensaje debajo del campo
// usando las clases de Bootstrap (is-invalid / is-valid / invalid-feedback).

const DOMINIOS_PERMITIDOS = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];

// Errores de tipeo comunes en los dominios, para dar una sugerencia
const DOMINIOS_CON_ERROR = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gmil.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gmail.co": "gmail.com",
    "gmail.cl": "gmail.com",
    "duoc.com": "duoc.cl",
    "duoc.c": "duoc.cl",
    "duco.cl": "duoc.cl",
    "duok.cl": "duoc.cl",
    "profesor.duoc.com": "profesor.duoc.cl",
    "profesor.duco.cl": "profesor.duoc.cl"
};

// ---------------------------------------------------------------
// Validaciones (devuelven "" si esta bien o el mensaje de error)
// ---------------------------------------------------------------

function validarCorreo(valor, obligatorio) {
    const correo = valor.trim();

    if (correo === "") {
        return obligatorio ? "El correo es obligatorio." : "";
    }
    if (correo.length > 100) {
        return "El correo no puede tener más de 100 caracteres (tiene " + correo.length + ").";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return "El correo no tiene un formato válido. Ejemplo: nombre@duoc.cl";
    }

    const dominio = correo.split("@")[1].toLowerCase();
    if (DOMINIOS_PERMITIDOS.indexOf(dominio) === -1) {
        return "El dominio @" + dominio + " no está permitido. Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.";
    }
    return "";
}

// Si el dominio parece un error de tipeo devuelve una sugerencia
function sugerirCorreo(valor) {
    const partes = valor.trim().split("@");
    if (partes.length !== 2 || partes[0] === "") {
        return "";
    }
    const dominio = partes[1].toLowerCase();
    if (DOMINIOS_CON_ERROR[dominio]) {
        return "¿Quisiste decir " + partes[0] + "@" + DOMINIOS_CON_ERROR[dominio] + "?";
    }
    return "";
}

// Contraseña: obligatoria, entre 4 y 10 caracteres
function validarClave(valor) {
    if (valor === "") {
        return "La contraseña es obligatoria.";
    }
    if (valor.length < 4) {
        return "La contraseña debe tener al menos 4 caracteres (tiene " + valor.length + ").";
    }
    if (valor.length > 10) {
        return "La contraseña no puede tener más de 10 caracteres (tiene " + valor.length + ").";
    }
    return "";
}

function validarTexto(valor, obligatorio, max, mensajeObligatorio, nombreCampo) {
    const texto = valor.trim();

    if (texto === "") {
        return obligatorio ? mensajeObligatorio : "";
    }
    if (texto.length > max) {
        return "El campo " + nombreCampo + " no puede tener más de " + max + " caracteres (tiene " + texto.length + ").";
    }
    return "";
}

// Nombres y apellidos: solo letras, espacios, apostrofe y guion
function validarNombrePersona(valor, max, mensajeObligatorio, nombreCampo) {
    const mensaje = validarTexto(valor, true, max, mensajeObligatorio, nombreCampo);
    if (mensaje !== "") {
        return mensaje;
    }
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(valor.trim())) {
        return "El campo " + nombreCampo + " solo puede tener letras y espacios.";
    }
    return "";
}

function calcularDv(cuerpo) {
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const resto = 11 - (suma % 11);
    if (resto === 11) {
        return "0";
    }
    if (resto === 10) {
        return "K";
    }
    return String(resto);
}

// RUN sin puntos ni guion, entre 7 y 9 caracteres, con digito verificador correcto
function validarRun(valor) {
    const run = valor.trim().toUpperCase();

    if (run === "") {
        return "El RUN es obligatorio.";
    }
    if (/[.\-]/.test(run)) {
        return "Escribe el RUN sin puntos ni guion. Ejemplo: 19011022K";
    }
    if (!/^[0-9]+[0-9K]$/.test(run)) {
        return "El RUN solo puede tener números y una K al final.";
    }
    if (run.length < 7) {
        return "El RUN debe tener al menos 7 caracteres (tiene " + run.length + ").";
    }
    if (run.length > 9) {
        return "El RUN no puede tener más de 9 caracteres (tiene " + run.length + ").";
    }

    const cuerpo = run.slice(0, -1);
    const dv = run.slice(-1);
    if (calcularDv(cuerpo) !== dv) {
        return "El RUN no es válido: el dígito verificador no corresponde.";
    }
    return "";
}

// obligatorio (true/false), minimo, soloEntero (true/false), nombre del campo
function validarNumero(valor, obligatorio, minimo, soloEntero, nombreCampo) {
    const texto = String(valor).trim();

    if (texto === "") {
        return obligatorio ? "El " + nombreCampo + " es obligatorio." : "";
    }

    const numero = Number(texto);
    if (isNaN(numero)) {
        return "El " + nombreCampo + " debe ser un número.";
    }
    if (soloEntero && !Number.isInteger(numero)) {
        return "El " + nombreCampo + " debe ser un número entero (sin decimales).";
    }
    if (numero < minimo) {
        return "El " + nombreCampo + " no puede ser menor a " + minimo + ".";
    }
    return "";
}

function validarFechaNacimiento(valor) {
    if (valor === "") {
        return "";
    }

    const fecha = new Date(valor + "T00:00:00");
    if (isNaN(fecha.getTime())) {
        return "La fecha de nacimiento no es válida.";
    }
    if (fecha > new Date()) {
        return "La fecha de nacimiento no puede ser una fecha futura.";
    }
    if (fecha.getFullYear() < 1900) {
        return "La fecha de nacimiento no puede ser anterior al año 1900.";
    }
    return "";
}

function validarTelefono(valor) {
    const telefono = valor.replace(/\s/g, "");

    if (telefono === "") {
        return "";
    }
    if (!/^9[0-9]{8}$/.test(telefono)) {
        return "El teléfono debe tener 9 dígitos y empezar con 9. Ejemplo: 912345678";
    }
    return "";
}

function validarSeleccion(valor, mensaje) {
    if (valor === "") {
        return mensaje;
    }
    return "";
}

// ---------------------------------------------------------------
// Mostrar los resultados en pantalla
// ---------------------------------------------------------------

function mostrarError(campo, mensaje) {
    campo.classList.remove("is-valid");
    campo.classList.add("is-invalid");
    campo.setAttribute("aria-invalid", "true");

    const caja = campo.parentElement.querySelector(".invalid-feedback");
    if (caja) {
        caja.textContent = mensaje;
    }
}

function mostrarOk(campo) {
    campo.classList.remove("is-invalid");
    campo.classList.add("is-valid");
    campo.setAttribute("aria-invalid", "false");
}

function limpiarEstado(campo) {
    campo.classList.remove("is-invalid");
    campo.classList.remove("is-valid");
    campo.removeAttribute("aria-invalid");
}

// Valida un solo campo. Devuelve true si esta bien.
function validarUno(campo, validador) {
    const mensaje = validador(campo.value);

    if (mensaje !== "") {
        mostrarError(campo, mensaje);
        return false;
    }

    // un campo opcional que quedo vacio no se pinta de verde
    if (campo.value.trim() === "") {
        limpiarEstado(campo);
    } else {
        mostrarOk(campo);
    }
    return true;
}

// validadores es un objeto: { idDelCampo: funcionQueValida }
// Valida cuando se sale del campo (blur) y despues en tiempo real mientras se escribe.
function activarValidacion(validadores) {
    Object.keys(validadores).forEach(function (id) {
        const campo = document.getElementById(id);
        if (!campo) {
            return;
        }

        campo.addEventListener("blur", function () {
            campo.dataset.tocado = "si";
            validarUno(campo, validadores[id]);
        });

        campo.addEventListener("input", function () {
            if (campo.dataset.tocado === "si") {
                validarUno(campo, validadores[id]);
            }
        });

        campo.addEventListener("change", function () {
            campo.dataset.tocado = "si";
            validarUno(campo, validadores[id]);
        });
    });
}

// Valida todos los campos al apretar el boton. Devuelve la cantidad de errores.
function validarTodo(validadores) {
    let errores = 0;
    let primerCampoMalo = null;

    Object.keys(validadores).forEach(function (id) {
        const campo = document.getElementById(id);
        if (!campo) {
            return;
        }
        campo.dataset.tocado = "si";
        if (!validarUno(campo, validadores[id])) {
            errores++;
            if (primerCampoMalo === null) {
                primerCampoMalo = campo;
            }
        }
    });

    if (primerCampoMalo !== null) {
        primerCampoMalo.focus();
    }
    return errores;
}

// Cuadro rojo o verde de arriba del formulario
function mostrarResumen(idContenedor, errores) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) {
        return;
    }
    if (errores === 0) {
        contenedor.innerHTML = "";
        return;
    }
    const texto = errores === 1 ? "Hay 1 campo con errores." : "Hay " + errores + " campos con errores.";
    contenedor.innerHTML = '<div class="alert alert-danger" role="alert">' + texto + " Revisa los mensajes en rojo debajo de cada campo.</div>";
}

function mostrarMensaje(idContenedor, tipo, texto) {
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) {
        contenedor.innerHTML = '<div class="alert alert-' + tipo + '" role="alert">' + escapar(texto) + "</div>";
    }
}

// ---------------------------------------------------------------
// Sugerencias dinamicas
// ---------------------------------------------------------------

// Sugerencia de correo mientras se escribe (ej: gmial.com -> gmail.com)
function activarSugerenciaCorreo(idCampo) {
    const campo = document.getElementById(idCampo);
    if (!campo) {
        return;
    }
    const caja = campo.parentElement.querySelector(".sugerencia");
    if (!caja) {
        return;
    }
    campo.addEventListener("input", function () {
        caja.textContent = sugerirCorreo(campo.value);
    });
}

// Contador de caracteres: "12 / 500"
function activarContador(idCampo, min, max) {
    const campo = document.getElementById(idCampo);
    if (!campo) {
        return;
    }
    const caja = campo.parentElement.querySelector(".contador");
    if (!caja) {
        return;
    }

    function actualizar() {
        const largo = campo.value.length;
        caja.textContent = largo + " / " + max + " caracteres";
        if (largo > max || (min > 0 && largo > 0 && largo < min)) {
            caja.className = "contador text-danger";
        } else {
            caja.className = "contador text-muted";
        }
    }

    campo.addEventListener("input", actualizar);
    actualizar();
}

// ---------------------------------------------------------------
// Formulario de newsletter (esta en el footer de todas las paginas)
// ---------------------------------------------------------------

function iniciarNewsletter() {
    const formulario = document.getElementById("formNewsletter");
    if (!formulario) {
        return;
    }

    const validadores = {
        correoNewsletter: function (valor) {
            return validarCorreo(valor, true);
        }
    };

    activarValidacion(validadores);
    activarSugerenciaCorreo("correoNewsletter");

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        if (validarTodo(validadores) > 0) {
            return;
        }

        const campo = document.getElementById("correoNewsletter");
        const suscriptores = leerLS("suscriptores", []);
        suscriptores.push(campo.value.trim());
        guardarLS("suscriptores", suscriptores);

        formulario.reset();
        limpiarEstado(campo);
        campo.dataset.tocado = "";
        mostrarMensaje("mensajeNewsletter", "success", "¡Listo! Te suscribiste al newsletter.");
    });
}

document.addEventListener("DOMContentLoaded", iniciarNewsletter);
