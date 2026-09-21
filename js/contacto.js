// Pagina de contacto
// Reglas: nombre obligatorio (max 100), correo con dominio permitido (max 100),
// comentario obligatorio (max 500).

document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("formContacto");

    const validadores = {
        nombre: function (valor) {
            return validarNombrePersona(valor, 100, "El nombre es obligatorio.", "nombre");
        },
        correo: function (valor) {
            return validarCorreo(valor, true);
        },
        comentario: function (valor) {
            return validarTexto(valor, true, 500, "El comentario es obligatorio.", "comentario");
        }
    };

    activarValidacion(validadores);
    activarSugerenciaCorreo("correo");
    activarContador("comentario", 0, 500);

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const errores = validarTodo(validadores);
        mostrarResumen("resumenErrores", errores);
        if (errores > 0) {
            document.getElementById("mensajeFormulario").innerHTML = "";
            return;
        }

        // el mensaje se guarda "de manera interna" en el localStorage
        Mensajes.agregar({
            fecha: new Date().toISOString().slice(0, 10),
            nombre: document.getElementById("nombre").value.trim(),
            correo: document.getElementById("correo").value.trim(),
            comentario: document.getElementById("comentario").value.trim()
        });

        formulario.reset();
        formulario.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
            limpiarEstado(campo);
            campo.dataset.tocado = "";
        });
        document.querySelector("#formContacto .contador").textContent = "0 / 500 caracteres";
        document.getElementById("resumenErrores").innerHTML = "";
        mostrarMensaje("mensajeFormulario", "success", "¡Gracias! Recibimos tu mensaje y te responderemos pronto.");
    });
});
