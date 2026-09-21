// Pagina de inicio de sesion
// Reglas: correo obligatorio, maximo 100 caracteres y solo dominios permitidos;
// contraseña obligatoria de 4 a 10 caracteres.

document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("formLogin");
    const campoCorreo = document.getElementById("correo");
    const campoPassword = document.getElementById("password");

    const validadores = {
        correo: function (valor) {
            return validarCorreo(valor, true);
        },
        password: validarClave
    };

    activarValidacion(validadores);
    activarSugerenciaCorreo("correo");
    activarContador("password", 4, 10);

    // Si el usuario ya tiene sesion no tiene sentido mostrar el login
    const sesionActual = obtenerSesion();
    if (sesionActual !== null) {
        mostrarMensaje("mensajeLogin", "info", "Ya iniciaste sesión como " + sesionActual.nombre + " (" + sesionActual.tipo + ").");
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        document.getElementById("mensajeLogin").innerHTML = "";

        const errores = validarTodo(validadores);
        mostrarResumen("resumenErrores", errores);
        if (errores > 0) {
            return;
        }

        const sesion = iniciarSesion(campoCorreo.value.trim(), campoPassword.value);

        if (sesion === null) {
            mostrarMensaje("mensajeLogin", "danger", "El correo o la contraseña son incorrectos. Revisa los datos e inténtalo de nuevo.");
            return;
        }

        // si venia desde la solicitud vuelve ahi (solo se aceptan nombres de pagina simples)
        const volver = new URLSearchParams(window.location.search).get("volver");
        if (volver && /^[a-z\-]+\.html$/.test(volver) && sesion.tipo === "Cliente") {
            window.location.href = volver;
            return;
        }

        window.location.href = rutaSegunTipo(sesion, "");
    });

    // Botones de la caja DEV: rellenan el formulario con una cuenta de prueba
    document.querySelectorAll(".btnCuentaDev").forEach(function (boton) {
        boton.addEventListener("click", function () {
            campoCorreo.value = boton.dataset.correo;
            campoPassword.value = boton.dataset.password;
            validarUno(campoCorreo, validadores.correo);
            validarUno(campoPassword, validadores.password);
            campoCorreo.dispatchEvent(new Event("input"));
            campoPassword.dispatchEvent(new Event("input"));
        });
    });
});
