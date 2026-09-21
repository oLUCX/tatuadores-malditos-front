// Manejo de la sesion del usuario (guardada en localStorage).
// OJO: esto es solo el front. En un sistema real la clave no se guarda
// aqui, la validaria un servidor.

function obtenerSesion() {
    return leerLS("sesion", null);
}

function iniciarSesion(correo, password) {
    const usuario = Usuarios.buscarPorCorreo(correo);

    if (!usuario || usuario.password !== password) {
        return null;
    }

    const sesion = {
        run: usuario.run,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo: usuario.tipo,
        codigoTatuador: usuario.codigoTatuador || ""
    };
    guardarLS("sesion", sesion);
    return sesion;
}

function cerrarSesion(rutaInicio) {
    localStorage.removeItem("sesion");
    window.location.href = rutaInicio;
}

// Dependiendo del tipo de usuario se manda a la tienda o al panel
function rutaSegunTipo(sesion, prefijo) {
    if (sesion.tipo === "Cliente") {
        return prefijo + "index.html";
    }
    return prefijo + "admin/index.html";
}

// Cambia los links de arriba: "Iniciar sesión | Registrar usuario" o "Hola X | Cerrar sesión"
function pintarZonaSesion(prefijo) {
    const zona = document.getElementById("zonaSesion");
    if (!zona) {
        return;
    }

    const sesion = obtenerSesion();

    if (sesion === null) {
        zona.innerHTML =
            '<a class="enlace-sesion" href="' + prefijo + 'login.html">Iniciar sesión</a>' +
            '<span class="separador-sesion">|</span>' +
            '<a class="enlace-sesion" href="' + prefijo + 'registro.html">Registrar usuario</a>';
        return;
    }

    // el cliente ve sus solicitudes; el tatuador y el administrador van al panel
    let enlaceExtra = "";
    if (sesion.tipo === "Cliente") {
        enlaceExtra = '<a class="enlace-sesion" href="' + prefijo + 'mis-solicitudes.html">Mis solicitudes</a><span class="separador-sesion">|</span>';
    } else {
        enlaceExtra = '<a class="enlace-sesion" href="' + prefijo + 'admin/index.html">Panel</a><span class="separador-sesion">|</span>';
    }

    zona.innerHTML =
        '<span class="saludo-sesion">Hola, ' + escapar(sesion.nombre) + '</span>' +
        '<span class="separador-sesion">|</span>' +
        enlaceExtra +
        '<a class="enlace-sesion" href="#" id="btnCerrarSesion">Cerrar sesión</a>';

    document.getElementById("btnCerrarSesion").addEventListener("click", function (evento) {
        evento.preventDefault();
        cerrarSesion(prefijo + "index.html");
    });
}

// Se usa en las paginas del administrador: si no hay sesion o el tipo de
// usuario no esta permitido, se saca a la persona de la pagina.
function protegerAdmin(tiposPermitidos) {
    const sesion = obtenerSesion();

    if (sesion === null) {
        window.location.replace("../login.html");
        return null;
    }

    if (tiposPermitidos.indexOf(sesion.tipo) === -1) {
        window.location.replace("../index.html");
        return null;
    }

    return sesion;
}
