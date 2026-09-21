// Logica de la "solicitud de cita" (es el carrito del marketplace).
// El cliente agrega tatuadores con las horas estimadas de sesion y despues envia la solicitud.
// Se guarda en localStorage con la clave "solicitud" como un arreglo de objetos:
//   { codigo: "TAT001", horas: 2 }
//
// Reglas de la solicitud:
//  - las horas minimas son 1 y las maximas son MAX_HORAS (8) por tatuador
//  - si el tatuador ya estaba en la solicitud, se suman las horas (no se repite la fila)
//  - un tatuador sin cupos este mes no se puede agregar
//  - el cupon PRIMERA10 hace 10% de descuento sobre el subtotal
//  - para enviar la solicitud hay que haber iniciado sesion como cliente
//  - al enviar, se crea una solicitud por cada tatuador y se descuenta 1 cupo a cada uno

function obtenerSolicitud() {
    return leerLS("solicitud", []);
}

function guardarSolicitud(solicitud) {
    guardarLS("solicitud", solicitud);
    actualizarContadorSolicitud();
}

// Cantidad de tatuadores que hay en la solicitud (las filas)
function contarTatuadoresSolicitud() {
    return obtenerSolicitud().length;
}

// Escribe la cantidad en el "Mi solicitud (n)" del menu
function actualizarContadorSolicitud() {
    const contador = document.getElementById("contadorSolicitud");
    if (contador) {
        contador.textContent = contarTatuadoresSolicitud();
    }
}

// Devuelve { ok: true/false, mensaje: "..." }
function agregarASolicitud(codigo, horas) {
    const tatuador = Tatuadores.buscar(codigo);

    if (!tatuador) {
        return { ok: false, mensaje: "El tatuador no existe." };
    }
    if (tatuador.cupos <= 0) {
        return { ok: false, mensaje: tatuador.nombre + " no tiene cupos disponibles este mes." };
    }
    if (!Number.isInteger(horas) || horas < 1) {
        return { ok: false, mensaje: "Las horas mínimas de una sesión son 1." };
    }

    const solicitud = obtenerSolicitud();
    const existente = solicitud.find(function (item) {
        return item.codigo === codigo;
    });

    const horasFinales = (existente ? existente.horas : 0) + horas;

    if (horasFinales > MAX_HORAS) {
        return {
            ok: false,
            mensaje: "Una sesión no puede pasar de " + MAX_HORAS + " horas (ya tienes " + (existente ? existente.horas : 0) + " con " + tatuador.nombre + ")."
        };
    }

    if (existente) {
        existente.horas = horasFinales;
    } else {
        solicitud.push({ codigo: codigo, horas: horas });
    }

    guardarSolicitud(solicitud);
    return { ok: true, mensaje: "«" + tatuador.nombre + "» se agregó a tu solicitud (" + horasFinales + (horasFinales === 1 ? " hora)." : " horas).") };
}

function cambiarHorasSolicitud(codigo, nuevasHoras) {
    const solicitud = obtenerSolicitud();
    const item = solicitud.find(function (i) {
        return i.codigo === codigo;
    });

    if (!item) {
        return;
    }

    if (nuevasHoras < 1) {
        nuevasHoras = 1;
    }
    if (nuevasHoras > MAX_HORAS) {
        nuevasHoras = MAX_HORAS;
    }

    item.horas = nuevasHoras;
    guardarSolicitud(solicitud);
}

function quitarDeSolicitud(codigo) {
    const solicitud = obtenerSolicitud().filter(function (item) {
        return item.codigo !== codigo;
    });
    guardarSolicitud(solicitud);
}

function vaciarSolicitud() {
    guardarSolicitud([]);
    localStorage.removeItem("cupon");
}

// Junta cada fila de la solicitud con los datos del tatuador
function detalleSolicitud() {
    const detalle = [];
    obtenerSolicitud().forEach(function (item) {
        const tatuador = Tatuadores.buscar(item.codigo);
        if (tatuador) {
            detalle.push({ tatuador: tatuador, horas: item.horas });
        }
    });
    return detalle;
}

function obtenerCupon() {
    return leerLS("cupon", null);
}

// Devuelve { ok, mensaje }
function aplicarCupon(texto) {
    const codigo = texto.trim().toUpperCase();

    if (codigo === "") {
        return { ok: false, mensaje: "Escribe el código del cupón." };
    }
    if (CUPONES[codigo] === undefined) {
        return { ok: false, mensaje: "El cupón «" + codigo + "» no existe o ya venció." };
    }

    guardarLS("cupon", codigo);
    return { ok: true, mensaje: "Cupón aplicado: " + CUPONES[codigo] + "% de descuento." };
}

// Descuento de un monto segun el cupon aplicado
function descuentoDe(monto) {
    const cupon = obtenerCupon();
    if (cupon && CUPONES[cupon] !== undefined) {
        return Math.round(monto * CUPONES[cupon] / 100);
    }
    return 0;
}

// Devuelve { subtotal, descuento, total } (total estimado de todas las filas)
function calcularTotales() {
    let subtotal = 0;
    let descuento = 0;
    detalleSolicitud().forEach(function (fila) {
        const montoFila = fila.tatuador.precio * fila.horas;
        subtotal += montoFila;
        descuento += descuentoDe(montoFila);
    });

    return { subtotal: subtotal, descuento: descuento, total: subtotal - descuento };
}

// Crea las solicitudes (una por tatuador), descuenta los cupos y vacia la solicitud.
// Devuelve { ok, mensaje, solicitudes }
function enviarSolicitud(comentario) {
    const sesion = obtenerSesion();
    if (sesion === null) {
        return { ok: false, mensaje: "Debes iniciar sesión para enviar tu solicitud.", pedirLogin: true };
    }
    if (sesion.tipo !== "Cliente") {
        return { ok: false, mensaje: "Solo los clientes pueden enviar solicitudes. Estás con una cuenta de tipo " + sesion.tipo + "." };
    }

    const detalle = detalleSolicitud();
    if (detalle.length === 0) {
        return { ok: false, mensaje: "Tu solicitud está vacía." };
    }

    // se revisan los cupos justo antes de enviar, por si cambiaron
    for (let i = 0; i < detalle.length; i++) {
        if (detalle[i].tatuador.cupos <= 0) {
            return { ok: false, mensaje: detalle[i].tatuador.nombre + " se quedó sin cupos este mes. Quítalo de tu solicitud para continuar." };
        }
    }

    const usuario = Usuarios.buscarPorCorreo(sesion.correo);
    const nombreCliente = usuario ? usuario.nombre + " " + usuario.apellidos : sesion.nombre;

    const lista = Solicitudes.todas();
    const tatuadores = Tatuadores.todos();
    const creadas = [];
    let id = Solicitudes.siguienteId();

    detalle.forEach(function (fila) {
        const subtotal = fila.tatuador.precio * fila.horas;
        const descuento = descuentoDe(subtotal);

        const solicitud = {
            id: id,
            fecha: new Date().toISOString().slice(0, 10),
            correo: sesion.correo,
            cliente: nombreCliente,
            codigoTatuador: fila.tatuador.codigo,
            tatuador: fila.tatuador.nombre,
            precioHora: fila.tatuador.precio,
            horas: fila.horas,
            comentario: comentario.trim(),
            subtotal: subtotal,
            descuento: descuento,
            total: subtotal - descuento,
            estado: "Pendiente"
        };
        lista.push(solicitud);
        creadas.push(solicitud);
        id++;

        // se descuenta un cupo al tatuador
        const t = tatuadores.find(function (x) {
            return x.codigo === fila.tatuador.codigo;
        });
        t.cupos = t.cupos - 1;
    });

    Solicitudes.guardar(lista);
    Tatuadores.guardar(tatuadores);
    vaciarSolicitud();

    return { ok: true, mensaje: "Solicitud enviada.", solicitudes: creadas };
}

// El tatuador (o el administrador) responde una solicitud pendiente.
// Si se rechaza, el cupo vuelve a quedar disponible.
function responderSolicitud(id, nuevoEstado) {
    const lista = Solicitudes.todas();
    const solicitud = lista.find(function (s) {
        return s.id === id;
    });

    if (!solicitud || solicitud.estado !== "Pendiente") {
        return false;
    }

    solicitud.estado = nuevoEstado;
    Solicitudes.guardar(lista);

    if (nuevoEstado === "Rechazada") {
        const tatuadores = Tatuadores.todos();
        const t = tatuadores.find(function (x) {
            return x.codigo === solicitud.codigoTatuador;
        });
        if (t) {
            t.cupos = t.cupos + 1;
            Tatuadores.guardar(tatuadores);
        }
    }
    return true;
}
