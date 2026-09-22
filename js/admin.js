// Codigo del panel de administracion (carpeta admin/).
//
// Tipos de usuario:
//  - Administrador: acceso total
//  - Tatuador: ve el panel, edita SU propio perfil, ve la lista de tatuadores
//    y las solicitudes que le llegan a el (y las puede aceptar o rechazar)
//  - Cliente: solo puede usar la parte publica (si intenta entrar aqui lo sacamos)
//
// OJO: como es solo el front, esta proteccion se hace con JavaScript. En un sistema
// real el servidor tambien tendria que revisar los permisos.

document.addEventListener("DOMContentLoaded", function () {
    const pagina = document.body.dataset.pagina;

    let tiposPermitidos = ["Administrador", "Tatuador"];
    if (pagina === "usuarios" || pagina === "usuario-form") {
        tiposPermitidos = ["Administrador"];
    }

    const sesion = protegerAdmin(tiposPermitidos);
    if (sesion === null) {
        return;
    }

    // Se quitan del menu (y de la pagina) las cosas que este tipo de usuario no puede ver
    document.querySelectorAll("[data-solo]").forEach(function (elemento) {
        if (elemento.dataset.solo.split(",").indexOf(sesion.tipo) === -1) {
            elemento.remove();
        }
    });

    document.getElementById("nombreAdmin").textContent = sesion.nombre + " (" + sesion.tipo + ")";
    document.getElementById("btnCerrarSesionAdmin").addEventListener("click", function () {
        cerrarSesion("../index.html");
    });

    // los links "Mi perfil" del tatuador apuntan a su propio perfil
    document.querySelectorAll(".enlace-mi-perfil").forEach(function (enlace) {
        enlace.href = "tatuador-form.html?codigo=" + encodeURIComponent(sesion.codigoTatuador);
    });

    // cuando el tatuador esta en su perfil, se marca "Mi perfil" en el menu (y no "Tatuadores")
    const linkPerfil = document.getElementById("linkMiPerfil");
    if (linkPerfil && pagina === "tatuador-form") {
        const activo = document.querySelector(".admin-menu .nav-link.active");
        if (activo) {
            activo.classList.remove("active");
            activo.removeAttribute("aria-current");
        }
        linkPerfil.classList.add("active");
    }

    if (pagina === "dashboard") {
        iniciarDashboard(sesion);
    } else if (pagina === "tatuadores") {
        iniciarListaTatuadores(sesion);
    } else if (pagina === "tatuador-form") {
        iniciarFormTatuador(sesion);
    } else if (pagina === "usuarios") {
        iniciarListaUsuarios(sesion);
    } else if (pagina === "usuario-form") {
        iniciarFormUsuario("admin");
    } else if (pagina === "solicitudes") {
        iniciarSolicitudes(sesion);
    }
});

// Desde la carpeta admin/ las imagenes locales hay que buscarlas una carpeta mas arriba
function rutaImagenAdmin(tatuador) {
    const imagen = imagenDe(tatuador);
    if (imagen.indexOf("data:") === 0 || imagen.indexOf("http") === 0) {
        return imagen;
    }
    return "../" + imagen;
}

function abrirModal(titulo, cuerpoHtml) {
    document.getElementById("tituloDetalle").textContent = titulo;
    document.getElementById("cuerpoDetalle").innerHTML = cuerpoHtml;
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDetalle"));
    modal.show();
}

// Mensaje verde de "guardado" cuando se vuelve del formulario (?guardado=creado)
function mostrarAvisoGuardado(nombreCosa) {
    const guardado = new URLSearchParams(window.location.search).get("guardado");
    if (guardado === "creado") {
        mostrarMensaje("avisoAdmin", "success", nombreCosa + " creado correctamente.");
    } else if (guardado === "editado") {
        mostrarMensaje("avisoAdmin", "success", nombreCosa + " actualizado correctamente.");
    }
}

function ponerTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor;
    }
}

// ------------------------------------------------------------
// Dashboard (home del panel)
// ------------------------------------------------------------

function iniciarDashboard(sesion) {
    const esAdmin = sesion.tipo === "Administrador";
    const tatuadores = Tatuadores.todos();

    // el tatuador solo cuenta sus propias solicitudes
    let solicitudes = Solicitudes.todas();
    if (!esAdmin) {
        solicitudes = solicitudes.filter(function (s) {
            return s.codigoTatuador === sesion.codigoTatuador;
        });
    }
    const pendientes = solicitudes.filter(function (s) {
        return s.estado === "Pendiente";
    });

    ponerTexto("saludo", "¡HOLA " + sesion.tipo.toUpperCase() + "!");
    ponerTexto("subSaludo", sesion.nombre + ", este es el resumen del marketplace.");
    ponerTexto("totalSolicitudes", solicitudes.length);
    ponerTexto("totalPendientes", pendientes.length);

    const zonaAlerta = document.getElementById("alertaCupos");

    if (esAdmin) {
        const criticos = tatuadores.filter(tieneCuposCriticos);
        ponerTexto("totalTatuadores", tatuadores.length);
        ponerTexto("totalUsuarios", Usuarios.todos().length);
        ponerTexto("totalCriticos", criticos.length);

        if (criticos.length === 0) {
            zonaAlerta.innerHTML = '<div class="alert alert-success" role="alert">Ningún tatuador tiene pocos cupos.</div>';
        } else {
            const filas = criticos.map(function (t) {
                return "<li><strong>" + escapar(t.nombre) + "</strong> (" + escapar(t.codigo) + "): quedan " + t.cupos +
                    " cupos, el mínimo es " + t.cuposCriticos + ".</li>";
            }).join("");
            zonaAlerta.innerHTML =
                '<div class="alert alert-warning" role="alert">' +
                '<h2 class="h6 mb-2">Alerta de cupos críticos</h2><ul class="mb-0">' + filas + "</ul></div>";
        }
        return;
    }

    // vista del tatuador
    const mio = Tatuadores.buscar(sesion.codigoTatuador);
    if (!mio) {
        ponerTexto("misCupos", "-");
        zonaAlerta.innerHTML = '<div class="alert alert-danger" role="alert">Tu usuario no tiene un perfil de tatuador asociado. Pídele al administrador que lo vincule.</div>';
        return;
    }

    ponerTexto("misCupos", mio.cupos);
    if (tieneCuposCriticos(mio)) {
        zonaAlerta.innerHTML =
            '<div class="alert alert-warning" role="alert">Te quedan pocos cupos este mes (' + mio.cupos +
            "). Actualiza tu disponibilidad en <strong>Mi perfil</strong>.</div>";
    } else {
        zonaAlerta.innerHTML = '<div class="alert alert-success" role="alert">Tienes cupos suficientes este mes.</div>';
    }
}

// ------------------------------------------------------------
// Lista de tatuadores
// ------------------------------------------------------------

function iniciarListaTatuadores(sesion) {
    const esAdmin = sesion.tipo === "Administrador";
    const tabla = document.getElementById("tablaTatuadores");
    const buscador = document.getElementById("buscadorTatuadores");
    const selectEstilo = document.getElementById("filtroEstilo");

    mostrarAvisoGuardado("Tatuador");

    ESTILOS.forEach(function (estilo) {
        const opcion = document.createElement("option");
        opcion.value = estilo;
        opcion.textContent = estilo;
        selectEstilo.appendChild(opcion);
    });

    function pintar() {
        const texto = buscador.value.trim().toLowerCase();
        const estilo = selectEstilo.value;

        const lista = Tatuadores.todos().filter(function (t) {
            const coincideTexto = t.nombre.toLowerCase().indexOf(texto) !== -1 || t.codigo.toLowerCase().indexOf(texto) !== -1;
            const coincideEstilo = estilo === "" || t.estilo === estilo;
            return coincideTexto && coincideEstilo;
        });

        if (lista.length === 0) {
            tabla.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay tatuadores que coincidan.</td></tr>';
            return;
        }

        tabla.innerHTML = lista.map(function (t) {
            let cupos = String(t.cupos);
            if (tieneCuposCriticos(t)) {
                cupos += ' <span class="badge text-bg-danger">Cupos críticos</span>';
            }

            let acciones = '<button type="button" class="btn btn-sm btn-outline-secondary btnVer" data-codigo="' + escapar(t.codigo) + '">Ver</button>';
            // el tatuador solo puede editar su propio perfil
            if (esAdmin || t.codigo === sesion.codigoTatuador) {
                acciones += ' <a class="btn btn-sm btn-outline-primary" href="tatuador-form.html?codigo=' + encodeURIComponent(t.codigo) + '">Editar</a>';
            }
            if (esAdmin) {
                acciones += ' <button type="button" class="btn btn-sm btn-outline-danger btnEliminar" data-codigo="' + escapar(t.codigo) + '">Eliminar</button>';
            }

            return (
                "<tr>" +
                '<td><img src="' + escapar(rutaImagenAdmin(t)) + '" alt="Trabajo de ' + escapar(t.nombre) + '" width="48" height="48" class="miniatura-tabla"></td>' +
                "<td>" + escapar(t.codigo) + "</td>" +
                "<td>" + escapar(t.nombre) + "</td>" +
                "<td>" + escapar(t.estilo) + "</td>" +
                "<td>" + escapar(t.ciudad) + "</td>" +
                '<td class="text-end">' + precioPorHora(t) + "</td>" +
                '<td class="text-end">' + cupos + "</td>" +
                '<td class="text-end">' + acciones + "</td>" +
                "</tr>"
            );
        }).join("");
    }

    tabla.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button");
        if (!boton) {
            return;
        }
        const tatuador = Tatuadores.buscar(boton.dataset.codigo);

        if (boton.classList.contains("btnVer")) {
            const critico = tieneCuposCriticos(tatuador) ? ' <span class="badge text-bg-danger">Cupos críticos</span>' : "";
            abrirModal(
                tatuador.nombre,
                '<div class="row g-3">' +
                '<div class="col-md-5"><img src="' + escapar(rutaImagenAdmin(tatuador)) + '" alt="Trabajo de ' + escapar(tatuador.nombre) + '" class="img-fluid rounded"></div>' +
                '<div class="col-md-7"><dl class="row mb-0">' +
                '<dt class="col-5">Código</dt><dd class="col-7">' + escapar(tatuador.codigo) + "</dd>" +
                '<dt class="col-5">Estilo</dt><dd class="col-7">' + escapar(tatuador.estilo) + "</dd>" +
                '<dt class="col-5">Ciudad</dt><dd class="col-7">' + escapar(tatuador.ciudad) + "</dd>" +
                '<dt class="col-5">Estudio</dt><dd class="col-7">' + (escapar(tatuador.estudio) || "No informado") + "</dd>" +
                '<dt class="col-5">Precio</dt><dd class="col-7">' + precioPorHora(tatuador) + "</dd>" +
                '<dt class="col-5">Cupos</dt><dd class="col-7">' + tatuador.cupos + critico + "</dd>" +
                '<dt class="col-5">Cupos críticos</dt><dd class="col-7">' + (tatuador.cuposCriticos === null || tatuador.cuposCriticos === "" ? "No definido" : tatuador.cuposCriticos) + "</dd>" +
                '<dt class="col-5">Descripción</dt><dd class="col-7">' + (escapar(tatuador.descripcion) || "Sin descripción") + "</dd>" +
                "</dl></div></div>"
            );
        }

        if (boton.classList.contains("btnEliminar")) {
            if (confirm("¿Eliminar el perfil de «" + tatuador.nombre + "»? Esta acción no se puede deshacer.")) {
                const lista = Tatuadores.todos().filter(function (t) {
                    return t.codigo !== tatuador.codigo;
                });
                Tatuadores.guardar(lista);

                // si algun usuario estaba asociado a ese perfil, se le quita
                const usuarios = Usuarios.todos();
                usuarios.forEach(function (u) {
                    if (u.codigoTatuador === tatuador.codigo) {
                        u.codigoTatuador = "";
                    }
                });
                Usuarios.guardar(usuarios);

                pintar();
                mostrarMensaje("avisoAdmin", "success", "Tatuador eliminado.");
            }
        }
    });

    buscador.addEventListener("input", pintar);
    selectEstilo.addEventListener("change", pintar);
    pintar();
}

// ------------------------------------------------------------
// Formulario de tatuador (nuevo, editar y "Mi perfil")
// Reglas (las del "producto" de la pauta, adaptadas):
//   codigo: obligatorio, texto, minimo 3
//   nombre artistico: obligatorio, maximo 100
//   descripcion: opcional, maximo 500
//   precio por hora: obligatorio, minimo 0, puede tener decimales
//   cupos: obligatorio, minimo 0, solo enteros
//   cupos criticos: opcional, minimo 0, solo enteros (alerta si cupos <= cupos criticos)
//   estilo y ciudad: obligatorios (select)
//   estudio: opcional, maximo 100
//   imagen: opcional (maximo 500 KB)
// ------------------------------------------------------------

function iniciarFormTatuador(sesion) {
    const esAdmin = sesion.tipo === "Administrador";
    const formulario = document.getElementById("formTatuador");
    const codigoEditado = new URLSearchParams(window.location.search).get("codigo");
    const editando = codigoEditado !== null;
    let tatuadorEditado = null;
    let imagenActual = "";

    // el tatuador solo puede abrir su propio perfil
    if (!esAdmin && codigoEditado !== sesion.codigoTatuador) {
        if (sesion.codigoTatuador) {
            window.location.replace("tatuador-form.html?codigo=" + encodeURIComponent(sesion.codigoTatuador));
        } else {
            mostrarMensaje("mensajeFormulario", "danger", "Tu usuario no tiene un perfil de tatuador asociado. Pídele al administrador que lo vincule.");
            formulario.classList.add("d-none");
        }
        return;
    }

    function llenarSelect(id, textoInicial, valores) {
        const select = document.getElementById(id);
        select.innerHTML = '<option value="">' + textoInicial + "</option>";
        valores.forEach(function (valor) {
            const opcion = document.createElement("option");
            opcion.value = valor;
            opcion.textContent = valor;
            select.appendChild(opcion);
        });
        return select;
    }

    const selectEstilo = llenarSelect("estilo", "-- Seleccione el estilo --", ESTILOS);
    const selectCiudad = llenarSelect("ciudad", "-- Seleccione la ciudad --", CIUDADES);

    const campoImagen = document.getElementById("imagen");
    const vistaPrevia = document.getElementById("vistaPrevia");

    const validadores = {
        codigo: function (valor) {
            const codigo = valor.trim();
            if (codigo === "") {
                return "El código del tatuador es obligatorio.";
            }
            if (codigo.length < 3) {
                return "El código debe tener al menos 3 caracteres (tiene " + codigo.length + ").";
            }
            const repetido = Tatuadores.todos().some(function (t) {
                return t.codigo.toLowerCase() === codigo.toLowerCase() && t.codigo !== codigoEditado;
            });
            if (repetido) {
                return "Ya existe un tatuador con el código «" + codigo + "». Usa otro código.";
            }
            return "";
        },
        nombre: function (valor) {
            return validarTexto(valor, true, 100, "El nombre artístico es obligatorio.", "nombre");
        },
        descripcion: function (valor) {
            return validarTexto(valor, false, 500, "", "descripción");
        },
        precio: function (valor) {
            return validarNumero(valor, true, 0, false, "precio por hora");
        },
        cupos: function (valor) {
            return validarNumero(valor, true, 0, true, "número de cupos");
        },
        cuposCriticos: function (valor) {
            return validarNumero(valor, false, 0, true, "número de cupos críticos");
        },
        estilo: function (valor) {
            return validarSeleccion(valor, "Selecciona un estilo.");
        },
        ciudad: function (valor) {
            return validarSeleccion(valor, "Selecciona una ciudad.");
        },
        estudio: function (valor) {
            return validarTexto(valor, false, 100, "", "estudio");
        },
        imagen: function () {
            const archivo = campoImagen.files[0];
            if (!archivo) {
                return "";
            }
            if (archivo.type.indexOf("image/") !== 0) {
                return "El archivo debe ser una imagen (JPG, PNG, SVG, etc.).";
            }
            if (archivo.size > 500 * 1024) {
                return "La imagen pesa " + Math.round(archivo.size / 1024) + " KB y el máximo permitido es 500 KB.";
            }
            return "";
        }
    };

    activarValidacion(validadores);
    activarContador("descripcion", 0, 500);

    // ---- avisos dinamicos: precio gratis y cupos criticos ----
    const avisoGratis = document.getElementById("avisoGratis");
    const avisoCupos = document.getElementById("avisoCupos");

    function revisarAvisos() {
        const precio = document.getElementById("precio").value.trim();
        avisoGratis.classList.toggle("d-none", !(precio !== "" && Number(precio) === 0));

        const cupos = document.getElementById("cupos").value.trim();
        const critico = document.getElementById("cuposCriticos").value.trim();
        if (cupos !== "" && critico !== "" && Number(cupos) <= Number(critico)) {
            avisoCupos.textContent = "Atención: con " + cupos + " cupos el perfil queda en estado crítico (el mínimo es " + critico + ").";
            avisoCupos.classList.remove("d-none");
        } else {
            avisoCupos.classList.add("d-none");
        }
    }

    ["precio", "cupos", "cuposCriticos"].forEach(function (id) {
        document.getElementById(id).addEventListener("input", revisarAvisos);
    });

    // ---- imagen: vista previa ----
    campoImagen.addEventListener("change", function () {
        const archivo = campoImagen.files[0];
        if (!archivo || validadores.imagen() !== "") {
            return;
        }
        const lector = new FileReader();
        lector.onload = function () {
            imagenActual = lector.result;
            vistaPrevia.src = imagenActual;
            vistaPrevia.classList.remove("d-none");
        };
        lector.readAsDataURL(archivo);
    });

    // ---- si es edicion se cargan los datos ----
    if (editando) {
        tatuadorEditado = Tatuadores.buscar(codigoEditado);

        if (!tatuadorEditado) {
            mostrarMensaje("mensajeFormulario", "danger", "No se encontró el tatuador con código " + codigoEditado + ".");
            formulario.classList.add("d-none");
            return;
        }

        document.getElementById("tituloFormulario").textContent = esAdmin ? "Editar tatuador" : "Mi perfil";
        document.getElementById("btnGuardarTatuador").textContent = "Guardar cambios";

        // el codigo no se cambia una vez creado (las solicitudes y los usuarios lo usan)
        const campoCodigo = document.getElementById("codigo");
        campoCodigo.value = tatuadorEditado.codigo;
        campoCodigo.readOnly = true;

        document.getElementById("nombre").value = tatuadorEditado.nombre;
        document.getElementById("descripcion").value = tatuadorEditado.descripcion || "";
        document.getElementById("precio").value = tatuadorEditado.precio;
        document.getElementById("cupos").value = tatuadorEditado.cupos;
        document.getElementById("cuposCriticos").value = tatuadorEditado.cuposCriticos === null ? "" : tatuadorEditado.cuposCriticos;
        selectEstilo.value = tatuadorEditado.estilo;
        selectCiudad.value = tatuadorEditado.ciudad;
        document.getElementById("estudio").value = tatuadorEditado.estudio || "";

        imagenActual = tatuadorEditado.imagen || "";
        if (imagenActual !== "") {
            vistaPrevia.src = rutaImagenAdmin(tatuadorEditado);
            vistaPrevia.classList.remove("d-none");
        }

        activarContador("descripcion", 0, 500);
        revisarAvisos();
    }

    // ---- guardar ----
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const errores = validarTodo(validadores);
        mostrarResumen("resumenErrores", errores);
        if (errores > 0) {
            return;
        }

        const critico = document.getElementById("cuposCriticos").value.trim();

        const tatuador = {
            codigo: document.getElementById("codigo").value.trim(),
            nombre: document.getElementById("nombre").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim(),
            precio: Number(document.getElementById("precio").value),
            cupos: parseInt(document.getElementById("cupos").value),
            cuposCriticos: critico === "" ? null : parseInt(critico),
            estilo: selectEstilo.value,
            ciudad: selectCiudad.value,
            estudio: document.getElementById("estudio").value.trim(),
            imagen: imagenActual
        };

        const lista = Tatuadores.todos();

        if (editando) {
            const posicion = lista.findIndex(function (t) {
                return t.codigo === tatuadorEditado.codigo;
            });
            lista[posicion] = tatuador;
        } else {
            lista.push(tatuador);
        }

        Tatuadores.guardar(lista);
        window.location.href = "tatuadores.html?guardado=" + (editando ? "editado" : "creado");
    });
}

// ------------------------------------------------------------
// Lista de usuarios
// ------------------------------------------------------------

function iniciarListaUsuarios(sesion) {
    const tabla = document.getElementById("tablaUsuarios");
    const buscador = document.getElementById("buscadorUsuarios");

    mostrarAvisoGuardado("Usuario");

    function pintar() {
        const texto = buscador.value.trim().toLowerCase();

        const lista = Usuarios.todos().filter(function (u) {
            const completo = (u.run + " " + u.nombre + " " + u.apellidos + " " + u.correo).toLowerCase();
            return completo.indexOf(texto) !== -1;
        });

        if (lista.length === 0) {
            tabla.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay usuarios que coincidan.</td></tr>';
            return;
        }

        tabla.innerHTML = lista.map(function (u) {
            const claseTipo = u.tipo === "Administrador" ? "text-bg-danger" : (u.tipo === "Tatuador" ? "text-bg-info" : "text-bg-secondary");
            const esYo = u.run === sesion.run;
            const perfil = u.tipo === "Tatuador" && u.codigoTatuador ? " (" + escapar(u.codigoTatuador) + ")" : "";

            return (
                "<tr>" +
                "<td>" + escapar(u.run) + "</td>" +
                "<td>" + escapar(u.nombre) + " " + escapar(u.apellidos) + "</td>" +
                "<td>" + escapar(u.correo) + "</td>" +
                '<td><span class="badge ' + claseTipo + '">' + escapar(u.tipo) + "</span>" + perfil + "</td>" +
                "<td>" + escapar(u.comuna) + ", " + escapar(u.region) + "</td>" +
                '<td class="text-end">' +
                '<button type="button" class="btn btn-sm btn-outline-secondary btnVer" data-run="' + escapar(u.run) + '">Ver</button> ' +
                '<a class="btn btn-sm btn-outline-primary" href="usuario-form.html?run=' + encodeURIComponent(u.run) + '">Editar</a> ' +
                '<button type="button" class="btn btn-sm btn-outline-danger btnEliminar" data-run="' + escapar(u.run) + '"' + (esYo ? ' disabled title="No puedes eliminar tu propia cuenta"' : "") + ">Eliminar</button>" +
                "</td>" +
                "</tr>"
            );
        }).join("");
    }

    tabla.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button");
        if (!boton) {
            return;
        }
        const usuario = Usuarios.buscarPorRun(boton.dataset.run);

        if (boton.classList.contains("btnVer")) {
            const perfil = usuario.tipo === "Tatuador" && usuario.codigoTatuador ? usuario.codigoTatuador : "No aplica";
            abrirModal(
                usuario.nombre + " " + usuario.apellidos,
                '<dl class="row mb-0">' +
                '<dt class="col-sm-4">RUN</dt><dd class="col-sm-8">' + escapar(usuario.run) + "</dd>" +
                '<dt class="col-sm-4">Correo</dt><dd class="col-sm-8">' + escapar(usuario.correo) + "</dd>" +
                '<dt class="col-sm-4">Tipo de usuario</dt><dd class="col-sm-8">' + escapar(usuario.tipo) + "</dd>" +
                '<dt class="col-sm-4">Perfil de tatuador</dt><dd class="col-sm-8">' + escapar(perfil) + "</dd>" +
                '<dt class="col-sm-4">Teléfono</dt><dd class="col-sm-8">' + (escapar(usuario.telefono) || "No informado") + "</dd>" +
                '<dt class="col-sm-4">Fecha de nacimiento</dt><dd class="col-sm-8">' + (escapar(usuario.fechaNacimiento) || "No informada") + "</dd>" +
                '<dt class="col-sm-4">Región</dt><dd class="col-sm-8">' + escapar(usuario.region) + "</dd>" +
                '<dt class="col-sm-4">Comuna</dt><dd class="col-sm-8">' + escapar(usuario.comuna) + "</dd>" +
                '<dt class="col-sm-4">Dirección</dt><dd class="col-sm-8">' + escapar(usuario.direccion) + "</dd>" +
                "</dl>"
            );
        }

        if (boton.classList.contains("btnEliminar")) {
            if (confirm("¿Eliminar al usuario " + usuario.nombre + " " + usuario.apellidos + "? Esta acción no se puede deshacer.")) {
                const lista = Usuarios.todos().filter(function (u) {
                    return u.run !== usuario.run;
                });
                Usuarios.guardar(lista);
                pintar();
                mostrarMensaje("avisoAdmin", "success", "Usuario eliminado.");
            }
        }
    });

    buscador.addEventListener("input", pintar);
    pintar();
}

// ------------------------------------------------------------
// Solicitudes de cita (lista, detalle y respuesta del tatuador)
// ------------------------------------------------------------

function iniciarSolicitudes(sesion) {
    const esAdmin = sesion.tipo === "Administrador";
    const tabla = document.getElementById("tablaSolicitudes");

    function pintar() {
        // el tatuador solo ve las solicitudes que le llegaron a el
        let lista = Solicitudes.todas().slice().reverse();
        if (!esAdmin) {
            lista = lista.filter(function (s) {
                return s.codigoTatuador === sesion.codigoTatuador;
            });
        }

        if (lista.length === 0) {
            tabla.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Todavía no hay solicitudes.</td></tr>';
            return;
        }

        tabla.innerHTML = lista.map(function (s) {
            let acciones = '<button type="button" class="btn btn-sm btn-outline-secondary btnDetalle" data-id="' + s.id + '">Ver detalle</button>';
            if (s.estado === "Pendiente") {
                acciones +=
                    ' <button type="button" class="btn btn-sm btn-success btnAceptar" data-id="' + s.id + '">Aceptar</button>' +
                    ' <button type="button" class="btn btn-sm btn-outline-danger btnRechazar" data-id="' + s.id + '">Rechazar</button>';
            }

            return (
                "<tr>" +
                "<td>#" + s.id + "</td>" +
                "<td>" + escapar(s.fecha) + "</td>" +
                "<td>" + escapar(s.cliente) + '<br><small class="text-muted">' + escapar(s.correo) + "</small></td>" +
                "<td>" + escapar(s.tatuador) + "</td>" +
                '<td class="text-end">' + s.horas + " h</td>" +
                '<td class="text-end">$' + s.total.toLocaleString("es-CL") + "</td>" +
                '<td><span class="badge ' + claseEstado(s.estado) + '">' + escapar(s.estado) + "</span></td>" +
                '<td class="text-end">' + acciones + "</td>" +
                "</tr>"
            );
        }).join("");
    }

    tabla.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button");
        if (!boton) {
            return;
        }
        const id = parseInt(boton.dataset.id);

        if (boton.classList.contains("btnAceptar") || boton.classList.contains("btnRechazar")) {
            const nuevoEstado = boton.classList.contains("btnAceptar") ? "Aceptada" : "Rechazada";
            if (responderSolicitud(id, nuevoEstado)) {
                pintar();
                mostrarMensaje("avisoAdmin", "success", "Solicitud #" + id + " " + nuevoEstado.toLowerCase() + ".");
            }
            return;
        }

        if (boton.classList.contains("btnDetalle")) {
            const s = Solicitudes.todas().find(function (x) {
                return x.id === id;
            });

            abrirModal(
                "Solicitud #" + s.id,
                '<dl class="row mb-3">' +
                '<dt class="col-sm-4">Cliente</dt><dd class="col-sm-8">' + escapar(s.cliente) + " (" + escapar(s.correo) + ")</dd>" +
                '<dt class="col-sm-4">Fecha</dt><dd class="col-sm-8">' + escapar(s.fecha) + "</dd>" +
                '<dt class="col-sm-4">Tatuador</dt><dd class="col-sm-8">' + escapar(s.tatuador) + " (" + escapar(s.codigoTatuador) + ")</dd>" +
                '<dt class="col-sm-4">Sesión</dt><dd class="col-sm-8">' + s.horas + (s.horas === 1 ? " hora" : " horas") + " × " + formatoPrecio(s.precioHora) + "</dd>" +
                '<dt class="col-sm-4">Comentario</dt><dd class="col-sm-8">' + (escapar(s.comentario) || "Sin comentario") + "</dd>" +
                '<dt class="col-sm-4">Estado</dt><dd class="col-sm-8"><span class="badge ' + claseEstado(s.estado) + '">' + escapar(s.estado) + "</span></dd>" +
                "</dl>" +
                '<p class="text-end mb-0">Subtotal: $' + s.subtotal.toLocaleString("es-CL") + "<br>" +
                "Descuento: -$" + s.descuento.toLocaleString("es-CL") + "<br>" +
                "<strong>Total estimado: $" + s.total.toLocaleString("es-CL") + "</strong></p>"
            );
        }
    });

    pintar();
}
