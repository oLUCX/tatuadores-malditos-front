// Formulario de usuario. Lo usan dos paginas:
//   - registro.html (tienda): el usuario que se registra queda como "Cliente"
//   - admin/usuario-form.html: el administrador crea o edita cualquier usuario
// El enunciado dice que son el mismo formulario, por eso comparten este archivo.

function iniciarFormUsuario(modo) {
    const formulario = document.getElementById("formUsuario");
    const esAdmin = modo === "admin";

    // Si en la URL viene ?run=... es porque el administrador esta editando
    const runEditado = new URLSearchParams(window.location.search).get("run");
    const editando = esAdmin && runEditado !== null;
    let usuarioEditado = null;

    const selectRegion = document.getElementById("region");
    const selectComuna = document.getElementById("comuna");

    // ---------- regiones y comunas ----------
    selectRegion.innerHTML = '<option value="">-- Seleccione la región --</option>';
    REGIONES.forEach(function (region) {
        const opcion = document.createElement("option");
        opcion.value = region.nombre;
        opcion.textContent = region.nombre;
        selectRegion.appendChild(opcion);
    });

    function llenarComunas(nombreRegion) {
        selectComuna.innerHTML = '<option value="">-- Seleccione la comuna --</option>';
        const region = REGIONES.find(function (r) {
            return r.nombre === nombreRegion;
        });
        if (!region) {
            return;
        }
        region.comunas.forEach(function (comuna) {
            const opcion = document.createElement("option");
            opcion.value = comuna;
            opcion.textContent = comuna;
            selectComuna.appendChild(opcion);
        });
    }

    llenarComunas("");

    // al cambiar la region cambian las comunas
    selectRegion.addEventListener("change", function () {
        llenarComunas(selectRegion.value);
    });

    // ---------- reglas de cada campo ----------
    const campoCorreo = document.getElementById("correo");
    const campoConfirmarCorreo = document.getElementById("confirmarCorreo");
    const campoPassword = document.getElementById("password");
    const campoConfirmarPassword = document.getElementById("confirmarPassword");

    const validadores = {
        run: function (valor) {
            const mensaje = validarRun(valor);
            if (mensaje !== "") {
                return mensaje;
            }
            if (!editando && Usuarios.buscarPorRun(valor.trim().toUpperCase())) {
                return "Ya existe un usuario registrado con ese RUN.";
            }
            return "";
        },
        nombre: function (valor) {
            return validarNombrePersona(valor, 50, "El nombre es obligatorio.", "nombre");
        },
        apellidos: function (valor) {
            return validarNombrePersona(valor, 100, "Los apellidos son obligatorios.", "apellidos");
        },
        correo: function (valor) {
            const mensaje = validarCorreo(valor, true);
            if (mensaje !== "") {
                return mensaje;
            }
            const existente = Usuarios.buscarPorCorreo(valor.trim());
            if (existente && existente.run !== runEditado) {
                return "Ese correo ya está registrado. Usa otro o inicia sesión.";
            }
            return "";
        },
        confirmarCorreo: function (valor) {
            if (valor.trim() === "") {
                return "Vuelve a escribir tu correo para confirmarlo.";
            }
            if (valor.trim().toLowerCase() !== campoCorreo.value.trim().toLowerCase()) {
                return "Los correos no coinciden.";
            }
            return "";
        },
        password: function (valor) {
            // al editar se puede dejar en blanco para mantener la clave actual
            if (editando && valor === "") {
                return "";
            }
            return validarClave(valor);
        },
        confirmarPassword: function (valor) {
            if (editando && campoPassword.value === "" && valor === "") {
                return "";
            }
            if (valor === "") {
                return "Vuelve a escribir la contraseña para confirmarla.";
            }
            if (valor !== campoPassword.value) {
                return "Las contraseñas no coinciden.";
            }
            return "";
        },
        telefono: validarTelefono,
        fechaNacimiento: validarFechaNacimiento,
        region: function (valor) {
            return validarSeleccion(valor, "Selecciona una región.");
        },
        comuna: function (valor) {
            return validarSeleccion(valor, "Selecciona una comuna.");
        },
        direccion: function (valor) {
            return validarTexto(valor, true, 300, "La dirección es obligatoria.", "dirección");
        }
    };

    // Solo en el formulario del administrador: si el tipo es "Tatuador" hay que elegir
    // cual es su perfil publicado (el que va a poder editar desde "Mi perfil")
    const selectTipo = document.getElementById("tipo");
    const selectPerfil = document.getElementById("perfilTatuador");

    function mostrarOcultarPerfil() {
        document.getElementById("grupoPerfil").classList.toggle("d-none", selectTipo.value !== "Tatuador");
    }

    if (esAdmin) {
        validadores.tipo = function (valor) {
            return validarSeleccion(valor, "Selecciona el tipo de usuario.");
        };

        selectPerfil.innerHTML = '<option value="">-- Seleccione el perfil --</option>';
        Tatuadores.todos().forEach(function (t) {
            const opcion = document.createElement("option");
            opcion.value = t.codigo;
            opcion.textContent = t.nombre + " (" + t.codigo + ")";
            selectPerfil.appendChild(opcion);
        });

        validadores.perfilTatuador = function (valor) {
            if (selectTipo.value !== "Tatuador") {
                return "";
            }
            if (valor === "") {
                return "Selecciona el perfil de tatuador que va a administrar este usuario.";
            }
            const otro = Usuarios.todos().find(function (u) {
                return u.codigoTatuador === valor && u.run !== runEditado;
            });
            if (otro) {
                return "Ese perfil ya está asociado a " + otro.nombre + " " + otro.apellidos + ".";
            }
            return "";
        };

        selectTipo.addEventListener("change", function () {
            mostrarOcultarPerfil();
            if (selectPerfil.dataset.tocado === "si") {
                validarUno(selectPerfil, validadores.perfilTatuador);
            }
        });
    }

    activarValidacion(validadores);
    activarSugerenciaCorreo("correo");
    activarSugerenciaCorreo("confirmarCorreo");
    activarContador("password", 4, 10);
    activarContador("direccion", 0, 300);

    // si cambia la contraseña o el correo se vuelve a revisar la confirmacion
    campoPassword.addEventListener("input", function () {
        if (campoConfirmarPassword.dataset.tocado === "si") {
            validarUno(campoConfirmarPassword, validadores.confirmarPassword);
        }
    });
    campoCorreo.addEventListener("input", function () {
        if (campoConfirmarCorreo.dataset.tocado === "si") {
            validarUno(campoConfirmarCorreo, validadores.confirmarCorreo);
        }
    });

    // ---------- si es edicion, se cargan los datos ----------
    if (editando) {
        usuarioEditado = Usuarios.buscarPorRun(runEditado);

        if (!usuarioEditado) {
            mostrarMensaje("mensajeFormulario", "danger", "No se encontró un usuario con el RUN " + runEditado + ".");
            formulario.classList.add("d-none");
            return;
        }

        document.getElementById("tituloFormulario").textContent = "Editar usuario";
        document.getElementById("btnGuardarUsuario").textContent = "Guardar cambios";

        document.getElementById("run").value = usuarioEditado.run;
        document.getElementById("run").readOnly = true;
        document.getElementById("nombre").value = usuarioEditado.nombre;
        document.getElementById("apellidos").value = usuarioEditado.apellidos;
        campoCorreo.value = usuarioEditado.correo;
        campoConfirmarCorreo.value = usuarioEditado.correo;
        document.getElementById("telefono").value = usuarioEditado.telefono || "";
        document.getElementById("fechaNacimiento").value = usuarioEditado.fechaNacimiento || "";
        selectTipo.value = usuarioEditado.tipo;
        selectPerfil.value = usuarioEditado.codigoTatuador || "";
        mostrarOcultarPerfil();
        selectRegion.value = usuarioEditado.region;
        llenarComunas(usuarioEditado.region);
        selectComuna.value = usuarioEditado.comuna;
        document.getElementById("direccion").value = usuarioEditado.direccion;

        document.getElementById("ayudaPassword").textContent = "Déjala en blanco para mantener la contraseña actual.";
        campoPassword.removeAttribute("required");
        campoConfirmarPassword.removeAttribute("required");
        activarContador("direccion", 0, 300);
    }

    // ---------- al apretar el boton ----------
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const errores = validarTodo(validadores);
        mostrarResumen("resumenErrores", errores);
        if (errores > 0) {
            return;
        }

        const usuario = {
            run: document.getElementById("run").value.trim().toUpperCase(),
            nombre: document.getElementById("nombre").value.trim(),
            apellidos: document.getElementById("apellidos").value.trim(),
            correo: campoCorreo.value.trim(),
            password: campoPassword.value,
            telefono: document.getElementById("telefono").value.replace(/\s/g, ""),
            fechaNacimiento: document.getElementById("fechaNacimiento").value,
            tipo: esAdmin ? selectTipo.value : "Cliente",
            codigoTatuador: esAdmin && selectTipo.value === "Tatuador" ? selectPerfil.value : "",
            region: selectRegion.value,
            comuna: selectComuna.value,
            direccion: document.getElementById("direccion").value.trim()
        };

        const lista = Usuarios.todos();

        if (editando) {
            // si la clave quedo en blanco se mantiene la anterior
            if (usuario.password === "") {
                usuario.password = usuarioEditado.password;
            }
            const posicion = lista.findIndex(function (u) {
                return u.run === usuarioEditado.run;
            });
            lista[posicion] = usuario;

            // si el admin se edito a si mismo se actualiza su sesion
            const sesion = obtenerSesion();
            if (sesion && sesion.run === usuario.run) {
                guardarLS("sesion", {
                    run: usuario.run,
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    tipo: usuario.tipo,
                    codigoTatuador: usuario.codigoTatuador
                });
            }
        } else {
            lista.push(usuario);
        }

        Usuarios.guardar(lista);

        if (esAdmin) {
            window.location.href = "usuarios.html?guardado=" + (editando ? "editado" : "creado");
            return;
        }

        // registro desde la tienda
        formulario.reset();
        formulario.querySelectorAll(".is-valid, .is-invalid").forEach(function (campo) {
            limpiarEstado(campo);
            campo.dataset.tocado = "";
        });
        llenarComunas("");
        document.getElementById("resumenErrores").innerHTML = "";
        document.getElementById("mensajeFormulario").innerHTML =
            '<div class="alert alert-success" role="alert">¡Cuenta creada con éxito! ' +
            '<a href="login.html" class="alert-link">Inicia sesión aquí</a>.</div>';
        window.scrollTo(0, 0);
    });
}
