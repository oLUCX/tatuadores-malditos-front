// Funciones para leer y guardar cosas en el localStorage.
// Todo se guarda como JSON (texto), por eso se usa JSON.parse y JSON.stringify.

function leerLS(clave, porDefecto) {
    try {
        const texto = localStorage.getItem(clave);
        if (texto === null) {
            return porDefecto;
        }
        return JSON.parse(texto);
    } catch (error) {
        return porDefecto;
    }
}

function guardarLS(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

const Tatuadores = {
    todos: function () {
        let lista = leerLS("tatuadores", null);
        if (lista === null) {
            lista = TATUADORES_INICIALES;
            guardarLS("tatuadores", lista);
        }
        return lista;
    },
    buscar: function (codigo) {
        return this.todos().find(function (t) {
            return t.codigo === codigo;
        });
    },
    guardar: function (lista) {
        guardarLS("tatuadores", lista);
    }
};

const Usuarios = {
    todos: function () {
        let lista = leerLS("usuarios", null);
        if (lista === null) {
            lista = USUARIOS_INICIALES;
            guardarLS("usuarios", lista);
        }
        return lista;
    },
    buscarPorRun: function (run) {
        return this.todos().find(function (u) {
            return u.run === run;
        });
    },
    buscarPorCorreo: function (correo) {
        return this.todos().find(function (u) {
            return u.correo.toLowerCase() === correo.toLowerCase();
        });
    },
    guardar: function (lista) {
        guardarLS("usuarios", lista);
    }
};

// Solicitudes de cita que los clientes le envian a los tatuadores
const Solicitudes = {
    todas: function () {
        let lista = leerLS("solicitudes", null);
        if (lista === null) {
            lista = SOLICITUDES_INICIALES;
            guardarLS("solicitudes", lista);
        }
        return lista;
    },
    guardar: function (lista) {
        guardarLS("solicitudes", lista);
    },
    siguienteId: function () {
        const ids = this.todas().map(function (s) {
            return s.id;
        });
        return Math.max.apply(null, ids) + 1;
    }
};

const Mensajes = {
    todos: function () {
        return leerLS("mensajes", []);
    },
    agregar: function (mensaje) {
        const lista = this.todos();
        lista.push(mensaje);
        guardarLS("mensajes", lista);
    }
};

// Da formato de dinero chileno: 35000 -> $35.000
function formatoPrecio(numero) {
    if (Number(numero) === 0) {
        return "Gratis";
    }
    return "$" + Number(numero).toLocaleString("es-CL");
}

// Precio por hora del tatuador: "$35.000 / hora"
function precioPorHora(tatuador) {
    if (Number(tatuador.precio) === 0) {
        return "Consulta gratis";
    }
    return formatoPrecio(tatuador.precio) + " / hora";
}

// Si el tatuador no tiene foto se usa una por defecto
function imagenDe(tatuador) {
    return tatuador.imagen ? tatuador.imagen : "img/sin-imagen.svg";
}

// Los cupos criticos son opcionales. Hay alerta cuando los cupos son iguales o menores a ese numero.
function tieneCuposCriticos(tatuador) {
    if (tatuador.cuposCriticos === null || tatuador.cuposCriticos === undefined || tatuador.cuposCriticos === "") {
        return false;
    }
    return tatuador.cupos <= tatuador.cuposCriticos;
}

// Color del "badge" segun el estado de una solicitud
function claseEstado(estado) {
    if (estado === "Aceptada") {
        return "text-bg-success";
    }
    if (estado === "Rechazada") {
        return "text-bg-secondary";
    }
    return "text-bg-warning";
}

// Evita que un texto con etiquetas HTML se ejecute al pintarlo en la pagina
function escapar(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
