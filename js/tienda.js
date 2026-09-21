// Codigo de las paginas publicas (home, tatuadores, perfil, solicitud y mis solicitudes).
// Cada pagina tiene <body data-pagina="..."> y aqui se decide que funcion correr.

document.addEventListener("DOMContentLoaded", function () {
    pintarZonaSesion("");
    actualizarContadorSolicitud();

    const pagina = document.body.dataset.pagina;

    if (pagina === "home") {
        iniciarHome();
    } else if (pagina === "tatuadores") {
        iniciarTatuadores();
    } else if (pagina === "detalle") {
        iniciarDetalle();
    } else if (pagina === "solicitud") {
        iniciarSolicitud();
    } else if (pagina === "mis-solicitudes") {
        iniciarMisSolicitudes();
    }
});

// ------------------------------------------------------------
// Cosas que se usan en varias paginas
// ------------------------------------------------------------

// Aviso chico abajo a la derecha (Toast de Bootstrap)
function mostrarToast(texto, tipo) {
    let zona = document.getElementById("zonaToasts");
    if (!zona) {
        zona = document.createElement("div");
        zona.id = "zonaToasts";
        zona.className = "toast-container position-fixed bottom-0 end-0 p-3";
        document.body.appendChild(zona);
    }

    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-bg-" + (tipo || "dark") + " border-0";
    toast.setAttribute("role", "alert");
    toast.innerHTML =
        '<div class="d-flex">' +
        '<div class="toast-body">' + escapar(texto) + "</div>" +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>' +
        "</div>";
    zona.appendChild(toast);

    const aviso = new bootstrap.Toast(toast, { delay: 2500 });
    aviso.show();
    toast.addEventListener("hidden.bs.toast", function () {
        toast.remove();
    });
}

// Tarjeta de un tatuador (se usa en home, tatuadores y relacionados)
function tarjetaTatuador(tatuador) {
    const sinCupos = tatuador.cupos <= 0;
    const enlace = "tatuador-detalle.html?codigo=" + encodeURIComponent(tatuador.codigo);

    let boton = '<button type="button" class="btn btn-acento btn-sm btnSolicitar" data-codigo="' + escapar(tatuador.codigo) + '">Solicitar</button>';
    if (sinCupos) {
        boton = '<button type="button" class="btn btn-secondary btn-sm" disabled>Sin cupos</button>';
    }

    let aviso = "";
    if (!sinCupos && tieneCuposCriticos(tatuador)) {
        aviso = '<span class="insignia-cupos">Últimos cupos</span>';
    }

    return (
        '<div class="col-6 col-md-4 col-lg-3">' +
        '<article class="tarjeta-tatuador">' +
        '<a href="' + enlace + '" class="imagen-tatuador">' +
        '<img src="' + escapar(imagenDe(tatuador)) + '" alt="Trabajo de ' + escapar(tatuador.nombre) + ', estilo ' + escapar(tatuador.estilo) + '" width="600" height="600" loading="lazy" class="img-fluid">' +
        "</a>" +
        '<div class="cuerpo-tatuador">' +
        '<span class="etiqueta-categoria">' + escapar(tatuador.estilo) + "</span>" +
        '<h3 class="nombre-tatuador"><a href="' + enlace + '">' + escapar(tatuador.nombre) + "</a></h3>" +
        '<p class="meta-tatuador">' + escapar(tatuador.ciudad) + " · " + escapar(tatuador.estudio) + "</p>" +
        aviso +
        '<div class="fila-precio">' +
        '<span class="precio">' + precioPorHora(tatuador) + "</span>" +
        boton +
        "</div>" +
        "</div>" +
        "</article>" +
        "</div>"
    );
}

// Un solo "escuchador" para todos los botones "Solicitar" de la pagina
document.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".btnSolicitar");
    if (!boton) {
        return;
    }
    const resultado = agregarASolicitud(boton.dataset.codigo, 1);
    mostrarToast(resultado.mensaje, resultado.ok ? "success" : "danger");
});

// ------------------------------------------------------------
// Home
// ------------------------------------------------------------

function iniciarHome() {
    // destacados: los primeros 8 que tengan cupos
    const destacados = Tatuadores.todos().filter(function (t) {
        return t.cupos > 0;
    }).slice(0, 8);
    document.getElementById("listaDestacados").innerHTML = destacados.map(tarjetaTatuador).join("");
}

// ------------------------------------------------------------
// Tatuadores (lista con filtros por estilo, ciudad y buscador)
// ------------------------------------------------------------

function iniciarTatuadores() {
    const contenedor = document.getElementById("listaTatuadores");
    const filtros = document.getElementById("filtrosEstilo");
    const selectCiudad = document.getElementById("filtroCiudad");
    const buscador = document.getElementById("buscador");
    const soloCupos = document.getElementById("soloConCupos");
    const cantidad = document.getElementById("cantidadResultados");

    const parametros = new URLSearchParams(window.location.search);

    let estiloActual = parametros.get("estilo") || "Todos";
    if (estiloActual !== "Todos" && ESTILOS.indexOf(estiloActual) === -1) {
        estiloActual = "Todos";
    }

    CIUDADES.forEach(function (ciudad) {
        const opcion = document.createElement("option");
        opcion.value = ciudad;
        opcion.textContent = ciudad;
        selectCiudad.appendChild(opcion);
    });
    if (CIUDADES.indexOf(parametros.get("ciudad")) !== -1) {
        selectCiudad.value = parametros.get("ciudad");
    }

    function pintarFiltros() {
        filtros.innerHTML = ["Todos"].concat(ESTILOS).map(function (estilo) {
            const clase = estilo === estiloActual ? "btn-filtro activo" : "btn-filtro";
            return '<button type="button" class="btn ' + clase + '" data-estilo="' + escapar(estilo) + '">' + escapar(estilo) + "</button>";
        }).join("");
    }

    function pintarLista() {
        const texto = buscador.value.trim().toLowerCase();

        const lista = Tatuadores.todos().filter(function (t) {
            const coincideEstilo = estiloActual === "Todos" || t.estilo === estiloActual;
            const coincideCiudad = selectCiudad.value === "" || t.ciudad === selectCiudad.value;
            const coincideTexto = (t.nombre + " " + t.estudio).toLowerCase().indexOf(texto) !== -1;
            const coincideCupos = !soloCupos.checked || t.cupos > 0;
            return coincideEstilo && coincideCiudad && coincideTexto && coincideCupos;
        });

        if (lista.length === 0) {
            contenedor.innerHTML = '<p class="text-center text-muted py-4">No encontramos tatuadores con esos filtros. Prueba con otro estilo o ciudad.</p>';
        } else {
            contenedor.innerHTML = lista.map(tarjetaTatuador).join("");
        }
        cantidad.textContent = lista.length === 1 ? "1 tatuador" : lista.length + " tatuadores";
    }

    filtros.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button");
        if (!boton) {
            return;
        }
        estiloActual = boton.dataset.estilo;
        pintarFiltros();
        pintarLista();
    });

    buscador.addEventListener("input", pintarLista);
    selectCiudad.addEventListener("change", pintarLista);
    soloCupos.addEventListener("change", pintarLista);

    pintarFiltros();
    pintarLista();
}

// ------------------------------------------------------------
// Perfil de un tatuador (el codigo viene en la URL: ?codigo=TAT001)
// ------------------------------------------------------------

// Si la imagen termina en -1.svg hay 3 trabajos (-1, -2 y -3)
function galeriaDe(tatuador) {
    const imagen = imagenDe(tatuador);
    if (/-1\.svg$/.test(imagen)) {
        return [imagen, imagen.replace("-1.svg", "-2.svg"), imagen.replace("-1.svg", "-3.svg")];
    }
    return [imagen];
}

function iniciarDetalle() {
    const codigo = new URLSearchParams(window.location.search).get("codigo");
    const tatuador = codigo ? Tatuadores.buscar(codigo) : null;
    const contenedor = document.getElementById("detalleTatuador");
    const migas = document.getElementById("migas");

    if (!tatuador) {
        migas.innerHTML = '<li class="breadcrumb-item"><a href="index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">Tatuador no encontrado</li>';
        contenedor.innerHTML = '<div class="col-12"><div class="alert alert-warning">No encontramos ese tatuador. <a href="tatuadores.html" class="alert-link">Volver a la lista de tatuadores</a>.</div></div>';
        document.getElementById("seccionRelacionados").classList.add("d-none");
        return;
    }

    document.title = tatuador.nombre + " - Tatuadores Malditos";

    migas.innerHTML =
        '<li class="breadcrumb-item"><a href="index.html">Home</a></li>' +
        '<li class="breadcrumb-item"><a href="tatuadores.html?estilo=' + encodeURIComponent(tatuador.estilo) + '">' + escapar(tatuador.estilo) + "</a></li>" +
        '<li class="breadcrumb-item active" aria-current="page">' + escapar(tatuador.nombre) + "</li>";

    const trabajos = galeriaDe(tatuador);
    let miniaturas = "";
    if (trabajos.length > 1) {
        miniaturas = trabajos.map(function (foto, i) {
            return '<button type="button" class="miniatura' + (i === 0 ? " activa" : "") + '" data-foto="' + escapar(foto) + '" aria-label="Ver trabajo ' + (i + 1) + '">' +
                '<img src="' + escapar(foto) + '" alt="" width="80" height="80"></button>';
        }).join("");
    }

    // estado de los cupos
    let textoCupos = '<span class="text-success">Cupos disponibles este mes: ' + tatuador.cupos + "</span>";
    if (tatuador.cupos <= 0) {
        textoCupos = '<span class="text-danger fw-bold">Sin cupos este mes</span>';
    } else if (tieneCuposCriticos(tatuador)) {
        textoCupos = '<span class="text-warning fw-bold">¡Últimos cupos! Quedan ' + tatuador.cupos + " este mes</span>";
    }

    let opciones = "";
    for (let i = 1; i <= MAX_HORAS; i++) {
        opciones += '<option value="' + i + '">' + i + (i === 1 ? " hora" : " horas") + "</option>";
    }

    let zonaSolicitud = '<p class="alert alert-secondary">Este tatuador no tiene cupos por ahora. Vuelve a revisar el próximo mes.</p>';
    if (tatuador.cupos > 0) {
        zonaSolicitud =
            '<div class="mb-3">' +
            '<label for="horas" class="form-label">Horas estimadas de sesión</label>' +
            '<select id="horas" class="form-select selector-horas">' + opciones + "</select>" +
            '<div class="form-text">Puedes ajustarlas después en tu solicitud.</div>' +
            "</div>" +
            '<button type="button" id="btnAgregarDetalle" class="btn btn-acento btn-lg w-100">Agregar a mi solicitud</button>';
    }

    contenedor.innerHTML =
        '<div class="col-lg-7">' +
        '<figure class="galeria">' +
        '<img id="imagenPrincipal" src="' + escapar(trabajos[0]) + '" alt="Trabajo de ' + escapar(tatuador.nombre) + '" width="600" height="600" class="img-fluid">' +
        "</figure>" +
        '<p class="etiqueta-galeria">Trabajos de ' + escapar(tatuador.nombre) + "</p>" +
        '<div class="miniaturas" id="miniaturas">' + miniaturas + "</div>" +
        "</div>" +
        '<div class="col-lg-5">' +
        '<article class="info-detalle">' +
        '<p class="etiqueta-categoria">' + escapar(tatuador.estilo) + " · Código " + escapar(tatuador.codigo) + "</p>" +
        "<h1>" + escapar(tatuador.nombre) + "</h1>" +
        '<p class="meta-tatuador">' + escapar(tatuador.ciudad) + " · " + escapar(tatuador.estudio) + "</p>" +
        '<p class="precio-detalle">' + precioPorHora(tatuador) + "</p>" +
        "<hr>" +
        "<p>" + escapar(tatuador.descripcion) + "</p>" +
        '<p class="mb-3">' + textoCupos + "</p>" +
        zonaSolicitud +
        '<p class="mt-3 mb-0"><a href="solicitud.html">Ir a mi solicitud de cita</a></p>' +
        "</article>" +
        "</div>";

    // cambiar el trabajo grande al hacer clic en una miniatura
    const zonaMiniaturas = document.getElementById("miniaturas");
    zonaMiniaturas.addEventListener("click", function (evento) {
        const boton = evento.target.closest(".miniatura");
        if (!boton) {
            return;
        }
        document.getElementById("imagenPrincipal").src = boton.dataset.foto;
        zonaMiniaturas.querySelectorAll(".miniatura").forEach(function (m) {
            m.classList.remove("activa");
        });
        boton.classList.add("activa");
    });

    const botonAgregar = document.getElementById("btnAgregarDetalle");
    if (botonAgregar) {
        botonAgregar.addEventListener("click", function () {
            const horas = parseInt(document.getElementById("horas").value);
            const resultado = agregarASolicitud(tatuador.codigo, horas);
            mostrarToast(resultado.mensaje, resultado.ok ? "success" : "danger");
        });
    }

    // otros tatuadores: primero los del mismo estilo
    let relacionados = Tatuadores.todos().filter(function (t) {
        return t.estilo === tatuador.estilo && t.codigo !== tatuador.codigo;
    });
    const otros = Tatuadores.todos().filter(function (t) {
        return t.estilo !== tatuador.estilo;
    });
    relacionados = relacionados.concat(otros).slice(0, 4);
    document.getElementById("listaRelacionados").innerHTML = relacionados.map(tarjetaTatuador).join("");
}

// ------------------------------------------------------------
// Solicitud de cita (el carrito del marketplace)
// ------------------------------------------------------------

function filaSolicitud(fila) {
    const t = fila.tatuador;
    return (
        '<article class="fila-solicitud">' +
        '<a href="tatuador-detalle.html?codigo=' + encodeURIComponent(t.codigo) + '"><img src="' + escapar(imagenDe(t)) + '" alt="Trabajo de ' + escapar(t.nombre) + '" width="90" height="90"></a>' +
        '<div class="info-solicitud">' +
        "<h3>" + escapar(t.nombre) + "</h3>" +
        '<p class="text-muted small mb-0">' + escapar(t.estilo) + " · " + escapar(t.ciudad) + " · " + precioPorHora(t) + "</p>" +
        '<button type="button" class="btn btn-link btn-sm text-danger p-0 btnQuitar" data-codigo="' + escapar(t.codigo) + '">Quitar</button>' +
        "</div>" +
        '<div class="control-horas">' +
        '<button type="button" class="btn btn-outline-secondary btn-sm btnMenos" data-codigo="' + escapar(t.codigo) + '" aria-label="Quitar una hora">−</button>' +
        '<span class="horas-actuales" aria-live="polite">' + fila.horas + " h</span>" +
        '<button type="button" class="btn btn-outline-secondary btn-sm btnMas" data-codigo="' + escapar(t.codigo) + '" aria-label="Agregar una hora">+</button>' +
        "</div>" +
        '<div class="precio-linea">' + formatoPrecio(t.precio * fila.horas) + "</div>" +
        "</article>"
    );
}

function iniciarSolicitud() {
    const lista = document.getElementById("listaSolicitud");
    const resumen = document.getElementById("resumenSolicitud");
    const campoCupon = document.getElementById("cupon");

    // el comentario para el tatuador es opcional (maximo 500 caracteres)
    const validadores = {
        comentario: function (valor) {
            return validarTexto(valor, false, 500, "", "comentario");
        }
    };
    activarValidacion(validadores);
    activarContador("comentario", 0, 500);

    function pintar() {
        const detalle = detalleSolicitud();

        if (detalle.length === 0) {
            lista.innerHTML =
                '<div class="solicitud-vacia">' +
                '<p class="lead">Todavía no agregas ningún tatuador a tu solicitud.</p>' +
                '<a class="btn btn-acento" href="tatuadores.html">Buscar tatuadores</a>' +
                "</div>";
            resumen.classList.add("d-none");
            return;
        }

        resumen.classList.remove("d-none");
        lista.innerHTML = detalle.map(filaSolicitud).join("");

        const totales = calcularTotales();
        document.getElementById("montoSubtotal").textContent = "$" + totales.subtotal.toLocaleString("es-CL");
        document.getElementById("montoTotal").textContent = "$" + totales.total.toLocaleString("es-CL");

        const filaDescuento = document.getElementById("filaDescuento");
        const cupon = obtenerCupon();
        if (totales.descuento > 0) {
            filaDescuento.classList.remove("d-none");
            document.getElementById("nombreCupon").textContent = "Cupón " + cupon + " (-" + CUPONES[cupon] + "%)";
            document.getElementById("montoDescuento").textContent = "-$" + totales.descuento.toLocaleString("es-CL");
        } else {
            filaDescuento.classList.add("d-none");
        }
    }

    // botones + / - / quitar de cada fila
    lista.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button");
        if (!boton || !boton.dataset.codigo) {
            return;
        }
        const codigo = boton.dataset.codigo;
        const item = obtenerSolicitud().find(function (i) {
            return i.codigo === codigo;
        });

        if (boton.classList.contains("btnMas")) {
            if (item.horas >= MAX_HORAS) {
                mostrarToast("Una sesión no puede pasar de " + MAX_HORAS + " horas.", "warning");
            }
            cambiarHorasSolicitud(codigo, item.horas + 1);
        } else if (boton.classList.contains("btnMenos")) {
            cambiarHorasSolicitud(codigo, item.horas - 1);
        } else if (boton.classList.contains("btnQuitar")) {
            quitarDeSolicitud(codigo);
        }
        pintar();
    });

    // cupon de descuento
    document.getElementById("formCupon").addEventListener("submit", function (evento) {
        evento.preventDefault();
        const resultado = aplicarCupon(campoCupon.value);

        if (resultado.ok) {
            mostrarOk(campoCupon);
            document.getElementById("mensajeCupon").textContent = resultado.mensaje;
            pintar();
        } else {
            mostrarError(campoCupon, resultado.mensaje);
            document.getElementById("mensajeCupon").textContent = "";
        }
    });

    campoCupon.addEventListener("input", function () {
        limpiarEstado(campoCupon);
    });

    document.getElementById("btnVaciar").addEventListener("click", function () {
        if (confirm("¿Seguro que quieres vaciar tu solicitud?")) {
            vaciarSolicitud();
            document.getElementById("mensajeSolicitud").innerHTML = "";
            pintar();
        }
    });

    document.getElementById("btnEnviar").addEventListener("click", function () {
        if (validarTodo(validadores) > 0) {
            return;
        }

        const resultado = enviarSolicitud(document.getElementById("comentario").value);

        if (!resultado.ok) {
            let enlace = "";
            if (resultado.pedirLogin) {
                enlace = ' <a href="login.html?volver=solicitud.html" class="alert-link">Inicia sesión aquí</a>.';
            }
            document.getElementById("mensajeSolicitud").innerHTML =
                '<div class="alert alert-warning" role="alert">' + escapar(resultado.mensaje) + enlace + "</div>";
            return;
        }

        document.getElementById("mensajeSolicitud").innerHTML = "";
        resumen.classList.add("d-none");

        const filas = resultado.solicitudes.map(function (s) {
            return "<li>Solicitud N° <strong>" + s.id + "</strong> · " + escapar(s.tatuador) + " · " + s.horas + (s.horas === 1 ? " hora" : " horas") +
                " · total estimado $" + s.total.toLocaleString("es-CL") + "</li>";
        }).join("");

        lista.innerHTML =
            '<div class="solicitud-vacia">' +
            '<h2 class="h4">¡Solicitud enviada!</h2>' +
            "<p>Cada tatuador recibió tu solicitud y te responderá pronto. El estado lo puedes ver en <strong>Mis solicitudes</strong>.</p>" +
            '<ul class="list-unstyled">' + filas + "</ul>" +
            '<a class="btn btn-acento me-2" href="mis-solicitudes.html">Ver mis solicitudes</a>' +
            '<a class="btn btn-outline-dark" href="tatuadores.html">Seguir buscando</a>' +
            "</div>";
    });

    pintar();
}

// ------------------------------------------------------------
// Mis solicitudes (solo para clientes)
// ------------------------------------------------------------

function iniciarMisSolicitudes() {
    const contenedor = document.getElementById("listaMisSolicitudes");
    const sesion = obtenerSesion();

    if (sesion === null) {
        contenedor.innerHTML =
            '<div class="alert alert-info">Inicia sesión para ver tus solicitudes. ' +
            '<a href="login.html?volver=mis-solicitudes.html" class="alert-link">Ir a iniciar sesión</a>.</div>';
        return;
    }
    if (sesion.tipo !== "Cliente") {
        contenedor.innerHTML =
            '<div class="alert alert-info">Esta página es para clientes. Tus solicitudes las revisas en el <a href="admin/index.html" class="alert-link">panel</a>.</div>';
        return;
    }

    const mias = Solicitudes.todas().filter(function (s) {
        return s.correo.toLowerCase() === sesion.correo.toLowerCase();
    }).reverse();

    if (mias.length === 0) {
        contenedor.innerHTML =
            '<div class="solicitud-vacia"><p class="lead">Todavía no has enviado solicitudes.</p>' +
            '<a class="btn btn-acento" href="tatuadores.html">Buscar tatuadores</a></div>';
        return;
    }

    const filas = mias.map(function (s) {
        let comentario = "";
        if (s.comentario) {
            comentario = '<br><small class="text-muted">«' + escapar(s.comentario) + "»</small>";
        }
        return (
            "<tr>" +
            "<td>#" + s.id + "</td>" +
            "<td>" + escapar(s.fecha) + "</td>" +
            '<td><a href="tatuador-detalle.html?codigo=' + encodeURIComponent(s.codigoTatuador) + '">' + escapar(s.tatuador) + "</a>" + comentario + "</td>" +
            '<td class="text-end">' + s.horas + " h</td>" +
            '<td class="text-end">$' + s.total.toLocaleString("es-CL") + "</td>" +
            '<td><span class="badge ' + claseEstado(s.estado) + '">' + escapar(s.estado) + "</span></td>" +
            "</tr>"
        );
    }).join("");

    contenedor.innerHTML =
        '<div class="table-responsive"><table class="table table-hover align-middle">' +
        '<caption class="visually-hidden">Solicitudes de cita enviadas</caption>' +
        "<thead><tr>" +
        '<th scope="col">N°</th><th scope="col">Fecha</th><th scope="col">Tatuador</th>' +
        '<th scope="col" class="text-end">Horas</th><th scope="col" class="text-end">Total estimado</th><th scope="col">Estado</th>' +
        "</tr></thead><tbody>" + filas + "</tbody></table></div>";
}
